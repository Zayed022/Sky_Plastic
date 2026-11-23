import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getRequestAdmin, sameOrigin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { LeadStatus } from "@/lib/types";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
const allowed = new Set<LeadStatus>(["new", "contacted", "quoted", "won", "lost"]);
export async function PATCH(request: Request, context: Context) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  if (!await getRequestAdmin(request)) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid enquiry id." }, { status: 400 });
  const body = await request.json();
  const status = body.status as LeadStatus;
  if (!allowed.has(status)) return NextResponse.json({ error: "Invalid enquiry status." }, { status: 400 });
  const db = await getDb();
  const result = await db.collection("leads").updateOne({ _id: new ObjectId(id) }, { $set: { status, updatedAt: new Date() } });
  return result.matchedCount ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
}
