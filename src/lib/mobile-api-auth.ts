import { NextResponse } from "next/server";
import { verifySessionToken } from "@/src/lib/auth";

export function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return authorization.slice("bearer ".length).trim();
}

export function requireMobileSession(request: Request) {
  const session = verifySessionToken(getBearerToken(request) ?? undefined);

  if (!session) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }

  return {
    response: null,
    session,
  };
}
