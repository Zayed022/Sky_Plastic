import process from "node:process";
import { MongoClient } from "mongodb";
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

// Load the project's local server-side environment file when present.
// Existing shell environment values take precedence over values in .env.local.
try {
  process.loadEnvFile(".env.local");
} catch (error) {
  if (error && typeof error === "object" && "code" in error && error.code !== "ENOENT") {
    throw error;
  }
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "sky_plastic";
const email = (process.env.SKY_ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.SKY_ADMIN_PASSWORD || "";

if (!uri) {
  console.error("MONGODB_URI is missing. Add it to .env.local or export it in your shell.");
  process.exit(1);
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("SKY_ADMIN_EMAIL must contain a valid email-style login ID.");
  process.exit(1);
}
if (password.length < 14 || password.length > 200) {
  console.error("SKY_ADMIN_PASSWORD must be between 14 and 200 characters.");
  process.exit(1);
}

async function makePasswordHash(value) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(value, salt, 64);
  return `scrypt$${salt}$${Buffer.from(derived).toString("hex")}`;
}

const client = new MongoClient(uri, {
  maxPoolSize: 2,
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  appName: "sky-plastic-admin-credential-setup",
});

try {
  await client.connect();
  const db = client.db(dbName);
  const admins = db.collection("admins");
  await admins.createIndex({ email: 1 }, { unique: true, name: "admin_email_unique" });

  const existing = await admins.findOne({ email });
  const totalAdmins = await admins.countDocuments({});
  const passwordHash = await makePasswordHash(password);
  const now = new Date();

  if (existing) {
    await admins.updateOne(
      { _id: existing._id },
      { $set: { passwordHash, role: "admin", updatedAt: now } },
    );
    console.log(`Updated the password for the existing administrator: ${email}`);
  } else if (totalAdmins === 0) {
    await admins.insertOne({ email, passwordHash, role: "admin", createdAt: now, updatedAt: now });
    console.log(`Created the first administrator: ${email}`);
  } else if (totalAdmins === 1) {
    const currentAdmin = await admins.findOne({});
    if (!currentAdmin) throw new Error("Could not read the existing administrator record.");
    await admins.updateOne(
      { _id: currentAdmin._id },
      { $set: { email, passwordHash, role: "admin", updatedAt: now } },
    );
    console.log(`Recovered the single existing administrator and set the login ID to: ${email}`);
  } else {
    throw new Error(
      `Found ${totalAdmins} administrator accounts. No changes were made because automatic recovery only changes a matching account or a single-admin installation. Review the admins collection manually.`,
    );
  }

  console.log(`Database: ${dbName}`);
  console.log("Credential setup completed. Sign in at /admin/login.");
  console.log("For security, close this terminal and do not commit the credentials to Git.");
} catch (error) {
  console.error("Could not set administrator credentials:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await client.close().catch(() => undefined);
}
