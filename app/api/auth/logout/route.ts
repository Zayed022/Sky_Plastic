import { NextResponse } from "next/server";
import { clearAdminCookie, sameOrigin } from "@/lib/auth";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  clearAdminCookie(response);
  return response;
}
