import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSiteSettings } from "@/lib/catalogue";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  return {
    ...(siteUrl ? { metadataBase: new URL(siteUrl), alternates: { canonical: "/" } } : {}),
    title: { default: settings.metaTitle || "Sky Plastic | Plastic Product Manufacturer in Bhiwandi, India", template: `%s | ${settings.brandName || "Sky Plastic"}` },
    description: settings.metaDescription,
    applicationName: settings.brandName || "Sky Plastic",
    openGraph: {
      type: "website", siteName: settings.brandName || "Sky Plastic", title: settings.metaTitle,
      description: settings.metaDescription, ...(siteUrl ? { url: siteUrl } : {}),
    },
    twitter: { card: "summary_large_image", title: settings.metaTitle, description: settings.metaDescription },
    icons: { icon: "/icon.svg", apple: "/icon.svg" },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#171e25" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-IN"><body>{children}</body></html>;
}
