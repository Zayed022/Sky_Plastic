import { MongoClient, type Db } from "mongodb";

type MongoGlobal = typeof globalThis & {
  _skyMongoClientPromise?: Promise<MongoClient>;
  _skyMongoIndexesPromise?: Promise<void>;
};

const mongoGlobal = globalThis as MongoGlobal;

export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured. Add it to your environment variables.");
  const dbName = process.env.MONGODB_DB || "sky_plastic";

  if (!mongoGlobal._skyMongoClientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      appName: "sky-plastic-web",
    });
    mongoGlobal._skyMongoClientPromise = client.connect();
  }

  const client = await mongoGlobal._skyMongoClientPromise;
  return client.db(dbName);
}

export async function ensureIndexes(db: Db): Promise<void> {
  if (!mongoGlobal._skyMongoIndexesPromise) {
    mongoGlobal._skyMongoIndexesPromise = Promise.all([
      db.collection("products").createIndex({ slug: 1 }, { unique: true, name: "product_slug_unique" }),
      db.collection("products").createIndex({ sku: 1 }, { unique: true, name: "product_sku_unique" }),
      db.collection("products").createIndex({ status: 1, featured: -1, updatedAt: -1 }, { name: "public_catalogue_sort" }),
      db.collection("leads").createIndex({ createdAt: -1 }, { name: "lead_created_desc" }),
      db.collection("leads").createIndex({ status: 1, createdAt: -1 }, { name: "lead_status_created" }),
      db.collection("leads").createIndex({ ipHash: 1, createdAt: -1 }, { name: "lead_ip_rate_limit" }),
      db.collection("admins").createIndex({ email: 1 }, { unique: true, name: "admin_email_unique" }),
      db.collection("loginAttempts").createIndex({ updatedAt: 1 }, { expireAfterSeconds: 86400, name: "login_attempts_ttl" }),
    ]).then(() => undefined);
  }
  await mongoGlobal._skyMongoIndexesPromise;
}
