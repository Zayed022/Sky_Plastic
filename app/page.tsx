import HomePage from "@/components/HomePage";
import { getPublicProducts, getSiteSettings } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [products, settings] = await Promise.all([getPublicProducts(), getSiteSettings()]);
  return <HomePage products={products} settings={settings} />;
}
