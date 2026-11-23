import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getRequestAdmin, sameOrigin } from "@/lib/auth";
import { parseProduct } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  if (!await getRequestAdmin(request)) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  try {
    const product = parseProduct(await request.json());
    const db = await getDb();
    const result = await db.collection("products").updateOne({ _id: new ObjectId(id) }, { $set: { ...product, isSample: false, updatedAt: new Date() } });
    if (!result.matchedCount) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update product.";
    const duplicate = /duplicate key/i.test(message);
    return NextResponse.json({ error: duplicate ? "That SKU or product URL is already used by another product." : message }, { status: duplicate ? 409 : 400 });
  }
}

export async function DELETE(request: Request, context: Context) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  if (!await getRequestAdmin(request)) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const { id } = await context.params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  const db = await getDb();
  const result = await db.collection("products").deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Product not found." }, { status: 404 });
}
