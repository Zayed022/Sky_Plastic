import { NextResponse } from "next/server";
import { getPublicProducts } from "@/lib/catalogue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = (url.searchParams.get("category") || "").slice(0, 80);
    const search = (url.searchParams.get("q") || "").slice(0, 100);
    let products = await getPublicProducts();
    if (category) products = products.filter((p) => p.category === category);
    if (search) products = products.filter((p) => `${p.title} ${p.sku} ${p.category} ${p.summary}`.toLowerCase().includes(search.toLowerCase()));
    return NextResponse.json({ products, source: process.env.MONGODB_URI ? "database" : "preview" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Catalogue fetch failed:", error);
    return NextResponse.json({ products: [], error: "The product catalogue is temporarily unavailable." }, { status: 503 });
  }
}
