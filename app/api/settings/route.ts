import { NextResponse } from "next/server";
import type { Document } from "mongodb";
import { DEFAULT_SETTINGS } from "@/lib/catalogue";
import type { SiteSettings } from "@/lib/types";
import { getDb } from "@/lib/db";
import { getRequestAdmin, sameOrigin } from "@/lib/auth";
import { parseSiteSettings } from "@/lib/validation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    if (!process.env.MONGODB_URI) return NextResponse.json({ settings: DEFAULT_SETTINGS });
    const db = await getDb();
    const doc = await db.collection<SiteSettings & Document & { _id: string; updatedAt?: Date }>("siteSettings").findOne({ _id: "main" });
    const settings = { ...DEFAULT_SETTINGS, ...(doc ?? {}) };
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Settings fetch failed:", error);
    return NextResponse.json({ settings: DEFAULT_SETTINGS }, { status: 200 });
  }
}
export async function PUT(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  if (!await getRequestAdmin(request)) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  try {
    const settings = parseSiteSettings(await request.json());
    const db = await getDb();
    await db.collection<SiteSettings & Document & { _id: string; updatedAt?: Date }>("siteSettings").updateOne({ _id: "main" }, { $set: { ...settings, updatedAt: new Date() } }, { upsert: true });
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    console.error("Settings update failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save settings." }, { status: 400 });
  }
}
