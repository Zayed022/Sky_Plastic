import { ObjectId } from "mongodb";
import { getDb, ensureIndexes } from "@/lib/db";
import type { Product, SiteSettings } from "@/lib/types";

export const DEMO_PRODUCTS: Product[] = [
  {
    _id: "sample-01",
    title: "Red Moulded Component Set",
    slug: "red-moulded-component-set",
    sku: "SP-SAMPLE-001",
    category: "Moulded Components",
    summary: "A reference view of a multi-part moulded plastic component set.",
    description: "This sample listing uses the product photograph supplied for the initial website concept. Confirm the trade name, dimensions, material grade and intended use before publishing a final product specification.",
    material: "To be confirmed",
    colours: ["Red"],
    moq: "Discuss with our team",
    specifications: [{ label: "Reference", value: "Customer-supplied product photo" }],
    images: ["/products/product-group-01.webp"],
    modelUrl: "",
    featured: true,
    status: "published",
    isSample: true,
  },
  {
    _id: "sample-02",
    title: "Red Strap & Fitting Components",
    slug: "red-strap-fitting-components",
    sku: "SP-SAMPLE-002",
    category: "Plastic Fittings",
    summary: "A reference view showing red plastic fittings and an elongated strap-style part.",
    description: "This sample listing is based only on the visible supplied photograph. Replace this description with verified application, dimensions, resin grade and packaging details before using it as a live catalogue specification.",
    material: "To be confirmed",
    colours: ["Red"],
    moq: "Discuss with our team",
    specifications: [{ label: "Reference", value: "Customer-supplied product photo" }],
    images: ["/products/product-group-02.webp"],
    modelUrl: "",
    featured: true,
    status: "published",
    isSample: true,
  },
  {
    _id: "sample-03",
    title: "Grey Strap-Style Components",
    slug: "grey-strap-style-components",
    sku: "SP-SAMPLE-003",
    category: "Plastic Straps & Parts",
    summary: "A reference view of grey elongated plastic parts with dark detail pieces.",
    description: "The image is a visual reference only. Confirm the exact product identity, compatible assembly, dimensions, material and available variants before publishing technical details.",
    material: "To be confirmed",
    colours: ["Grey", "Black"],
    moq: "Discuss with our team",
    specifications: [{ label: "Reference", value: "Customer-supplied product photo" }],
    images: ["/products/product-group-03.webp"],
    modelUrl: "",
    featured: false,
    status: "published",
    isSample: true,
  },
];

