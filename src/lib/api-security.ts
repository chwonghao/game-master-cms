import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function verifySession() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }
  return session;
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function validateApiKey(apiKey?: string): boolean {
  const expectedKey = process.env.GAME_CLIENT_API_KEY;
  if (!expectedKey) {
    console.warn("GAME_CLIENT_API_KEY environment variable is not set");
    return false;
  }
  return apiKey === expectedKey;
}
