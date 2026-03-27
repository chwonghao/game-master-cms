import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, unauthorized } from "@/lib/api-security";

export async function GET(request: NextRequest) {
  try {
    // Validate API key from header
    const apiKey = request.headers.get("x-api-key");
    if (!validateApiKey(apiKey || undefined)) {
      return unauthorized("Invalid API key");
    }

    // Get gameId from query params
    const gameId = request.nextUrl.searchParams.get("gameId");
    if (!gameId) {
      return NextResponse.json(
        { error: "gameId query parameter is required" },
        { status: 400 }
      );
    }

    // Fetch active boosters for the game
    // Note: boosters are global, not game-specific, but we filter by gameId context
    const boosters = await prisma.booster.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        cost: true,
        currencyType: true,
        imageUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      data: boosters,
      count: boosters.length,
    });
  } catch (error) {
    console.error("[/api/client/boosters] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
