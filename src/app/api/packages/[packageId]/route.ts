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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ packageId: string }> },
) {
  const session = await verifySession();
  if (!session) {
    return unauthorized();
  }

  if (!hasPackageWriteAccess(session.user?.role)) {
    return unauthorized("Only admin users can manage packages.");
  }

  try {
    const { packageId } = await params;
    const packageIdInt = Number(packageId);

    if (Number.isNaN(packageIdInt)) {
      return NextResponse.json({ error: "Invalid package ID" }, { status: 400 });
    }

    const body = (await request.json()) as PackagePayload;

    const updateData: {
      name?: string;
      description?: string | null;
      packageType?: string;
      price?: number;
      currency?: string;
      coinReward?: number;
      gemReward?: number;
      boosterRewards?: BoosterRewardItem[];
      isActive?: boolean;
    } = {};

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

    if (body.packageType !== undefined) {
      const packageType = normalizeString(body.packageType)?.toUpperCase();
      if (!packageType) {
        return NextResponse.json({ error: "packageType cannot be empty." }, { status: 400 });
      }
      updateData.packageType = packageType;
    }

    if (body.currency !== undefined) {
      const currency = normalizeString(body.currency)?.toUpperCase();
      if (!currency) {
        return NextResponse.json({ error: "currency cannot be empty." }, { status: 400 });
      }
      updateData.currency = currency;
    }

    if (body.price !== undefined) {
      if (typeof body.price !== "number" || body.price < 0) {
        return NextResponse.json({ error: "price must be a non-negative number." }, { status: 400 });
      }
      updateData.price = body.price;
    }

    if (body.coinReward !== undefined) {
      if (!Number.isInteger(body.coinReward) || body.coinReward < 0) {
        return NextResponse.json({ error: "coinReward must be a non-negative integer." }, { status: 400 });
      }
      updateData.coinReward = body.coinReward;
    }

    if (body.gemReward !== undefined) {
      if (!Number.isInteger(body.gemReward) || body.gemReward < 0) {
        return NextResponse.json({ error: "gemReward must be a non-negative integer." }, { status: 400 });
      }
      updateData.gemReward = body.gemReward;
    }

    if (body.boosterRewards !== undefined) {
      updateData.boosterRewards = parseBoosterRewards(body.boosterRewards);
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json({ error: "isActive must be boolean." }, { status: 400 });
      }
      updateData.isActive = body.isActive;
    }

    const updated = await prisma.shopPackage.update({
      where: { id: packageIdInt },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update package:", error);
    return NextResponse.json({ error: "Failed to update package" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ packageId: string }> },
) {
  const session = await verifySession();
  if (!session) {
    return unauthorized();
  }

  if (!hasPackageWriteAccess(session.user?.role)) {
    return unauthorized("Only admin users can manage packages.");
  }

  try {
    const { packageId } = await params;
    const packageIdInt = Number(packageId);

    if (Number.isNaN(packageIdInt)) {
      return NextResponse.json({ error: "Invalid package ID" }, { status: 400 });
    }

    await prisma.shopPackage.delete({
      where: { id: packageIdInt },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete package:", error);
    return NextResponse.json({ error: "Failed to delete package" }, { status: 500 });
  }
}
