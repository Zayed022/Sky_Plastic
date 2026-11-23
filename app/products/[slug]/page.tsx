import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EnquiryForm from "@/components/EnquiryForm";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import ProductModelViewer from "@/components/ProductModelViewer";
import { getProductBySlug, getSiteSettings } from "@/lib/catalogue";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.title,
    description: product.summary,
    openGraph: { title: `${product.title} | Sky Plastic`, description: product.summary, images: product.images[0] ? [product.images[0]] : [] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSiteSettings()]);
  if (!product) notFound();
  return <main className="product-detail-page">
    <div className="topline"><div className="container topline-inner"><span><i /> Family-led manufacturing · Bhiwandi, India</span><span>Domestic & international business enquiries <b>↗</b></span></div></div>
    <SiteHeader settings={settings} />
    <div className="container detail-breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/#products">Products</Link><span>/</span><span>{product.title}</span></div>
    <section className="container product-detail-grid">
      <div className="detail-image-wrap">
        {product.images[0] ? <img src={product.images[0]} alt={product.title} className="detail-product-image" /> : <div className="detail-image-fallback">SKY PLASTIC</div>}
        {product.images.length > 1 ? <div className="detail-thumbnails">{product.images.slice(1).map((src, index) => <img key={`${src}-${index}`} src={src} alt={`${product.title} view ${index + 2}`} loading="lazy" />)}</div> : null}
        {product.images.length > 1 ? <div className="detail-image-count">{product.images.length} product views</div> : null}
      </div>
      <div className="detail-product-copy">
        <div className="eyebrow"><span className="eyebrow-line" /> {product.category}</div>
        <span className="detail-sku">PRODUCT REF. {product.sku}</span>
        <h1>{product.title}</h1>
        <p className="detail-summary">{product.summary}</p>
        {product.isSample ? <p className="sample-detail-note">Preview listing. Confirm the product name and technical specification with Sky Plastic before placing an order.</p> : null}
        <div className="detail-spec-list">
          <div><span>Material</span><strong>{product.material || "Please enquire"}</strong></div>
          <div><span>Available colours</span><strong>{product.colours.length ? product.colours.join(", ") : "Please enquire"}</strong></div>
          <div><span>Minimum order</span><strong>{product.moq || "Discuss with our team"}</strong></div>
          <div><span>Supply destination</span><strong>Domestic & international enquiries</strong></div>
        </div>
        <Link className="button button-accent" href="#product-enquiry">Enquire about this product <span>↗</span></Link>
      </div>
    </section>
    {product.modelUrl ? <div className="container"><ProductModelViewer url={product.modelUrl} title={product.title} /></div> : null}
    <section className="container detail-description-grid">
      <div><div className="eyebrow"><span className="eyebrow-line" /> PRODUCT INFORMATION</div><h2>Details that matter<br /><em>to your application.</em></h2></div>
      <div><p>{product.description}</p>{product.specifications.length ? <div className="spec-table">{product.specifications.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div> : null}</div>
    </section>
    <section className="container detail-enquiry" id="product-enquiry"><div className="detail-enquiry-copy"><div className="eyebrow eyebrow-light"><span className="eyebrow-line" /> ASK ABOUT THIS PRODUCT</div><h2>Need a bulk<br /><em>quotation?</em></h2><p>Share quantity, preferred colour, destination and any specification details. Our team can follow up directly.</p></div><div className="detail-enquiry-form"><EnquiryForm productName={product.title} compact /></div></section>
    <SiteFooter settings={settings} />
  </main>;
}
