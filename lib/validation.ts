import type { Product, ProductStatus, SiteSettings } from "@/lib/types";

const clean = (value: unknown, max = 2000): string => typeof value === "string" ? value.trim().slice(0, max) : "";
export const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);

export function parseProduct(input: unknown): Omit<Product, "_id" | "createdAt" | "updatedAt" | "isSample"> {
  const body = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const title = clean(body.title, 120);
  const sku = clean(body.sku, 64).toUpperCase();
  const category = clean(body.category, 80);
  const summary = clean(body.summary, 260);
  const description = clean(body.description, 5000);
  const slug = slugify(clean(body.slug, 120) || title);
  const colours = Array.isArray(body.colours) ? body.colours.map((x) => clean(x, 32)).filter(Boolean).slice(0, 20) : [];
  const images = Array.isArray(body.images) ? body.images.map((x) => clean(x, 1000)).filter((x) => /^https:\/\//i.test(x) || x.startsWith("/products/")).slice(0, 12) : [];
  const modelUrl = clean(body.modelUrl, 1000);
  const specifications = Array.isArray(body.specifications) ? body.specifications.slice(0, 20).map((item) => {
    const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return { label: clean(row.label, 60), value: clean(row.value, 160) };
  }).filter((x) => x.label && x.value) : [];
  const status: ProductStatus = body.status === "published" ? "published" : "draft";
  if (!title || !sku || !category || !summary || !slug) throw new Error("Title, SKU, category and summary are required.");
  if (sku.length < 3) throw new Error("Please provide a valid SKU.");
  if (!images.length) throw new Error("Add at least one product image.");
  if (modelUrl && !/^https:\/\//i.test(modelUrl)) throw new Error("The 3D model must use an HTTPS URL.");
  return {
    title, slug, sku, category, summary, description,
    material: clean(body.material, 120),
    colours,
    moq: clean(body.moq, 120),
    specifications,
    images,
    modelUrl,
    featured: body.featured === true,
    status,
  };
}

export function parseSiteSettings(input: unknown): Omit<SiteSettings, "_id"> {
  const body = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  return {
    brandName: clean(body.brandName, 80) || "Sky Plastic",
    heroEyebrow: clean(body.heroEyebrow, 160),
    heroTitle: clean(body.heroTitle, 180),
    heroDescription: clean(body.heroDescription, 800),
    aboutTitle: clean(body.aboutTitle, 180),
    aboutDescription: clean(body.aboutDescription, 1200),
    capabilitiesTitle: clean(body.capabilitiesTitle, 180),
    capabilitiesDescription: clean(body.capabilitiesDescription, 800),
    capabilities: Array.isArray(body.capabilities) ? body.capabilities.slice(0, 8).map((item) => {
      const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
      return { eyebrow: clean(row.eyebrow, 80), title: clean(row.title, 100), description: clean(row.description, 400) };
    }).filter((x) => x.title && x.description) : [],
    processTitle: clean(body.processTitle, 180),
    processDescription: clean(body.processDescription, 800),
    processSteps: Array.isArray(body.processSteps) ? body.processSteps.slice(0, 8).map((item) => {
      const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
      return { title: clean(row.title, 100), description: clean(row.description, 400) };
    }).filter((x) => x.title && x.description) : [],
    faqTitle: clean(body.faqTitle, 180),
    faqDescription: clean(body.faqDescription, 800),
    faqs: Array.isArray(body.faqs) ? body.faqs.slice(0, 12).map((item) => {
      const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
      return { question: clean(row.question, 180), answer: clean(row.answer, 800) };
    }).filter((x) => x.question && x.answer) : [],
    enquiryTitle: clean(body.enquiryTitle, 180),
    enquiryDescription: clean(body.enquiryDescription, 800),
    email: clean(body.email, 160).toLowerCase(),
    phone: clean(body.phone, 40),
    whatsapp: clean(body.whatsapp, 40),
    address: clean(body.address, 240),
    footerNote: clean(body.footerNote, 400),
    metaTitle: clean(body.metaTitle, 160),
    metaDescription: clean(body.metaDescription, 300),
  };
}
