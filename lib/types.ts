export type ProductStatus = "draft" | "published";
export type LeadStatus = "new" | "contacted" | "quoted" | "won" | "lost";

export type Product = {
  _id?: string;
  title: string;
  slug: string;
  sku: string;
  category: string;
  summary: string;
  description: string;
  material: string;
  colours: string[];
  moq: string;
  specifications: { label: string; value: string }[];
  images: string[];
  modelUrl: string;
  featured: boolean;
  status: ProductStatus;
  isSample?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type SiteSettings = {
  _id?: string;
  brandName: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  aboutTitle: string;
  aboutDescription: string;
  capabilitiesTitle: string;
  capabilitiesDescription: string;
  capabilities: { eyebrow: string; title: string; description: string }[];
  processTitle: string;
  processDescription: string;
  processSteps: { title: string; description: string }[];
  faqTitle: string;
  faqDescription: string;
  faqs: { question: string; answer: string }[];
  enquiryTitle: string;
  enquiryDescription: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  footerNote: string;
  metaTitle: string;
  metaDescription: string;
};

export type Lead = {
  _id: string;
  name: string;
  company: string;
  email: string;
  country: string;
  phone: string;
  product: string;
  quantity: string;
  message: string;
  status: LeadStatus;
  createdAt: string;
};
