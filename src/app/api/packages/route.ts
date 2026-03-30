import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifySession, unauthorized } from "@/lib/api-security";
import type { UserRole } from "@/types/game";

type PackagePayload = {
  name?: string;
  description?: string;
  packageType?: string;
  price?: number;
  currency?: string;
  coinReward?: number;
  gemReward?: number;
  boosterRewards?: unknown;
  isActive?: boolean;
};

type BoosterRewardItem = {
  boosterId: number;
  quantity: number;
};

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function hasPackageWriteAccess(role?: UserRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}

function parseBoosterRewards(value: unknown): BoosterRewardItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is { boosterId?: unknown; quantity?: unknown } => typeof item === "object" && item !== null)
    .map((item) => {
      const boosterId = Number(item.boosterId);
      const quantity = Number(item.quantity);
      return {
        boosterId: Math.floor(boosterId),
        quantity: Math.floor(quantity),
      };
    })
    .filter((item) => Number.isInteger(item.boosterId) && item.boosterId > 0 && Number.isInteger(item.quantity) && item.quantity > 0);
}

export async function GET() {
  const session = await verifySession();
  if (!session) {
    return unauthorized();
  }

  try {
    const packages = await prisma.shopPackage.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(packages);
  } catch (error) {
    console.error("Failed to fetch packages:", error);
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return unauthorized();
  }

  if (!hasPackageWriteAccess(session.user?.role)) {
    return unauthorized("Only admin users can manage packages.");
  }

  try {
    const body = (await request.json()) as PackagePayload;

    const name = normalizeString(body.name);
    const packageType = normalizeString(body.packageType)?.toUpperCase();
    const currency = normalizeString(body.currency)?.toUpperCase();
    const description = normalizeString(body.description) ?? null;

    if (!name || !packageType || !currency || typeof body.price !== "number" || body.price < 0) {
      return NextResponse.json(
        { error: "name, packageType, price and currency are required." },
        { status: 400 },
      );
    }

    const coinReward = typeof body.coinReward === "number" ? Math.floor(body.coinReward) : 0;
    const gemReward = typeof body.gemReward === "number" ? Math.floor(body.gemReward) : 0;

    if (coinReward < 0 || gemReward < 0) {
      return NextResponse.json(
        { error: "coinReward and gemReward must be non-negative integers." },
        { status: 400 },
      );
    }

    const boosterRewards = parseBoosterRewards(body.boosterRewards);

    const created = await prisma.shopPackage.create({
      data: {
        name,
        description,
        packageType,
        price: body.price,
        currency,
        coinReward,
        gemReward,
        boosterRewards,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create package:", error);
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 });
  }
}
