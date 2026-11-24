import { NextResponse } from "next/server";
import type { Document } from "mongodb";
import { getDb, ensureIndexes } from "@/lib/db";
import { hashPassword, hasValidSetupToken, sameOrigin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  if (!process.env.ADMIN_BOOTSTRAP_TOKEN) return NextResponse.json({ error: "Admin bootstrap is disabled." }, { status: 404 });
  if (!process.env.AUTH_SECRET || Buffer.byteLength(process.env.AUTH_SECRET) < 32) return NextResponse.json({ error: "AUTH_SECRET must be configured with at least 32 bytes before creating an administrator." }, { status: 503 });
  if (!hasValidSetupToken(request.headers.get("x-setup-token") || "")) return NextResponse.json({ error: "Invalid setup token." }, { status: 401 });
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 160) : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid admin email." }, { status: 400 });
    if (password.length < 14 || password.length > 200) return NextResponse.json({ error: "Use a password between 14 and 200 characters." }, { status: 400 });
    const db = await getDb();
    await ensureIndexes(db);
    const admins = db.collection("admins");
    // The system collection uses application-defined string IDs rather than MongoDB ObjectIds.
    const setup = db.collection<Document & { _id: string; email?: string; createdAt?: Date }>("system");
    // Atomic one-time claim prevents concurrent requests from creating multiple admins.
    try {
      await setup.insertOne({ _id: "primary-admin-bootstrap", email, createdAt: new Date() });
    } catch (error) {
      if (/duplicate key|E11000/i.test(error instanceof Error ? error.message : String(error))) {
        return NextResponse.json({ error: "Admin bootstrap has already been used. Sign in with the existing administrator." }, { status: 409 });
      }
      throw error;
    }
    if (await admins.countDocuments({}) > 0) {
      await setup.deleteOne({ _id: "primary-admin-bootstrap" });
      return NextResponse.json({ error: "An admin account already exists. Bootstrap is one-time only." }, { status: 409 });
    }
    try {
      const passwordHash = await hashPassword(password);
      await admins.insertOne({ email, passwordHash, createdAt: new Date(), role: "admin" });
    } catch (error) {
      await setup.deleteOne({ _id: "primary-admin-bootstrap" });
      throw error;
    }
    return NextResponse.json({ ok: true, message: "Admin account created. Remove ADMIN_BOOTSTRAP_TOKEN from the deployment environment now." }, { status: 201 });
  } catch (error) {
    console.error("Admin bootstrap failed:", error);
    return NextResponse.json({ error: "Could not create the admin account." }, { status: 500 });
  }
}
