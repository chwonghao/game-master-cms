import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession, unauthorized } from "@/lib/api-security";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await verifySession();
  if (!session) {
    return unauthorized();
  }

  try {
    const games = await prisma.game.findMany({
      orderBy: { id: "asc" },
      include: {
        levels: {
          orderBy: { levelNumber: "asc" },
        },
      },
    });

    const payload = {
      exportedAt: new Date().toISOString(),
      totalGames: games.length,
      games,
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="gamemaster-export-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error("Failed to export data:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
