import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb, ensureIndexes } from "@/lib/db";
import { createAdminToken, setAdminCookie, verifyPassword, sameOrigin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  if (!process.env.AUTH_SECRET || Buffer.byteLength(process.env.AUTH_SECRET) < 32) return NextResponse.json({ error: "Admin authentication is not configured." }, { status: 503 });
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 160) : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length > 200) {
      return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
    }
    const db = await getDb();
    await ensureIndexes(db);
    const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const key = createHmac("sha256", process.env.AUTH_SECRET).update(`${email}:${ip}`).digest("hex");
    const attempts = db.collection("loginAttempts");
    const record = await attempts.findOne({ _id: key });
    const now = new Date();
    const windowExpired = !record || now.getTime() - new Date(record.updatedAt as Date).getTime() > 15 * 60 * 1000;
    if (!windowExpired && Number(record.count || 0) >= 8) {
      return NextResponse.json({ error: "Too many sign-in attempts. Please try again in 15 minutes." }, { status: 429 });
    }

    const admin = await db.collection("admins").findOne({ email }, { projection: { email: 1, passwordHash: 1 } });
    const valid = admin && typeof admin.passwordHash === "string" && await verifyPassword(password, admin.passwordHash);
    if (!valid || !admin) {
      await attempts.updateOne({ _id: key }, {
        $set: { count: windowExpired ? 1 : Number(record?.count || 0) + 1, updatedAt: now },
      }, { upsert: true });
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }

    await attempts.deleteOne({ _id: key });
    const token = await createAdminToken(admin._id.toString(), email);
    const response = NextResponse.json({ ok: true, email });
    setAdminCookie(response, token);
    return response;
  } catch (error) {
    console.error("Admin login failed:", error);
    return NextResponse.json({ error: "Admin sign-in is not available. Check the server configuration." }, { status: 500 });
  }
}
