import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, unauthorized } from "@/lib/api-security";

type BuyPackagePayload = {
  playerId?: string;
  packageId?: number;
};

interface BoosterReward {
  boosterId?: number;
  quantity?: number;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");
    if (!validateApiKey(apiKey || undefined)) {
      return unauthorized("Invalid API key");
    }

    const body = (await request.json()) as BuyPackagePayload;

    const playerId = typeof body.playerId === "string" ? body.playerId.trim() : "";
    const packageId =
      typeof body.packageId === "number" ? Math.floor(body.packageId) : NaN;

    if (!playerId) {
      return NextResponse.json(
        { error: "playerId is required" },
        { status: 400 },
      );
    }

    if (!Number.isInteger(packageId) || packageId < 1) {
      return NextResponse.json(
        { error: "packageId must be a positive integer" },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify player exists
      const player = await tx.player.findUnique({
        where: { id: playerId },
        select: { id: true, coins: true, gems: true },
      });

      if (!player) {
        throw new Error("PLAYER_NOT_FOUND");
      }

      // 2. Verify package exists and is active
      const shopPackage = await tx.shopPackage.findUnique({
        where: { id: packageId },
        select: {
          id: true,
          name: true,
          coinReward: true,
          gemReward: true,
          boosterRewards: true,
          isActive: true,
        },
      });

      if (!shopPackage || !shopPackage.isActive) {
        throw new Error("PACKAGE_NOT_FOUND");
      }

      // 3. Update player balance
      const updatedPlayer = await tx.player.update({
        where: { id: playerId },
        data: {
          coins: { increment: shopPackage.coinReward },
          gems: { increment: shopPackage.gemReward },
        },
        select: {
          id: true,
          coins: true,
          gems: true,
          updatedAt: true,
        },
      });

      // 4. Write wallet transaction if rewards > 0
      if (shopPackage.coinReward > 0 || shopPackage.gemReward > 0) {
        const totalAmount = shopPackage.coinReward + shopPackage.gemReward;
        await tx.walletTransaction.create({
          data: {
            playerId,
            amount: totalAmount,
            transactionType: "BUY_PACKAGE",
            referenceId: packageId.toString(),
          },
        });
      }

      // 5. Process booster rewards via upsert
      const boosterRewards = Array.isArray(shopPackage.boosterRewards)
        ? (shopPackage.boosterRewards as BoosterReward[])
        : [];

      const updatedInventory = [];
      for (const reward of boosterRewards) {
        if (
          typeof reward.boosterId === "number" &&
          typeof reward.quantity === "number" &&
          reward.quantity > 0
        ) {
          const inventoryItem = await tx.playerInventory.upsert({
            where: {
              playerId_boosterId: {
                playerId,
                boosterId: reward.boosterId,
              },
            },
            create: {
              playerId,
              boosterId: reward.boosterId,
              quantity: reward.quantity,
            },
            update: {
              quantity: { increment: reward.quantity },
            },
            select: {
              id: true,
              boosterId: true,
              quantity: true,
              updatedAt: true,
            },
          });
          updatedInventory.push(inventoryItem);
        }
      }

      return {
        player: updatedPlayer,
        package: shopPackage,
        inventory: updatedInventory,
      };
    });

    return NextResponse.json(
      {
        message: "Package purchased successfully",
        data: {
          playerId: result.player.id,
          packageId,
          packageName: result.package.name,
          newBalance: {
            coins: result.player.coins,
            gems: result.player.gems,
          },
          rewards: {
            coinReward: result.package.coinReward,
            gemReward: result.package.gemReward,
            boosterRewards: result.inventory,
          },
          updatedAt: result.player.updatedAt,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "PLAYER_NOT_FOUND") {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    if (error instanceof Error && error.message === "PACKAGE_NOT_FOUND") {
      return NextResponse.json(
        { error: "Package not found or not active" },
        { status: 404 },
      );
    }

    console.error("[/api/client/player/buy-package] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
