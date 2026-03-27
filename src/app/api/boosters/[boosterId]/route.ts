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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ boosterId: string }> },
) {
  const session = await verifySession();
  if (!session) {
    return unauthorized();
  }

  try {
    const { boosterId } = await params;
    const boosterIdInt = Number(boosterId);

    if (Number.isNaN(boosterIdInt)) {
      return NextResponse.json({ error: "Invalid booster ID" }, { status: 400 });
    }

    const booster = await prisma.booster.findUnique({
      where: { id: boosterIdInt },
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

    if (!booster) {
      return NextResponse.json({ error: "Booster not found" }, { status: 404 });
    }

    return NextResponse.json(booster);
  } catch (error) {
    console.error("Failed to fetch booster:", error);
    return NextResponse.json(
      { error: "Failed to fetch booster" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ boosterId: string }> },
) {
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
    const { boosterId } = await params;
    const boosterIdInt = Number(boosterId);

    if (Number.isNaN(boosterIdInt)) {
      return NextResponse.json({ error: "Invalid booster ID" }, { status: 400 });
    }

    const body = (await request.json()) as BoosterPayload;

    const updateData: {
      code?: string;
      name?: string;
      description?: string | null;
      cost?: number;
      currencyType?: BoosterCurrencyType;
      imageUrl?: string | null;
      isActive?: boolean;
      updatedBy: number;
    } = {
      updatedBy: adminId,
    };

    if (body.code !== undefined) {
      const code = normalizeString(body.code)?.toUpperCase();
      if (!code) {
        return NextResponse.json({ error: "code cannot be empty." }, { status: 400 });
      }
      updateData.code = code;
    }

    if (body.name !== undefined) {
      const name = normalizeString(body.name);
      if (!name) {
        return NextResponse.json({ error: "name cannot be empty." }, { status: 400 });
      }
      updateData.name = name;
    }

    if (body.description !== undefined) {
      updateData.description = normalizeString(body.description) ?? null;
    }

    if (body.imageUrl !== undefined) {
      updateData.imageUrl = normalizeString(body.imageUrl) ?? null;
    }

    if (body.cost !== undefined) {
      if (typeof body.cost !== "number" || body.cost < 0) {
        return NextResponse.json({ error: "cost must be a non-negative number." }, { status: 400 });
      }
      updateData.cost = Math.floor(body.cost);
    }

    if (body.currencyType !== undefined) {
      if (!Object.values(BoosterCurrencyType).includes(body.currencyType)) {
        return NextResponse.json({ error: "Invalid currencyType." }, { status: 400 });
      }
      updateData.currencyType = body.currencyType;
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json({ error: "isActive must be boolean." }, { status: 400 });
      }
      updateData.isActive = body.isActive;
    }

    const updated = await prisma.booster.update({
      where: { id: boosterIdInt },
      data: updateData,
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update booster:", error);
    return NextResponse.json(
      { error: "Failed to update booster" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ boosterId: string }> },
) {
  const session = await verifySession();
  if (!session) {
    return unauthorized();
  }

  if (!hasBoosterWriteAccess(session.user?.role)) {
    return unauthorized("Only admin users can manage boosters.");
  }

  try {
    const { boosterId } = await params;
    const boosterIdInt = Number(boosterId);

    if (Number.isNaN(boosterIdInt)) {
      return NextResponse.json({ error: "Invalid booster ID" }, { status: 400 });
    }

    await prisma.booster.delete({
      where: { id: boosterIdInt },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete booster:", error);
    return NextResponse.json(
      { error: "Failed to delete booster" },
      { status: 500 },
    );
  }
}
