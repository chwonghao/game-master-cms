import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, unauthorized } from "@/lib/api-security";

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");
    if (!validateApiKey(apiKey || undefined)) {
      return unauthorized("Invalid API key");
    }

    const packages = await prisma.shopPackage.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        name: true,
        description: true,
        packageType: true,
        price: true,
        currency: true,
        coinReward: true,
        gemReward: true,
        boosterRewards: true,
      },
    });

    return NextResponse.json(
      {
        message: "Packages fetched successfully",
        data: packages,
        count: packages.length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[/api/client/packages] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
