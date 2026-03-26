import { GameStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifySession, unauthorized } from "@/lib/api-security";

type CreateGameBody = {
  title?: string;
  genre?: string;
  status?: GameStatus;
};

export async function GET() {
  const session = await verifySession();
  if (!session) {
    return unauthorized();
  }

  const games = await prisma.game.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { levels: true, analytics: true },
      },
    },
  });

  return Response.json(games);
}

export async function POST(request: Request) {
  const session = await verifySession();
  if (!session) {
    return unauthorized();
  }

  try {
    const body = (await request.json()) as CreateGameBody;

    if (!body.title || !body.genre) {
      return NextResponse.json(
        { error: "Both title and genre are required." },
        { status: 400 },
      );
    }

    const game = await prisma.game.create({
      data: {
        title: body.title,
        genre: body.genre,
        status: body.status ?? GameStatus.DRAFT,
      },
    });

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    console.error("Failed to create game:", error);
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 },
    );
  }
}
