import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifySession, unauthorized } from "@/lib/api-security";
import bcrypt from "bcryptjs";
import { UserRole } from "@/generated/prisma/enums";

export async function GET() {
  const session = await verifySession();
  if (!session) {
    return unauthorized();
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return unauthorized();
  }

  try {
    const body = (await request.json()) as { email: string; role: string; password?: string };

    if (!body.email || !body.role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    if (!Object.values(UserRole).includes(body.role as UserRole)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Hash password (use a default for invited users)
    const hashedPassword = await bcrypt.hash(body.password || "ChangeMe123!", 10);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email: body.email,
        role: body.role as UserRole,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
