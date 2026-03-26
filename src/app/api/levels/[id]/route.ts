import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type TubeConfigItem = { wools: number[] };
type LevelConfig = { tubes: TubeConfigItem[] };
type LevelSettings = {
  undoLimit: number;
  difficulty: string;
  tubeCapacity: number;
  heuristicScore: number;
};

// --- CORS Helper ---
function withCors(response: NextResponse): NextResponse {
  response.headers.set("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN ?? "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

// --- Normalization Helpers ---
function normalizeConfig(rawConfig: unknown): LevelConfig {
  const fallback: LevelConfig = { tubes: [] };

  if (!rawConfig || typeof rawConfig !== "object") {
    return fallback;
  }

  const configObj = rawConfig as { tubes?: unknown };
  if (!Array.isArray(configObj.tubes)) {
    return fallback;
  }

  const tubes = configObj.tubes
    .map((tube) => {
      if (tube && typeof tube === "object" && "wools" in (tube as Record<string, unknown>)) {
        const wools = (tube as { wools?: unknown }).wools;
        if (Array.isArray(wools)) {
          return {
            wools: wools.filter((value) => typeof value === "number") as number[],
          };
        }
      }

      // Legacy support: tube as string[] (hex) or number[]
      if (Array.isArray(tube)) {
        return {
          wools: tube.filter((value) => typeof value === "number") as number[],
        };
      }

      return { wools: [] };
    })
    .filter((tube) => tube !== null);

  return { tubes };
}

function normalizeSettings(rawSettings: unknown): LevelSettings {
  const settingsObj =
    rawSettings && typeof rawSettings === "object"
      ? (rawSettings as Record<string, unknown>)
      : {};

  const undoLimit =
    typeof settingsObj.undoLimit === "number"
      ? settingsObj.undoLimit
      : typeof settingsObj.undo_limit === "number"
        ? (settingsObj.undo_limit as number)
        : 5;

  const difficulty =
    typeof settingsObj.difficulty === "string" ? settingsObj.difficulty : "Easy";

  const tubeCapacity =
    typeof settingsObj.tubeCapacity === "number"
      ? settingsObj.tubeCapacity
      : typeof settingsObj.tube_capacity === "number"
        ? (settingsObj.tube_capacity as number)
        : 4;

  const heuristicScore =
    typeof settingsObj.heuristicScore === "number"
      ? settingsObj.heuristicScore
      : typeof settingsObj.heuristic_score === "number"
        ? (settingsObj.heuristic_score as number)
        : 0;

  return {
    undoLimit,
    difficulty,
    tubeCapacity,
    heuristicScore,
  };
}

// --- Route Handlers ---

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const levelIdentifier = Number(id);

    if (!Number.isInteger(levelIdentifier) || levelIdentifier < 1) {
      return withCors(NextResponse.json({ error: "Invalid level id" }, { status: 400 }));
    }

    const level = await prisma.level.findFirst({
      where: {
        OR: [{ id: levelIdentifier }, { levelNumber: levelIdentifier }],
      },
      select: {
        id: true,
        levelNumber: true,
        config: true,
        settings: true,
      },
    });

    if (!level) {
      return withCors(NextResponse.json({ error: "Level not found" }, { status: 404 }));
    }

    // Parse từ chuỗi sang JSON nếu config/settings đang được lưu ở dạng String
    const rawConfig = typeof level.config === "string" ? JSON.parse(level.config) : level.config;
    const rawSettings = typeof level.settings === "string" ? JSON.parse(level.settings) : level.settings;

    const payload = {
      id: level.id,
      levelNumber: level.levelNumber,
      config: normalizeConfig(rawConfig),
      settings: normalizeSettings(rawSettings),
    };

    return withCors(NextResponse.json(payload, { status: 200 }));
  } catch (error) {
    console.error("Failed to fetch level:", error);
    return withCors(NextResponse.json({ error: "Failed to fetch level" }, { status: 500 }));
  }
}