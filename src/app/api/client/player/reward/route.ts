import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, unauthorized } from "@/lib/api-security";

type RewardPayload = {
  playerId?: string;
  levelId?: number;
  stars?: number;
};

function computeRewardedCoins(stars: number): number {
  const baseReward = 50;
  if (stars === 3) {
    return Math.floor(baseReward * 1.5);
  }
  return baseReward;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");
    if (!validateApiKey(apiKey || undefined)) {
      return unauthorized("Invalid API key");
    }

    const body = (await request.json()) as RewardPayload;

    const playerId = typeof body.playerId === "string" ? body.playerId.trim() : "";
    const levelId = typeof body.levelId === "number" ? Math.floor(body.levelId) : NaN;
    const stars = typeof body.stars === "number" ? Math.floor(body.stars) : NaN;

    if (!playerId) {
      return NextResponse.json({ error: "playerId is required" }, { status: 400 });
    }

    if (!Number.isInteger(levelId) || levelId < 1) {
      return NextResponse.json({ error: "levelId must be a positive integer" }, { status: 400 });
    }

    if (!Number.isInteger(stars) || stars < 0 || stars > 3) {
      return NextResponse.json({ error: "stars must be an integer from 0 to 3" }, { status: 400 });
    }

    const rewardedCoins = computeRewardedCoins(stars);

    const result = await prisma.$transaction(async (tx) => {
      const player = await tx.player.findUnique({
        where: { id: playerId },
        select: { id: true },
      });

      if (!player) {
        throw new Error("PLAYER_NOT_FOUND");
      }

      const level = await tx.level.findFirst({
        where: {
          OR: [{ id: levelId }, { levelNumber: levelId }],
        },
        select: { id: true },
      });

      if (!level) {
        throw new Error("LEVEL_NOT_FOUND");
      }

      const updatedPlayer = await tx.player.update({
        where: { id: player.id },
        data: {
          coins: { increment: rewardedCoins },
          currentLevel: { increment: 1 },
        },
        select: {
          id: true,
          coins: true,
          gems: true,
          currentLevel: true,
          updatedAt: true,
        },
      });

      await tx.walletTransaction.create({
        data: {
          playerId: player.id,
          amount: rewardedCoins,
          transactionType: "LEVEL_REWARD",
          referenceId: String(levelId),
        },
      });

      return updatedPlayer;
    });

    return NextResponse.json(
      {
        message: "Reward granted successfully",
        data: {
          playerId: result.id,
          levelId,
          stars,
          rewardedCoins,
          newBalance: {
            coins: result.coins,
            gems: result.gems,
          },
          currentLevel: result.currentLevel,
          updatedAt: result.updatedAt,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "PLAYER_NOT_FOUND") {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    if (error instanceof Error && error.message === "LEVEL_NOT_FOUND") {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    console.error("[/api/client/player/reward] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
