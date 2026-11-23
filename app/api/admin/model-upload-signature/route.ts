import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getRequestAdmin, sameOrigin } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  if (!await getRequestAdmin(request)) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return NextResponse.json({ error: "Cloudinary uploads are not configured. Paste a trusted HTTPS GLB URL instead." }, { status: 503 });
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "sky-plastic/models";
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  return NextResponse.json({ cloudName, apiKey, timestamp, folder, signature });
}
