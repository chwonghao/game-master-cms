import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifySession, unauthorized } from "@/lib/api-security";
import { Prisma } from "@/generated/prisma/client";
import type { GameStatus } from "@/types/game";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const session = await verifySession();
  if (!session) {
    return unauthorized();
  }

  try {
    const { gameId } = await params;
    const gameIdInt = Number(gameId);

    if (Number.isNaN(gameIdInt)) {
      return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
    }

    const game = await prisma.game.findUnique({
      where: { id: gameIdInt },
      include: {
        _count: {
          select: { levels: true, analytics: true },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error) {
    console.error("Failed to fetch game:", error);
    return NextResponse.json(
      { error: "Failed to fetch game" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const session = await verifySession();
  if (!session) {
    return unauthorized();
  }

  try {
    const { gameId } = await params;
    const gameIdInt = Number(gameId);

    if (Number.isNaN(gameIdInt)) {
      return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
    }

    const body = (await request.json()) as {
      title?: string;
      genre?: string;
      status?: GameStatus;
      settings?: Record<string, unknown>;
    };

    const game = await prisma.game.findUnique({
      where: { id: gameIdInt },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Build update object with only provided fields
    const updateData: {
      title?: string;
      genre?: string;
      status?: GameStatus;
      settings?: Prisma.InputJsonValue;
    } = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.genre !== undefined) updateData.genre = body.genre;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.settings !== undefined) {
      updateData.settings = body.settings as Prisma.InputJsonValue;
    }

    const updated = await prisma.game.update({
      where: { id: gameIdInt },
      data: updateData,
      include: {
        _count: {
          select: { levels: true, analytics: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update game:", error);
    return NextResponse.json(
      { error: "Failed to update game" },
      { status: 500 }
    );
  }
}
