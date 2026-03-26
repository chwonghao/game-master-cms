import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, unauthorized } from "@/lib/api-security";

const woolPalette = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#22c55e",
  "#14b8a0",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#06b6d4",
  "#8b5cf6",
];

function colorIndexOf(hexColor: string): number {
  const index = woolPalette.indexOf(hexColor);
  return index >= 0 ? index : 0;
}

type TubeConfigItem = { wools: number[] };

function normalizeTubes(tubes: unknown): TubeConfigItem[] {
  if (!Array.isArray(tubes)) {
    return [];
  }

  // Standard format already stored in DB: [{ wools: number[] }]
  if (
    tubes.every(
      (tube) =>
        typeof tube === "object" &&
        tube !== null &&
        "wools" in (tube as Record<string, unknown>) &&
        Array.isArray((tube as { wools?: unknown }).wools),
    )
  ) {
    return tubes.map((tube) => ({
      wools: (tube as { wools: unknown[] }).wools.filter((value) => typeof value === "number") as number[],
    }));
  }

  // Legacy format: string[][] of hex colors
  if (tubes.every((tube) => Array.isArray(tube))) {
    return (tubes as unknown[][]).map((tube) => ({
      wools: tube
        .filter((value) => typeof value === "string")
        .map((hexColor) => colorIndexOf(hexColor as string)),
    }));
  }

  return [];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string; levelId: string }> }
) {
  // Validate API key
  const apiKey = request.headers.get("x-api-key") ?? undefined;
  if (!validateApiKey(apiKey)) {
    return unauthorized("Invalid or missing API key");
  }

  try {
    const { gameId, levelId } = await params;
    const gameIdInt = Number(gameId);
    const levelIdInt = Number(levelId);

    if (Number.isNaN(gameIdInt) || Number.isNaN(levelIdInt)) {
      return NextResponse.json({ error: "Invalid route parameters" }, { status: 400 });
    }

    // Fetch the level from the database
    const level = await prisma.level.findUnique({
      where: {
        id: levelIdInt,
      },
      include: {
        game: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!level) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    // Verify the level belongs to the requested game
    if (level.gameId !== gameIdInt) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    // Parse JSON payloads
    const config = typeof level.config === "string" ? JSON.parse(level.config) : level.config;
    const settings = typeof level.settings === "string" ? JSON.parse(level.settings) : level.settings;

    const tubes = normalizeTubes((config as { tubes?: unknown }).tubes);

    // Build the client response
    const clientResponse = {
      level_id: level.levelNumber,
      settings: {
        tube_capacity:
          (settings as { tubeCapacity?: number; tube_capacity?: number }).tubeCapacity ??
          (settings as { tube_capacity?: number }).tube_capacity ??
          4,
        undo_limit:
          (settings as { undoLimit?: number; undo_limit?: number }).undoLimit ??
          (settings as { undo_limit?: number }).undo_limit ??
          5,
      },
      tubes,
    };

    return NextResponse.json(clientResponse);
  } catch (error) {
    console.error("Failed to fetch level for client:", error);
    return NextResponse.json(
      { error: "Failed to fetch level for client" },
      { status: 500 },
    );
  }
}
