import { NextRequest, NextResponse } from "next/server";
import { BoosterCurrencyType } from "@/generated/prisma/enums";
import { verifySession, unauthorized } from "@/lib/api-security";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/game";

type BoosterPayload = {
  code?: string;
  name?: string;
  description?: string;
  cost?: number;
  currencyType?: BoosterCurrencyType;
  imageUrl?: string;
  isActive?: boolean;
};

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function hasBoosterWriteAccess(role?: UserRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export async function GET() {
  const session = await verifySession();
  if (!session) {
    return unauthorized();
  }

  try {
    const boosters = await prisma.booster.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(boosters);
  } catch (error) {
    console.error("Failed to fetch boosters:", error);
    return NextResponse.json(
      { error: "Failed to fetch boosters" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return unauthorized();
  }

  if (!hasBoosterWriteAccess(session.user?.role)) {
    return unauthorized("Only admin users can manage boosters.");
  }

  const adminId = session.user?.id;
  if (typeof adminId !== "number") {
    return unauthorized("Invalid admin session");
  }

  try {
    const body = (await request.json()) as BoosterPayload;

    const code = normalizeString(body.code)?.toUpperCase();
    const name = normalizeString(body.name);
    const description = normalizeString(body.description) ?? null;
    const imageUrl = normalizeString(body.imageUrl) ?? null;

    if (!code || !name || typeof body.cost !== "number" || body.cost < 0 || !body.currencyType) {
      return NextResponse.json(
        { error: "code, name, cost and currencyType are required." },
        { status: 400 },
      );
    }

    if (!Object.values(BoosterCurrencyType).includes(body.currencyType)) {
      return NextResponse.json({ error: "Invalid currencyType." }, { status: 400 });
    }

    const created = await prisma.booster.create({
      data: {
        code,
        name,
        description,
        cost: Math.floor(body.cost),
        currencyType: body.currencyType,
        imageUrl,
        isActive: body.isActive ?? true,
        createdBy: adminId,
        updatedBy: adminId,
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
          },
        },
        updater: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create booster:", error);
    return NextResponse.json(
      { error: "Failed to create booster" },
      { status: 500 },
    );
  }
}
