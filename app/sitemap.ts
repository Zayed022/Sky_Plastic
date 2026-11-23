import type { MetadataRoute } from "next";
import { getPublicProducts } from "@/lib/catalogue";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return [];
  const products = await getPublicProducts();
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, changeFrequency: "monthly" as const, priority: p.featured ? .8 : .6 })),
  ];
}
