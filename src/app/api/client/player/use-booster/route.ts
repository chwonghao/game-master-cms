import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, unauthorized } from "@/lib/api-security";

type UseBoosterPayload = {
  playerId?: string;
  sessionId?: string;
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
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    const boosterId = typeof body.boosterId === "number" ? Math.floor(body.boosterId) : NaN;
    const cost = typeof body.cost === "number" ? Math.floor(body.cost) : NaN;

    if (!playerId && !sessionId) {
      return NextResponse.json(
        { error: "playerId or sessionId is required" },
        { status: 400 },
      );
    }

    if (!Number.isInteger(boosterId) || boosterId < 1) {
      return NextResponse.json(
        { error: "boosterId must be a positive integer" },
        { status: 400 },
      );
    }

    if (!Number.isInteger(cost) || cost < 0) {
      return NextResponse.json(
        { error: "cost must be a non-negative integer" },
        { status: 400 },
      );
    }

    const booster = await prisma.booster.findUnique({
      where: { id: boosterId },
      select: {
        id: true,
        isActive: true,
        currencyType: true,
      },
    });

    if (!booster || !booster.isActive) {
      return NextResponse.json({ error: "Booster not found" }, { status: 404 });
    }

    const player = playerId
      ? await prisma.player.findUnique({
          where: { id: playerId },
          select: { id: true },
        })
      : await prisma.player.findFirst({
          where: { sessionId },
          orderBy: { updatedAt: "desc" },
          select: { id: true },
        });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const updatedPlayer = await prisma.$transaction(async (tx) => {
      if (booster.currencyType === "COIN") {
        const updated = await tx.player.updateMany({
          where: {
            id: player.id,
            coins: { gte: cost },
          },
          data: {
            coins: { decrement: cost },
          },
        });

        if (updated.count === 0) {
          throw new Error("NOT_ENOUGH_BALANCE");
        }
      } else {
        const updated = await tx.player.updateMany({
          where: {
            id: player.id,
            gems: { gte: cost },
          },
          data: {
            gems: { decrement: cost },
          },
        });

        if (updated.count === 0) {
          throw new Error("NOT_ENOUGH_BALANCE");
        }
      }

      return tx.player.findUnique({
        where: { id: player.id },
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
          cost,
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
    if (error instanceof Error && error.message === "NOT_ENOUGH_BALANCE") {
      return NextResponse.json({ error: "Not enough balance" }, { status: 400 });
    }

    console.error("[/api/client/player/use-booster] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
