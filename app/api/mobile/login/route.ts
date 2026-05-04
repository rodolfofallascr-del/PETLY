import { NextResponse } from "next/server";
import { authenticateDemoUser, createSessionToken } from "@/src/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = String(body?.username ?? "");
  const password = String(body?.password ?? "");
  const session = authenticateDemoUser(username, password);

  if (!session) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  return NextResponse.json({
    session,
    token: createSessionToken(session),
  });
}
