import { NextResponse } from "next/server";
import { getDb, ensureIndexes } from "@/lib/db";
import { getRequestAdmin, sameOrigin } from "@/lib/auth";
import { parseProduct } from "@/lib/validation";
import { ensureDemoProducts } from "@/lib/catalogue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await getRequestAdmin(request)) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  try {
    const db = await getDb();
    await ensureDemoProducts();
    const docs = await db.collection("products").find({}).sort({ updatedAt: -1 }).limit(250).toArray();
    const products = docs.map((doc) => ({ ...doc, _id: doc._id.toString(), createdAt: doc.createdAt?.toISOString?.() ?? doc.createdAt, updatedAt: doc.updatedAt?.toISOString?.() ?? doc.updatedAt }));
    return NextResponse.json({ products });
  } catch (error) {
    console.error("Admin products fetch failed:", error);
    return NextResponse.json({ error: "Could not load products." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  if (!await getRequestAdmin(request)) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  try {
    const product = parseProduct(await request.json());
    const db = await getDb();
    await ensureIndexes(db);
    const now = new Date();
    const result = await db.collection("products").insertOne({ ...product, createdAt: now, updatedAt: now });
    return NextResponse.json({ ok: true, id: result.insertedId.toString() }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create product.";
    const duplicate = /duplicate key/i.test(message);
    return NextResponse.json({ error: duplicate ? "That SKU or product URL already exists." : message }, { status: duplicate ? 409 : 400 });
  }
}
