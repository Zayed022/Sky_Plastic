"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product, SiteSettings } from "@/lib/types";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import EnquiryForm from "@/components/EnquiryForm";

const ProductStage = dynamic(() => import("@/components/ProductStage"), {
  ssr: false,
  loading: () => <div className="product-stage stage-loading"><div className="loading-ring" /><span>Preparing 3D showroom</span></div>,
});

function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <Link className="product-image-wrap" href={`/products/${product.slug}`} aria-label={`View ${product.title}`}>
        {product.images[0] ? <img src={product.images[0]} alt={product.title} loading="lazy" decoding="async" /> : <div className="image-placeholder">SP</div>}
        <span className="product-image-arrow" aria-hidden="true">↗</span>
        {product.featured ? <span className="product-tag">Featured</span> : null}
        {product.isSample ? <span className="sample-tag">Preview item</span> : null}
      </Link>
      <div className="product-card-copy">
        <div className="product-meta"><span>{product.category}</span><span>{product.sku}</span></div>
        <h3><Link href={`/products/${product.slug}`}>{product.title}</Link></h3>
        <p>{product.summary}</p>
        <div className="product-card-bottom"><span>{product.colours.length ? `${product.colours.length} colour option${product.colours.length > 1 ? "s" : ""}` : "Product variants"}</span><Link href={`/products/${product.slug}`} className="product-detail-link">View details <span>↗</span></Link></div>
      </div>
    </article>
  );
}

