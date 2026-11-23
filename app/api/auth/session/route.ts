import { NextResponse } from "next/server";
import { getRequestAdmin } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const admin = await getRequestAdmin(request);
  return admin ? NextResponse.json({ authenticated: true, email: admin.email }) : NextResponse.json({ authenticated: false }, { status: 401 });
}
