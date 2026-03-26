import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin") || "";
    const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";

    // Check if the origin is allowed
    const isOriginAllowed =
      allowedOrigin === "*" || origin === allowedOrigin;

    // Handle preflight OPTIONS requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": isOriginAllowed ? (allowedOrigin === "*" ? "*" : origin) : "null",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400", // 24 hours
        },
      });
    }

    // Proceed with the request and add CORS headers to the response
    const response = NextResponse.next();
    if (isOriginAllowed) {
      response.headers.set(
        "Access-Control-Allow-Origin",
        allowedOrigin === "*" ? "*" : origin
      );
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
