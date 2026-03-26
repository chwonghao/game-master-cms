import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifySession, unauthorized } from "@/lib/api-security";
import type { InputJsonValue } from "@prisma/client/runtime/client";

type RouteContext = {
  params: Promise<{ gameId: string; levelId: string }>;
};

type UpdateLevelBody = {
  levelNumber?: number;
  config?: unknown;
  settings?: unknown;
};

function isInputJsonValue(value: unknown): value is InputJsonValue {
  return value !== null && value !== undefined;
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await verifySession();
  if (!session) {
    return unauthorized();
  }

  try {
    const { gameId, levelId } = await context.params;
    const gameIdInt = Number(gameId);
    const levelIdInt = Number(levelId);

    if (Number.isNaN(gameIdInt) || Number.isNaN(levelIdInt)) {
      return NextResponse.json({ error: "Invalid route parameters" }, { status: 400 });
    }

    const level = await prisma.level.findFirst({
      where: {
        id: levelIdInt,
        gameId: gameIdInt,
      },
    });

    if (!level) {
      return NextResponse.json({ error: "Level not found." }, { status: 404 });
    }

    return NextResponse.json(level);
  } catch (error) {
    console.error("Failed to fetch level:", error);
    return NextResponse.json(
      { error: "Failed to fetch level" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await verifySession();
  if (!session) {
    return unauthorized();
  }

  try {
    const { gameId, levelId } = await context.params;
    const gameIdInt = Number(gameId);
    const levelIdInt = Number(levelId);

    if (Number.isNaN(gameIdInt) || Number.isNaN(levelIdInt)) {
      return NextResponse.json({ error: "Invalid route parameters" }, { status: 400 });
    }

    const body = (await request.json()) as UpdateLevelBody;

    if (typeof body.levelNumber !== "number") {
      return NextResponse.json(
        { error: "levelNumber must be a number." },
        { status: 400 }
      );
    }

    if (!isInputJsonValue(body.config) || !isInputJsonValue(body.settings)) {
      return NextResponse.json(
        { error: "Both config and settings payloads are required." },
        { status: 400 }
      );
    }

    const existing = await prisma.level.findFirst({
      where: {
        id: levelIdInt,
        gameId: gameIdInt,
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Level not found." }, { status: 404 });
    }

    const updated = await prisma.level.update({
      where: { id: levelIdInt },
      data: {
        levelNumber: body.levelNumber,
        config: body.config,
        settings: body.settings,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update level:", error);
    return NextResponse.json(
      { error: "Failed to update level" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await verifySession();
  if (!session) {
    return unauthorized();
  }

  try {
    const { gameId, levelId } = await context.params;
    const gameIdInt = Number(gameId);
    const levelIdInt = Number(levelId);

    if (Number.isNaN(gameIdInt) || Number.isNaN(levelIdInt)) {
      return NextResponse.json({ error: "Invalid route parameters" }, { status: 400 });
    }

    const existing = await prisma.level.findFirst({
      where: {
        id: levelIdInt,
        gameId: gameIdInt,
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Level not found." }, { status: 404 });
    }

    await prisma.level.delete({ where: { id: levelIdInt } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete level:", error);
    return NextResponse.json(
      { error: "Failed to delete level" },
      { status: 500 }
    );
  }
}
