import { NextRequest, NextResponse } from "next/server";
import { verifySession, unauthorized } from "@/lib/api-security";
import { prisma } from "@/lib/prisma";

type PlayerUpdatePayload = {
  username?: string;
  email?: string;
  passwordHash?: string;
  providerId?: string | null;
  token?: string | null;
  deviceId?: string | null;
  sessionId?: string | null;
  gameId?: number | null;
  coins?: number;
  gems?: number;
  currentLevel?: number;
  xp?: number;
  lastLogin?: string | null;
};

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> },
) {
  const session = await verifySession();
  if (!session) {
    return unauthorized();
  }

  try {
    const { playerId } = await params;

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        game: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error("Failed to fetch player:", error);
    return NextResponse.json(
      { error: "Failed to fetch player" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> },
) {
  const session = await verifySession();
  if (!session) {
    return unauthorized();
  }

  try {
    const { playerId } = await params;
    const body = (await request.json()) as PlayerUpdatePayload;

    const updateData: {
      username?: string;
      email?: string;
      passwordHash?: string;
      providerId?: string | null;
      token?: string | null;
      deviceId?: string | null;
      sessionId?: string | null;
      gameId?: number | null;
      coins?: number;
      gems?: number;
      currentLevel?: number;
      xp?: number;
      lastLogin?: Date | null;
    } = {};

    if (body.username !== undefined) {
      const username = normalizeString(body.username);
      if (!username) {
        return NextResponse.json({ error: "username cannot be empty." }, { status: 400 });
      }
      updateData.username = username;
    }

    if (body.email !== undefined) {
      const email = normalizeString(body.email);
      if (!email) {
        return NextResponse.json({ error: "email cannot be empty." }, { status: 400 });
      }
      updateData.email = email;
    }

    if (body.passwordHash !== undefined) {
      const passwordHash = normalizeString(body.passwordHash);
      if (!passwordHash) {
        return NextResponse.json({ error: "passwordHash cannot be empty." }, { status: 400 });
      }
      updateData.passwordHash = passwordHash;
    }

    if (body.providerId !== undefined) {
      updateData.providerId = normalizeString(body.providerId) ?? null;
    }

    if (body.token !== undefined) {
      updateData.token = normalizeString(body.token) ?? null;
    }

    if (body.deviceId !== undefined) {
      updateData.deviceId = normalizeString(body.deviceId) ?? null;
    }

    if (body.sessionId !== undefined) {
      updateData.sessionId = normalizeString(body.sessionId) ?? null;
    }

    if (body.gameId !== undefined) {
      if (body.gameId !== null && (!Number.isInteger(body.gameId) || body.gameId < 1)) {
        return NextResponse.json({ error: "gameId must be a positive integer or null." }, { status: 400 });
      }
      updateData.gameId = body.gameId;
    }

    if (body.coins !== undefined) {
      if (!Number.isInteger(body.coins) || body.coins < 0) {
        return NextResponse.json({ error: "coins must be a non-negative integer." }, { status: 400 });
      }
      updateData.coins = body.coins;
    }

    if (body.gems !== undefined) {
      if (!Number.isInteger(body.gems) || body.gems < 0) {
        return NextResponse.json({ error: "gems must be a non-negative integer." }, { status: 400 });
      }
      updateData.gems = body.gems;
    }

    if (body.currentLevel !== undefined) {
      if (!Number.isInteger(body.currentLevel) || body.currentLevel < 1) {
        return NextResponse.json({ error: "currentLevel must be a positive integer." }, { status: 400 });
      }
      updateData.currentLevel = body.currentLevel;
    }

    if (body.xp !== undefined) {
      if (!Number.isInteger(body.xp) || body.xp < 0) {
        return NextResponse.json({ error: "xp must be a non-negative integer." }, { status: 400 });
      }
      updateData.xp = body.xp;
    }

    if (body.lastLogin !== undefined) {
      if (body.lastLogin === null) {
        updateData.lastLogin = null;
      } else {
        const dateValue = new Date(body.lastLogin);
        if (Number.isNaN(dateValue.getTime())) {
          return NextResponse.json({ error: "lastLogin must be a valid ISO date string." }, { status: 400 });
        }
        updateData.lastLogin = dateValue;
      }
    }

    const updated = await prisma.player.update({
      where: { id: playerId },
      data: updateData,
      include: {
        game: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update player:", error);
    return NextResponse.json(
      { error: "Failed to update player" },
      { status: 500 },
    );
  }
}