function ProductGrid({ products }: { products: Product[] }) {
  const [activeCategory, setActiveCategory] = useState("All products");
  const [search, setSearch] = useState("");
  const categories = useMemo(() => ["All products", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))], [products]);
  const visible = products.filter((p) => (activeCategory === "All products" || p.category === activeCategory) && `${p.title} ${p.sku} ${p.category} ${p.summary}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <>
      <div className="catalogue-controls">
        <div className="category-tabs" role="group" aria-label="Filter by product category">
          {categories.map((c) => <button type="button" key={c} className={activeCategory === c ? "category-tab active" : "category-tab"} onClick={() => setActiveCategory(c)}>{c}</button>)}
        </div>
        <label className="catalogue-search"><span aria-hidden="true">⌕</span><input aria-label="Search products" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products or SKU" /></label>
      </div>
      {visible.length ? <div className="product-grid">{visible.map(p => <ProductCard key={p._id ?? p.slug} product={p} />)}</div> : <div className="catalogue-empty"><span className="empty-index">01 / CATALOGUE</span><h3>Nothing matches that search.</h3><p>Try another product name or contact us for the complete product list.</p><Link className="text-button" href="#enquiry">Ask our team ↗</Link></div>}
    </>
  );
}

export default function HomePage({ products, settings }: { products: Product[]; settings: SiteSettings }) {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const faqs = settings.faqs;
  return (
    <main>
      <div className="topline"><div className="container topline-inner"><span><i /> Family-led manufacturing · Bhiwandi, India</span><span>Domestic & international business enquiries <b>↗</b></span></div></div>
      <SiteHeader settings={settings} />
      <section className="hero-section">
        <div className="hero-grid-pattern" aria-hidden="true" />
        <div className="container hero-inner">
          <div className="hero-copy">
            <div className="eyebrow eyebrow-light"><span className="eyebrow-line" />{settings.heroEyebrow}</div>
            <h1>{settings.heroTitle}</h1>
            <p>{settings.heroDescription}</p>
            <div className="hero-actions"><Link className="button button-accent" href="#products">Explore product range <span>↗</span></Link><Link className="button button-outline-light" href="#enquiry">Talk to the manufacturer <span>→</span></Link></div>
            <div className="hero-proof"><div className="proof-avatars"><span>S</span><span>P</span><span>30</span></div><span>Built on decades of hands-on manufacturing experience</span></div>
          </div>
          <div className="hero-visual"><ProductStage /><div className="visual-caption"><span>01 — MATERIAL & FORM</span><span>PLASTIC COMPONENTS</span></div><div className="hero-orbit-label"><span>SP</span><span>Designed around the product.</span></div></div>
        </div>
        <div className="container hero-bottomline"><span>SKY PLASTIC / PRODUCT & MANUFACTURING</span><span><i>BIWANDI, INDIA</i></span></div>
      </section>
      <section className="stats-strip"><div className="container stats-grid"><div><strong>~30<span> yrs</span></strong><small>Family manufacturing legacy</small></div><div><strong>25<span>+</span></strong><small>Product varieties</small></div><div><strong>01</strong><small>Direct manufacturer contact</small></div><div><strong>∞</strong><small>Possibilities for a conversation</small></div></div></section>
      <section className="section section-catalogue" id="products">
        <div className="container">
          <div className="section-heading section-heading-row"><div><div className="eyebrow"><span className="eyebrow-line" /> THE PRODUCT RANGE</div><h2>Made for real-world<br /><em>applications.</em></h2></div><div className="section-heading-side"><p>Explore a selection of our plastic product range. Looking for a specific component, colour or bulk quantity? Send us your requirements.</p><Link className="text-button" href="#enquiry">Request complete catalogue <span>↗</span></Link></div></div>
          <ProductGrid products={products} />
          {products.some(p => p.isSample) ? <p className="sample-disclaimer">Preview catalogue entries based on the initial photographs supplied. Replace sample names and technical details from the admin panel before publishing the final catalogue.</p> : null}
        </div>
      </section>
      <section className="section section-about" id="about">
        <div className="container about-grid">
          <div className="about-mark"><span className="about-mark-big">SP</span><span className="about-mark-small">BHIWANDI<br />MAHARASHTRA<br />INDIA</span><div className="about-circle" /></div>
          <div className="about-copy"><div className="eyebrow"><span className="eyebrow-line" /> OUR STORY</div><h2>{settings.aboutTitle}</h2><p className="about-lede">{settings.aboutDescription}</p><div className="about-points"><div><span>01</span><p><strong>Direct manufacturer access</strong><small>Talk to the people behind the products and production.</small></p></div><div><span>02</span><p><strong>A broad product mix</strong><small>Explore 25+ product varieties and available colour options.</small></p></div><div><span>03</span><p><strong>Built for business enquiries</strong><small>Share your quantity, specifications and delivery destination.</small></p></div></div><Link className="text-button" href="#enquiry">Start a conversation <span>↗</span></Link></div>
        </div>
      </section>
      <section className="section section-capabilities" id="capabilities">
        <div className="container">
          <div className="section-heading"><div className="eyebrow eyebrow-light"><span className="eyebrow-line" /> WORK WITH SKY PLASTIC</div><h2>{settings.capabilitiesTitle}</h2><p className="section-intro">{settings.capabilitiesDescription}</p></div>
          <div className="capability-grid">{settings.capabilities.map((item, i) => <article key={`${item.title}-${i}`}><span>{item.eyebrow || `0${i + 1} / CAPABILITY`}</span><div className="cap-icon">{["◈", "◍", "▤", "◎"][i % 4]}</div><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>
        </div>
      </section>
      <section className="section section-process"><div className="container process-grid"><div className="process-title"><div className="eyebrow"><span className="eyebrow-line" /> HOW TO ENQUIRE</div><h2>{settings.processTitle}</h2><p>{settings.processDescription}</p></div><div className="process-steps">{settings.processSteps.map((step, i) => <div key={`${step.title}-${i}`}><span>{`0${i + 1}`}</span><div><h3>{step.title}</h3><p>{step.description}</p></div><b>↗</b></div>)}</div></div></section>
      <section className="section section-faq"><div className="container faq-grid"><div><div className="eyebrow"><span className="eyebrow-line" /> BUYER QUESTIONS</div><h2>{settings.faqTitle}</h2><p className="section-intro">{settings.faqDescription}</p></div><div className="faq-list">{faqs.map((faq, i) => <div className={`faq-item ${activeFaq === i ? "is-active" : ""}`} key={faq.question}><button type="button" aria-expanded={activeFaq === i} onClick={() => setActiveFaq(activeFaq === i ? null : i)}><span>{`0${i + 1}`}</span><strong>{faq.question}</strong><i>{activeFaq === i ? "−" : "+"}</i></button>{activeFaq === i ? <p>{faq.answer}</p> : null}</div>)}</div></div></section>
      <section className="section section-enquiry" id="enquiry"><div className="container enquiry-layout"><div className="enquiry-intro"><div className="eyebrow eyebrow-light"><span className="eyebrow-line" /> START A BUSINESS ENQUIRY</div><h2>{settings.enquiryTitle}</h2><p>{settings.enquiryDescription}</p><div className="enquiry-note"><span>SKY PLASTIC</span><span>BIWANDI · MAHARASHTRA · INDIA</span></div></div><div className="enquiry-panel"><div className="form-heading"><span>01 / ENQUIRY FORM</span><h3>What can we help you source?</h3></div><EnquiryForm /></div></div></section>
      <SiteFooter settings={settings} />
    </main>
  );
}
