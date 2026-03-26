import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession, unauthorized } from "@/lib/api-security";

export async function GET() {
  const session = await verifySession();
  if (!session) {
    return unauthorized();
  }

  try {
    const [gamesCount, levelsCount, usersCount] = await Promise.all([
      prisma.game.count(),
      prisma.level.count(),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      gamesCount,
      levelsCount,
      usersCount,
    });
  } catch (error) {
    console.error("Failed to fetch dashboard summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard summary" },
      { status: 500 }
    );
  }
}
