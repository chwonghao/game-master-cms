import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifySession, unauthorized } from "@/lib/api-security";
import type { InputJsonValue } from "@prisma/client/runtime/client";

type CreateLevelBody = {
  levelNumber?: number;
  config?: unknown;
  settings?: unknown;
};

type RouteContext = {
  params: Promise<{ gameId: string }>;
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
    const { gameId } = await context.params;
    const gameIdInt = Number(gameId);

    if (Number.isNaN(gameIdInt)) {
      return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
    }

    const levels = await prisma.level.findMany({
      where: { gameId: gameIdInt },
      orderBy: { levelNumber: "asc" },
    });

    return NextResponse.json(levels);
  } catch (error) {
    console.error("Failed to fetch levels:", error);
    return NextResponse.json(
      { error: "Failed to fetch levels" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const session = await verifySession();
  if (!session) {
    return unauthorized();
  }

  try {
    const { gameId } = await context.params;
    const gameIdInt = Number(gameId);

    if (Number.isNaN(gameIdInt)) {
      return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
    }

    const body = (await request.json()) as CreateLevelBody;

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

    const level = await prisma.level.create({
      data: {
        gameId: gameIdInt,
        levelNumber: body.levelNumber,
        config: body.config,
        settings: body.settings,
      },
    });

    return NextResponse.json(level, { status: 201 });
  } catch (error) {
    console.error("Failed to create level:", error);
    return NextResponse.json(
      { error: "Failed to create level" },
      { status: 500 }
    );
  }
}
