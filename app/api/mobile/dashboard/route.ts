import { NextResponse } from "next/server";
import { requireMobileSession } from "@/src/lib/mobile-api-auth";
import { getUserDashboardData } from "@/src/lib/user-dashboard";

export async function GET(request: Request) {
  const { response, session } = requireMobileSession(request);

  if (response || !session) {
    return response;
  }

  if (session.role !== "USER") {
    return NextResponse.json({ error: "Only users can access this dashboard" }, { status: 403 });
  }

  const dashboard = await getUserDashboardData(session);

  return NextResponse.json(dashboard);
}
