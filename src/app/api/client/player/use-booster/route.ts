import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, unauthorized } from "@/lib/api-security";

type UseBoosterPayload = {
  playerId?: string;
  boosterId?: number;
  cost?: number;
};

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");
    if (!validateApiKey(apiKey || undefined)) {
      return unauthorized("Invalid API key");
    }

    const body = (await request.json()) as UseBoosterPayload;

    const playerId = typeof body.playerId === "string" ? body.playerId.trim() : "";
    const boosterId = typeof body.boosterId === "number" ? Math.floor(body.boosterId) : NaN;
    const requestedCost = typeof body.cost === "number" ? Math.floor(body.cost) : undefined;

    if (!playerId) {
      return NextResponse.json(
        { error: "playerId is required" },
        { status: 400 },
      );
    }

    if (!Number.isInteger(boosterId) || boosterId < 1) {
      return NextResponse.json(
        { error: "boosterId must be a positive integer" },
        { status: 400 },
      );
    }

    const booster = await prisma.booster.findUnique({
      where: { id: boosterId },
      select: {
        id: true,
        cost: true,
        isActive: true,
        currencyType: true,
      },
    });

    if (!booster || !booster.isActive) {
      return NextResponse.json({ error: "Booster not found" }, { status: 404 });
    }

    const serverCost = booster.cost;
    if (requestedCost !== undefined && requestedCost !== serverCost) {
      console.warn(
        `[/api/client/player/use-booster] Client cost mismatch for booster ${booster.id}. client=${requestedCost}, server=${serverCost}`,
      );
    }

    const updatedPlayer = await prisma.$transaction(async (tx) => {
      const existingPlayer = await tx.player.findUnique({
        where: { id: playerId },
        select: { id: true },
      });

      if (!existingPlayer) {
        throw new Error("PLAYER_NOT_FOUND");
      }

      if (booster.currencyType === "COIN") {
        const updated = await tx.player.updateMany({
          where: {
            id: existingPlayer.id,
            coins: { gte: serverCost },
          },
          data: {
            coins: { decrement: serverCost },
          },
        });

        if (updated.count === 0) {
          throw new Error("NOT_ENOUGH_BALANCE");
        }
      } else {
        const updated = await tx.player.updateMany({
          where: {
            id: existingPlayer.id,
            gems: { gte: serverCost },
          },
          data: {
            gems: { decrement: serverCost },
          },
        });

        if (updated.count === 0) {
          throw new Error("NOT_ENOUGH_BALANCE");
        }
      }

      await tx.walletTransaction.create({
        data: {
          playerId: existingPlayer.id,
          amount: -serverCost,
          transactionType: "USE_BOOSTER",
          referenceId: String(booster.id),
        },
      });

      return tx.player.findUnique({
        where: { id: existingPlayer.id },
        select: {
          id: true,
          coins: true,
          gems: true,
          updatedAt: true,
        },
      });
    });

    if (!updatedPlayer) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Booster used successfully",
        data: {
          playerId: updatedPlayer.id,
          boosterId: booster.id,
          currencyType: booster.currencyType,
          cost: serverCost,
          balance: {
            coins: updatedPlayer.coins,
            gems: updatedPlayer.gems,
          },
          updatedAt: updatedPlayer.updatedAt,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "PLAYER_NOT_FOUND") {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    if (error instanceof Error && error.message === "NOT_ENOUGH_BALANCE") {
      return NextResponse.json({ error: "Not enough balance" }, { status: 400 });
    }

    console.error("[/api/client/player/use-booster] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
