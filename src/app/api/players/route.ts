import { NextResponse } from "next/server";
import { verifySession, unauthorized } from "@/lib/api-security";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await verifySession();
  if (!session) {
    return unauthorized();
  }

  try {
    const players = await prisma.player.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        game: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error("Failed to fetch players:", error);
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 },
    );
  }
}