export const DEFAULT_SETTINGS: SiteSettings = {
  brandName: "Sky Plastic",
  heroEyebrow: "Family-led plastic manufacturing · Bhiwandi, Maharashtra",
  heroTitle: "Plastic components built for the work they do.",
  heroDescription: "A family manufacturing business with around three decades of hands-on experience and 25+ product varieties. Explore our range and connect directly for domestic or international bulk enquiries.",
  aboutTitle: "A manufacturing legacy, built one component at a time.",
  aboutDescription: "Sky Plastic is a family-led plastic product manufacturing business based in Bhiwandi, Maharashtra. We bring practical shop-floor experience, a broad product range and a direct line to the people who make the products.",
  capabilitiesTitle: "Good manufacturing starts with clear details.",
  capabilitiesDescription: "A straightforward way for buyers, distributors and procurement teams to explore the range and discuss requirements with the manufacturer.",
  capabilities: [
    { eyebrow: "01 / RANGE", title: "Product variety", description: "Share the product reference or image and tell us which component you are looking for." },
    { eyebrow: "02 / VARIANTS", title: "Colour options", description: "Tell us the colour and variant you need so availability can be checked for that product." },
    { eyebrow: "03 / QUANTITY", title: "Bulk enquiries", description: "Include your estimated quantity and buying frequency for a more useful conversation." },
    { eyebrow: "04 / DESTINATION", title: "Buyer locations", description: "Domestic and international enquiries are welcome. Share your delivery destination and timeline." },
  ],
  processTitle: "From product reference to quote.",
  processDescription: "A clear enquiry helps us understand what you need before we discuss the next step.",
  processSteps: [
    { title: "Choose a product", description: "Browse the catalogue or share a reference image / SKU." },
    { title: "Share requirements", description: "Tell us your quantity, preferred colour, country and specifications." },
    { title: "Discuss the details", description: "Our team can follow up to discuss availability and commercial terms." },
  ],
  faqTitle: "Before we get started.",
  faqDescription: "A few helpful details for procurement teams and buyers exploring Sky Plastic.",
  faqs: [
    { question: "Can you supply products in bulk?", answer: "Yes. Share the product, required quantity, destination and any specification details through the enquiry form. Our team can discuss availability and commercial terms directly with you." },
    { question: "Do you offer different colours?", answer: "The product range includes colour variations. Availability depends on the specific product and current production requirements; mention your preferred colour in the enquiry." },
    { question: "Can international buyers enquire?", answer: "Yes. International buyers can submit enquiries with their country, destination and estimated quantity. Shipping, documentation and commercial terms can then be discussed directly." },
    { question: "Where is Sky Plastic based?", answer: "Sky Plastic is based in Bhiwandi, Maharashtra, India." },
  ],
  enquiryTitle: "Let's make something move.",
  enquiryDescription: "Tell us what you are looking for. Include product details, quantity and delivery destination so our team can respond with context.",
  email: "",
  phone: "",
  whatsapp: "",
  address: "Bhiwandi, Maharashtra, India",
  footerNote: "For product details, colour availability, commercial terms and bulk requirements, speak with our team.",
  metaTitle: "Sky Plastic | Plastic Product Manufacturer in Bhiwandi, India",
  metaDescription: "Explore plastic components and product varieties from Sky Plastic, a family-led manufacturer based in Bhiwandi, Maharashtra. Enquire for domestic and international bulk supply.",
};

function serialiseProduct(doc: Record<string, unknown>): Product {
  return {
    ...doc,
    _id: doc._id instanceof ObjectId ? doc._id.toString() : String(doc._id ?? ""),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt ?? ""),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt ?? ""),
  } as Product;
}

export async function ensureDemoProducts(): Promise<void> {
  if (!process.env.MONGODB_URI) return;
  const db = await getDb();
  await ensureIndexes(db);
  const products = db.collection("products");
  const seedClaims = db.collection("system");
  // Claim the one-time seed with a unique document so parallel cold starts cannot
  // duplicate the starter records, and deleting products later does not recreate them.
  try {
    await seedClaims.insertOne({ _id: "catalogue-seed-v1", createdAt: new Date() });
  } catch (error) {
    if (/duplicate key|E11000/i.test(error instanceof Error ? error.message : String(error))) return;
    throw error;
  }
  if (await products.countDocuments({}) > 0) return;
  const now = new Date();
  try {
    await products.insertMany(DEMO_PRODUCTS.map(({ _id, ...product }) => ({ ...product, createdAt: now, updatedAt: now })));
  } catch (error) {
    await seedClaims.deleteOne({ _id: "catalogue-seed-v1" });
    throw error;
  }
}

export async function getPublicProducts(): Promise<Product[]> {
  if (!process.env.MONGODB_URI) return DEMO_PRODUCTS;
  await ensureDemoProducts();
  const db = await getDb();
  const docs = await db.collection("products")
    .find({ status: "published" })
    .sort({ featured: -1, updatedAt: -1 })
    .limit(100)
    .toArray();
  return docs.map((doc) => serialiseProduct(doc as unknown as Record<string, unknown>));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!process.env.MONGODB_URI) return DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null;
  await ensureDemoProducts();
  const db = await getDb();
  const doc = await db.collection("products").findOne({ slug, status: "published" });
  return doc ? serialiseProduct(doc as unknown as Record<string, unknown>) : null;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!process.env.MONGODB_URI) return DEFAULT_SETTINGS;
  const db = await getDb();
  const doc = await db.collection("siteSettings").findOne({ _id: "main" });
  return { ...DEFAULT_SETTINGS, ...(doc ?? {}) } as SiteSettings;
}
