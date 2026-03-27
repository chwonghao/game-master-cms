import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, unauthorized } from "@/lib/api-security";

export async function POST(request: NextRequest) {
  try {
    // Validate API key from header
    const apiKey = request.headers.get("x-api-key");
    if (!validateApiKey(apiKey || undefined)) {
      return unauthorized("Invalid API key");
    }

    const body = await request.json();
    const { username, providerId, deviceId, sessionId, gameId } = body;

    // Validate required fields
    if (!username) {
      return NextResponse.json(
        { error: "username is required" },
        { status: 400 }
      );
    }

    if (!providerId) {
      return NextResponse.json(
        { error: "providerId is required" },
        { status: 400 }
      );
    }

    // Normalize inputs
    const normalizedUsername = String(username).trim();
    const normalizedProviderId = String(providerId).trim();
    const normalizedDeviceId = deviceId ? String(deviceId).trim() : null;
    const normalizedSessionId = sessionId ? String(sessionId).trim() : null;
    const normalizedGameId = gameId ? parseInt(String(gameId), 10) : null;

    // Try to find existing player by providerId (primary identifier for game clients)
    let player = await prisma.player.findUnique({
      where: { providerId: normalizedProviderId },
      include: { game: true },
    });

    if (player) {
      // Update existing player with latest session info
      const updatedPlayer = await prisma.player.update({
        where: { id: player.id },
        data: {
          username: normalizedUsername,
          deviceId: normalizedDeviceId,
          sessionId: normalizedSessionId,
          gameId: normalizedGameId,
          lastLogin: new Date(),
        },
        include: { game: true },
      });
      player = updatedPlayer;
    } else {
      // Create new player
      // Check if username is already taken
      const existingUsername = await prisma.player.findUnique({
        where: { username: normalizedUsername },
      });

      if (existingUsername) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 409 }
        );
      }

      const createdPlayer = await prisma.player.create({
        data: {
          username: normalizedUsername,
          email: `${normalizedProviderId}@game-client`, // Generate email from providerId
          passwordHash: "", // OAuth login - no password required
          providerId: normalizedProviderId,
          deviceId: normalizedDeviceId,
          sessionId: normalizedSessionId,
          gameId: normalizedGameId,
          lastLogin: new Date(),
          // Set defaults for economy
          coins: 0,
          gems: 0,
          currentLevel: 1,
          xp: 0,
        },
        include: { game: true },
      });
      player = createdPlayer;
    if (!player) {
      return NextResponse.json(
        { error: "Failed to create or update player" },
        { status: 500 }
      );
    }

    }

    return NextResponse.json({
      data: {
        id: player.id,
        username: player.username,
        providerId: player.providerId,
        deviceId: player.deviceId,
        sessionId: player.sessionId,
        coins: player.coins,
        gems: player.gems,
        currentLevel: player.currentLevel,
        xp: player.xp,
        gameId: player.gameId,
        game: player.game ? { id: player.game.id, title: player.game.title } : null,
        lastLogin: player.lastLogin,
        createdAt: player.createdAt,
      },
      status: "success",
    });
  } catch (error) {
    console.error("[/api/client/player/init] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
