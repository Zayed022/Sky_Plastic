import { NextResponse } from "next/server";
import { getRequestAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!await getRequestAdmin(request)) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  try {
    const db = await getDb();
    const docs = await db.collection("leads").find({}, { projection: { ipHash: 0 } }).sort({ createdAt: -1 }).limit(300).toArray();
    const leads = docs.map((doc) => ({ ...doc, _id: doc._id.toString(), createdAt: doc.createdAt?.toISOString?.() ?? doc.createdAt }));
    return NextResponse.json({ leads });
  } catch (error) {
    console.error("Admin lead fetch failed:", error);
    return NextResponse.json({ error: "Could not load enquiries." }, { status: 500 });
  }
}
