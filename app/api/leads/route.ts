import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb, ensureIndexes } from "@/lib/db";
import { notifyNewLead } from "@/lib/email";
import { sameOrigin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const val = (x: unknown, max: number) => typeof x === "string" ? x.trim().slice(0, max) : "";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const body = await request.json();
    if (val(body.website, 300)) return NextResponse.json({ ok: true });
    const lead = {
      name: val(body.name, 90),
      company: val(body.company, 120),
      email: val(body.email, 160).toLowerCase(),
      country: val(body.country, 80),
      phone: val(body.phone, 40),
      product: val(body.product, 140),
      quantity: val(body.quantity, 80),
      message: val(body.message, 2000),
    };
    if (lead.name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email) || lead.message.length < 10) {
      return NextResponse.json({ error: "Please provide your name, a valid email and a message of at least 10 characters." }, { status: 400 });
    }
    if (!process.env.AUTH_SECRET) return NextResponse.json({ error: "The enquiry service is not configured yet." }, { status: 503 });
    const db = await getDb();
    await ensureIndexes(db);
    const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipHash = createHmac("sha256", process.env.AUTH_SECRET).update(ip).digest("hex");
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const count = await db.collection("leads").countDocuments({ ipHash, createdAt: { $gte: since } }, { limit: 8 });
    if (count >= 8) return NextResponse.json({ error: "Too many enquiries from this connection. Please try again later." }, { status: 429 });
    const createdAt = new Date();
    await db.collection("leads").insertOne({ ...lead, ipHash, status: "new", createdAt, source: "website" });
    await notifyNewLead(lead);
    return NextResponse.json({ ok: true, message: "Enquiry received." }, { status: 201 });
  } catch (error) {
    console.error("Lead submission failed:", error);
    return NextResponse.json({ error: "We could not save your enquiry. Please try again or contact the business directly." }, { status: 500 });
  }
}
