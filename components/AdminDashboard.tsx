"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Lead, LeadStatus, Product, SiteSettings } from "@/lib/types";

type Tab = "overview" | "products" | "enquiries" | "website";
type ProductDraft = Omit<Product, "_id" | "createdAt" | "updatedAt" | "isSample">;
const emptyProduct: ProductDraft = {
  title: "", slug: "", sku: "", category: "", summary: "", description: "", material: "", colours: [], moq: "", specifications: [], images: [], modelUrl: "", featured: false, status: "draft",
};
const defaultSettings: SiteSettings = {
  brandName: "Sky Plastic", heroEyebrow: "", heroTitle: "", heroDescription: "", aboutTitle: "", aboutDescription: "", capabilitiesTitle: "", capabilitiesDescription: "", capabilities: [], processTitle: "", processDescription: "", processSteps: [], faqTitle: "", faqDescription: "", faqs: [], enquiryTitle: "", enquiryDescription: "", email: "", phone: "", whatsapp: "", address: "", footerNote: "", metaTitle: "", metaDescription: "",
};
const leadStatuses: LeadStatus[] = ["new", "contacted", "quoted", "won", "lost"];

async function requestJson(url: string, options?: RequestInit) {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers || {}) }, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "The request could not be completed.");
  return data;
}

function Field({ label, value, onChange, multiline = false, required = false, hint, type = "text" }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; required?: boolean; hint?: string; type?: string }) {
  return <label className="admin-field"><span>{label}{required ? " *" : ""}</span>{multiline ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={4} required={required} /> : <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} />}{hint ? <small>{hint}</small> : null}</label>;
}

export default function AdminDashboard({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<ProductDraft>(emptyProduct);
  const [coloursText, setColoursText] = useState("");
  const [imagesText, setImagesText] = useState("");
  const [specificationsText, setSpecificationsText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productModal, setProductModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productQuery, setProductQuery] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [productData, leadData, settingsData] = await Promise.all([
        requestJson("/api/admin/products"), requestJson("/api/admin/leads"), requestJson("/api/settings"),
      ]);
      setProducts(productData.products || []); setLeads(leadData.leads || []); setSettings({ ...defaultSettings, ...(settingsData.settings || {}) });
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load dashboard data."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);
  const publishedCount = products.filter(p => p.status === "published").length;
  const newLeads = leads.filter(l => l.status === "new").length;
  const wonLeads = leads.filter(l => l.status === "won").length;
  const recentLeads = leads.slice(0, 5);
  const visibleProducts = useMemo(() => products.filter(p => `${p.title} ${p.sku} ${p.category}`.toLowerCase().includes(productQuery.toLowerCase())), [products, productQuery]);

  function notify(message: string) { setNotice(message); setError(""); window.setTimeout(() => setNotice(""), 4500); }
  function updateDraft<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) { setDraft(old => ({ ...old, [key]: value })); }
  function openCreate() { setDraft({ ...emptyProduct }); setColoursText(""); setImagesText(""); setSpecificationsText(""); setEditingId(null); setProductModal(true); setError(""); }
  function openEdit(product: Product) {
    setDraft({ title: product.title, slug: product.slug, sku: product.sku, category: product.category, summary: product.summary, description: product.description, material: product.material, colours: product.colours, moq: product.moq, specifications: product.specifications, images: product.images, modelUrl: product.modelUrl || "", featured: product.featured, status: product.status });
    setColoursText(product.colours.join(", ")); setImagesText(product.images.join("\n")); setSpecificationsText(product.specifications.map(s => `${s.label}: ${s.value}`).join("\n"));
    setEditingId(product._id || null); setProductModal(true); setError("");
  }
  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const specifications = specificationsText.split("\n").map(line => { const [label, ...rest] = line.split(":"); return { label: label.trim(), value: rest.join(":").trim() }; }).filter(x => x.label && x.value);
      const payload = { ...draft, colours: coloursText.split(",").map(s => s.trim()).filter(Boolean), images: imagesText.split("\n").map(s => s.trim()).filter(Boolean), specifications };
      const url = editingId ? `/api/admin/products/${editingId}` : "/api/admin/products";
      await requestJson(url, { method: editingId ? "PUT" : "POST", body: JSON.stringify(payload) });
      setProductModal(false); notify(editingId ? "Product changes saved." : "Product added to the catalogue."); await loadAll();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save product."); }
    finally { setSaving(false); }
  }
  async function deleteProduct(product: Product) {
    if (!product._id || !window.confirm(`Delete “${product.title}”? This cannot be undone.`)) return;
    try { await requestJson(`/api/admin/products/${product._id}`, { method: "DELETE" }); notify("Product deleted."); await loadAll(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not delete product."); }
  }
  async function changeLeadStatus(lead: Lead, status: LeadStatus) {
    try { await requestJson(`/api/admin/leads/${lead._id}`, { method: "PATCH", body: JSON.stringify({ status }) }); setLeads(old => old.map(l => l._id === lead._id ? { ...l, status } : l)); notify("Enquiry status updated."); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not update enquiry."); }
  }
  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try { await requestJson("/api/settings", { method: "PUT", body: JSON.stringify(settings) }); notify("Website content saved."); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save settings."); }
    finally { setSaving(false); }
  }
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/admin/login";
  }
  async function uploadProductImage(file: File) {
    setError(""); setNotice("");
    if (!file.type.startsWith("image/")) { setError("Choose an image file."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Please use an image smaller than 10 MB."); return; }
    try {
      const sign = await requestJson("/api/admin/upload-signature", { method: "POST", body: "{}" });
      const data = new FormData(); data.set("file", file); data.set("api_key", sign.apiKey); data.set("timestamp", String(sign.timestamp)); data.set("folder", sign.folder); data.set("signature", sign.signature);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, { method: "POST", body: data });
      const result = await response.json(); if (!response.ok) throw new Error(result.error?.message || "Image upload failed.");
      setImagesText(current => [...current.split("\n").map(s => s.trim()).filter(Boolean), result.secure_url].join("\n"));
      notify("Product image uploaded.");
    } catch (e) { setError(e instanceof Error ? e.message : "Image upload is not available. Paste a secure image URL instead."); }
  }

  async function uploadModel(file: File) {
    setError(""); setNotice("");
    if (!/\.glb$/i.test(file.name)) { setError("Upload a .glb model file. Convert CAD exports to GLB before uploading."); return; }
    if (file.size > 20 * 1024 * 1024) { setError("Please use a GLB file smaller than 20 MB."); return; }
    try {
      const sign = await requestJson("/api/admin/model-upload-signature", { method: "POST", body: "{}" });
      const data = new FormData(); data.set("file", file); data.set("api_key", sign.apiKey); data.set("timestamp", String(sign.timestamp)); data.set("folder", sign.folder); data.set("signature", sign.signature); data.set("resource_type", "raw");
      const response = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/raw/upload`, { method: "POST", body: data });
      const result = await response.json(); if (!response.ok) throw new Error(result.error?.message || "3D model upload failed.");
      updateDraft("modelUrl", result.secure_url); notify("3D model uploaded.");
    } catch (e) { setError(e instanceof Error ? e.message : "3D model upload is not available. Paste an HTTPS GLB URL instead."); }
  }

  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <Link href="/" className="brand-lockup"><span className="brand-mark"><span /><span /><span /></span><span className="brand-copy"><strong>Sky Plastic</strong><small>CONTROL PANEL</small></span></Link>
      <div className="admin-side-label">WORKSPACE</div>
      <nav className="admin-nav" aria-label="Admin sections">
        {([ ["overview","◫","Overview"], ["products","▧","Products"], ["enquiries","✉","Buyer enquiries"], ["website","⌘","Website content"] ] as [Tab,string,string][]).map(([id, icon, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => { setTab(id); setError(""); }}><span>{icon}</span>{label}{id === "enquiries" && newLeads > 0 ? <i>{newLeads}</i> : null}</button>)}
      </nav>
      <div className="admin-sidebar-bottom"><div className="admin-user-avatar">{email.slice(0,1).toUpperCase()}</div><div className="admin-user-copy"><strong>{email}</strong><small>Administrator</small></div><button aria-label="Sign out" title="Sign out" onClick={logout}>↗</button></div>
    </aside>
    <main className="admin-main">
      <header className="admin-topbar"><div><span>SKY PLASTIC / ADMIN</span><strong>{tab === "overview" ? "Overview" : tab === "products" ? "Product catalogue" : tab === "enquiries" ? "Buyer enquiries" : "Website content"}</strong></div><div className="admin-top-actions"><Link href="/" target="_blank">View live website ↗</Link><button onClick={() => void loadAll()} aria-label="Refresh dashboard">↻</button></div></header>
      <div className="admin-content">
        {notice ? <div className="admin-notice" role="status">✓ {notice}</div> : null}
        {error ? <div className="admin-error" role="alert">{error}</div> : null}
        {loading ? <div className="admin-loading"><span className="loading-spinner" /> Loading your workspace…</div> : null}
        {!loading && tab === "overview" ? <>
          <div className="admin-page-intro"><div><div className="eyebrow"><span className="eyebrow-line" /> BUSINESS SNAPSHOT</div><h1>Good to see you.</h1><p>Here is what is happening across the Sky Plastic website.</p></div><button className="button button-accent" onClick={openCreate}>＋ Add a product</button></div>
          <div className="admin-metric-grid"><article><span>CATALOGUE / PUBLISHED</span><strong>{publishedCount}</strong><small>Live product listings</small><i>↗</i></article><article><span>CATALOGUE / TOTAL</span><strong>{products.length}</strong><small>Including drafts</small><i>▧</i></article><article><span>BUYER / NEW ENQUIRIES</span><strong>{newLeads}</strong><small>Waiting for follow-up</small><i>✉</i></article><article><span>BUYER / CONVERTED</span><strong>{wonLeads}</strong><small>Marked as won</small><i>✓</i></article></div>
          <div className="admin-overview-columns"><section className="admin-panel"><div className="admin-panel-heading"><div><span>01 / PIPELINE</span><h2>Recent buyer enquiries</h2></div><button className="admin-text-action" onClick={() => setTab("enquiries")}>View all ↗</button></div>{recentLeads.length ? <div className="admin-recent-list">{recentLeads.map(lead => <div key={lead._id}><span className="lead-avatar">{lead.name.slice(0,1).toUpperCase()}</span><div><strong>{lead.name}</strong><small>{lead.company || lead.country || lead.email}</small></div><span className={`status-chip status-${lead.status}`}>{lead.status}</span></div>)}</div> : <div className="admin-empty"><span>✉</span><strong>No enquiries yet</strong><p>New buyer enquiries submitted from the website will appear here.</p></div>}</section>
            <section className="admin-panel"><div className="admin-panel-heading"><div><span>02 / CATALOGUE</span><h2>Product visibility</h2></div><button className="admin-text-action" onClick={() => setTab("products")}>Manage ↗</button></div><div className="visibility-bar"><div><strong>{products.length ? Math.round(publishedCount / products.length * 100) : 0}%</strong><span>published</span></div><div className="visibility-track"><i style={{ width: `${products.length ? publishedCount / products.length * 100 : 0}%` }} /></div></div><div className="visibility-legend"><span><i /> Live products <b>{publishedCount}</b></span><span><i /> Draft products <b>{products.length - publishedCount}</b></span></div><div className="admin-tip"><span>↗</span><p>Keep product names, SKUs, images and specifications accurate. Clear catalogue information helps procurement teams evaluate your range.</p></div></section></div>
          <section className="admin-panel admin-quick-panel"><div className="admin-panel-heading"><div><span>03 / SHORTCUTS</span><h2>Keep your website current</h2></div></div><div className="admin-shortcuts"><button onClick={openCreate}><span>＋</span><strong>Add product</strong><small>Expand the online catalogue</small></button><button onClick={() => setTab("website")}><span>⌘</span><strong>Update website copy</strong><small>Manage the homepage and contact details</small></button><button onClick={() => setTab("enquiries")}><span>✉</span><strong>Review enquiries</strong><small>Track follow-up with potential buyers</small></button></div></section>
        </> : null}
        {!loading && tab === "products" ? <>
          <div className="admin-page-intro"><div><div className="eyebrow"><span className="eyebrow-line" /> CATALOGUE MANAGEMENT</div><h1>Product catalogue.</h1><p>Create, update and control the products displayed on your public website.</p></div><button className="button button-accent" onClick={openCreate}>＋ Add product</button></div>
          <div className="admin-toolbar"><div className="admin-product-search">⌕ <input value={productQuery} onChange={e => setProductQuery(e.target.value)} placeholder="Search by product, SKU or category" /></div><span>{visibleProducts.length} products</span></div>
          <section className="admin-panel admin-table-panel"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>PRODUCT</th><th>SKU / CATEGORY</th><th>STATUS</th><th>UPDATED</th><th aria-label="Actions" /></tr></thead><tbody>{visibleProducts.map(product => <tr key={product._id || product.slug}><td><div className="admin-product-cell"><div className="admin-product-thumb">{product.images[0] ? <img src={product.images[0]} alt="" /> : <span>SP</span>}</div><div><strong>{product.title}</strong><small>{product.featured ? "Featured listing" : "Standard listing"}</small></div></div></td><td><strong>{product.sku}</strong><small className="cell-sub">{product.category}</small></td><td><span className={`status-chip ${product.status === "published" ? "status-won" : "status-draft"}`}>{product.status}</span>{product.isSample ? <small className="cell-sub">Sample entry</small> : null}</td><td>{product.updatedAt ? new Date(product.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td><td><div className="table-actions"><button onClick={() => openEdit(product)}>Edit</button><button onClick={() => void deleteProduct(product)} aria-label={`Delete ${product.title}`}>Delete</button></div></td></tr>)}</tbody></table>{!visibleProducts.length ? <div className="admin-empty"><strong>No products found</strong><p>Add a listing or adjust your search.</p></div> : null}</div></section>
        </> : null}
        {!loading && tab === "enquiries" ? <>
          <div className="admin-page-intro"><div><div className="eyebrow"><span className="eyebrow-line" /> BUYER RELATIONSHIPS</div><h1>Buyer enquiries.</h1><p>Review the details shared by potential customers and track every follow-up.</p></div></div>
          <div className="admin-metric-grid admin-metric-grid-small"><article><span>NEW</span><strong>{newLeads}</strong><small>Require first contact</small></article><article><span>IN PROGRESS</span><strong>{leads.filter(l => ["contacted","quoted"].includes(l.status)).length}</strong><small>Contacted or quoted</small></article><article><span>WON</span><strong>{wonLeads}</strong><small>Converted enquiries</small></article><article><span>TOTAL</span><strong>{leads.length}</strong><small>All recorded enquiries</small></article></div>
          <div className="admin-enquiry-list">{leads.map(lead => <article className="admin-enquiry-card" key={lead._id}><div className="admin-enquiry-top"><div><span className="lead-date">{new Date(lead.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span><h3>{lead.name}</h3><p>{lead.company || "Individual buyer"} {lead.country ? `· ${lead.country}` : ""}</p></div><select aria-label={`Update status for ${lead.name}`} value={lead.status} onChange={e => void changeLeadStatus(lead, e.target.value as LeadStatus)}>{leadStatuses.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select></div><div className="admin-enquiry-details"><div><span>EMAIL</span><a href={`mailto:${lead.email}`}>{lead.email}</a></div>{lead.phone ? <div><span>PHONE / WHATSAPP</span><a href={`tel:${lead.phone}`}>{lead.phone}</a></div> : null}{lead.product ? <div><span>PRODUCT</span><strong>{lead.product}</strong></div> : null}{lead.quantity ? <div><span>ESTIMATED QUANTITY</span><strong>{lead.quantity}</strong></div> : null}</div><p className="admin-enquiry-message">{lead.message}</p></article>)}{!leads.length ? <div className="admin-panel admin-empty"><span>✉</span><strong>No buyer enquiries yet</strong><p>When a buyer submits the public enquiry form, their details will appear here.</p></div> : null}</div>
        </> : null}
        {!loading && tab === "website" ? <>
          <div className="admin-page-intro"><div><div className="eyebrow"><span className="eyebrow-line" /> CONTENT MANAGEMENT</div><h1>Website content.</h1><p>Manage your business story, homepage copy and published contact details.</p></div><Link href="/" target="_blank" className="admin-outline-button">Preview website ↗</Link></div>
          <form className="admin-panel admin-settings-form" onSubmit={saveSettings}>
            <div className="settings-section-heading"><span>01 / BRAND & HERO</span><h2>First impression</h2><p>This is the content visitors see first on the public homepage.</p></div>
            <div className="admin-form-grid"><Field label="Business name" required value={settings.brandName} onChange={v => setSettings(s => ({...s,brandName:v}))}/><Field label="Hero eyebrow" value={settings.heroEyebrow} onChange={v => setSettings(s => ({...s,heroEyebrow:v}))}/><Field label="Hero heading" required value={settings.heroTitle} onChange={v => setSettings(s => ({...s,heroTitle:v}))}/><Field label="SEO title" value={settings.metaTitle} onChange={v => setSettings(s => ({...s,metaTitle:v}))}/><div className="admin-field admin-field-full"><Field label="Hero description" multiline value={settings.heroDescription} onChange={v => setSettings(s => ({...s,heroDescription:v}))}/></div></div>
            <div className="settings-section-heading"><span>02 / ABOUT SKY PLASTIC</span><h2>Your business story</h2><p>Tell buyers about the company, its experience and what makes it a reliable manufacturing partner.</p></div>
            <div className="admin-form-grid"><Field label="About heading" value={settings.aboutTitle} onChange={v => setSettings(s => ({...s,aboutTitle:v}))}/><Field label="Business address" value={settings.address} onChange={v => setSettings(s => ({...s,address:v}))}/><div className="admin-field admin-field-full"><Field label="About description" multiline value={settings.aboutDescription} onChange={v => setSettings(s => ({...s,aboutDescription:v}))}/></div></div>
            <div className="settings-section-heading"><span>03 / CONTACT & SEARCH</span><h2>Help buyers reach you</h2><p>Only add contact channels that your business actively monitors.</p></div>
            <div className="admin-form-grid"><Field label="Business email" type="email" value={settings.email} onChange={v => setSettings(s => ({...s,email:v}))}/><Field label="Phone number" value={settings.phone} onChange={v => setSettings(s => ({...s,phone:v}))}/><Field label="WhatsApp number" value={settings.whatsapp} onChange={v => setSettings(s => ({...s,whatsapp:v}))} hint="International format with country code; digits only preferred."/><Field label="SEO description" value={settings.metaDescription} onChange={v => setSettings(s => ({...s,metaDescription:v}))}/><div className="admin-field admin-field-full"><Field label="Footer note" multiline value={settings.footerNote} onChange={v => setSettings(s => ({...s,footerNote:v}))}/></div></div>
            <div className="settings-section-heading"><span>04 / HOMEPAGE SECTIONS</span><h2>Capabilities & enquiry process</h2><p>One item per line. Use a vertical bar | between the fields described below.</p></div>
            <div className="admin-form-grid"><Field label="Capabilities heading" value={settings.capabilitiesTitle} onChange={v => setSettings(s => ({...s,capabilitiesTitle:v}))}/><Field label="Capabilities introduction" value={settings.capabilitiesDescription} onChange={v => setSettings(s => ({...s,capabilitiesDescription:v}))}/><div className="admin-field admin-field-full"><Field label="Capability cards: eyebrow | title | description" multiline value={settings.capabilities.map(x => `${x.eyebrow} | ${x.title} | ${x.description}`).join("\n")} onChange={v => setSettings(s => ({...s,capabilities:v.split("\n").map(line => {const [eyebrow,title,...rest]=line.split("|");return {eyebrow:eyebrow.trim(),title:title?.trim()||"",description:rest.join("|").trim()};}).filter(x => x.title && x.description)}))}/></div><Field label="Enquiry process heading" value={settings.processTitle} onChange={v => setSettings(s => ({...s,processTitle:v}))}/><Field label="Enquiry process introduction" value={settings.processDescription} onChange={v => setSettings(s => ({...s,processDescription:v}))}/><div className="admin-field admin-field-full"><Field label="Process steps: title | description" multiline value={settings.processSteps.map(x => `${x.title} | ${x.description}`).join("\n")} onChange={v => setSettings(s => ({...s,processSteps:v.split("\n").map(line => {const [title,...rest]=line.split("|");return {title:title.trim(),description:rest.join("|").trim()};}).filter(x => x.title && x.description)}))}/></div></div>
            <div className="settings-section-heading"><span>05 / FAQ & ENQUIRY COPY</span><h2>Answer buyer questions</h2><p>Keep answers accurate and avoid promising lead times, certifications or delivery terms that are not confirmed.</p></div>
            <div className="admin-form-grid"><Field label="FAQ heading" value={settings.faqTitle} onChange={v => setSettings(s => ({...s,faqTitle:v}))}/><Field label="FAQ introduction" value={settings.faqDescription} onChange={v => setSettings(s => ({...s,faqDescription:v}))}/><div className="admin-field admin-field-full"><Field label="FAQ entries: question | answer" multiline value={settings.faqs.map(x => `${x.question} | ${x.answer}`).join("\n")} onChange={v => setSettings(s => ({...s,faqs:v.split("\n").map(line => {const [question,...rest]=line.split("|");return {question:question.trim(),answer:rest.join("|").trim()};}).filter(x => x.question && x.answer)}))}/></div><Field label="Enquiry section heading" value={settings.enquiryTitle} onChange={v => setSettings(s => ({...s,enquiryTitle:v}))}/><Field label="Enquiry section description" value={settings.enquiryDescription} onChange={v => setSettings(s => ({...s,enquiryDescription:v}))}/></div>
            <div className="admin-form-actions"><span>Changes are saved to the website settings in MongoDB Atlas.</span><button className="button button-accent" disabled={saving}>{saving ? "Saving…" : "Save website content"} <span>↗</span></button></div>
          </form>
        </> : null}
      </div>
    </main>
    {productModal ? <div className="admin-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setProductModal(false); }}><section className="admin-product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title"><div className="admin-modal-heading"><div><span>CATALOGUE / PRODUCT ENTRY</span><h2 id="product-modal-title">{editingId ? "Edit product" : "Add a product"}</h2></div><button type="button" onClick={() => setProductModal(false)} aria-label="Close">×</button></div><form onSubmit={saveProduct}><div className="admin-form-grid"><Field label="Product name" value={draft.title} onChange={v => updateDraft("title",v)} required/><Field label="SKU / product code" value={draft.sku} onChange={v => updateDraft("sku",v)} required/><Field label="Category" value={draft.category} onChange={v => updateDraft("category",v)} required/><Field label="URL slug" value={draft.slug} onChange={v => updateDraft("slug",v)} hint="Leave blank to generate from product name."/><div className="admin-field admin-field-full"><Field label="Short summary" value={draft.summary} onChange={v => updateDraft("summary",v)} required/></div><div className="admin-field admin-field-full"><Field label="Full description" value={draft.description} onChange={v => updateDraft("description",v)} multiline/></div><Field label="Material / resin grade" value={draft.material} onChange={v => updateDraft("material",v)} hint="Only enter verified material details."/><Field label="Minimum order quantity" value={draft.moq} onChange={v => updateDraft("moq",v)}/><div className="admin-field admin-field-full"><label className="admin-field"><span>Available colours (comma separated)</span><input value={coloursText} onChange={e => setColoursText(e.target.value)}/></label></div><div className="admin-field admin-field-full"><Field label="Product images (one HTTPS URL or /products path per line)" value={imagesText} multiline onChange={setImagesText}/><label className="admin-upload-control">Upload image (Cloudinary)<input type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (file) void uploadProductImage(file); e.currentTarget.value = ""; }}/></label></div><div className="admin-field admin-field-full"><Field label="3D model GLB URL (optional HTTPS URL)" value={draft.modelUrl} onChange={v => updateDraft("modelUrl",v)} hint="Add a product-specific .glb model. A real CAD export is required for an accurate interactive 3D viewer."/><label className="admin-upload-control">Upload .glb model (Cloudinary)<input type="file" accept=".glb,model/gltf-binary" onChange={e => { const file = e.target.files?.[0]; if (file) void uploadModel(file); e.currentTarget.value = ""; }}/></label></div><Field label="Specifications (label: value; one per line)" value={specificationsText} multiline onChange={setSpecificationsText}/><label className="admin-field"><span>Publication status</span><select value={draft.status} onChange={e => updateDraft("status",e.target.value as Product["status"])}><option value="draft">Draft — not public</option><option value="published">Published — visible on website</option></select></label><label className="admin-checkbox"><input type="checkbox" checked={draft.featured} onChange={e => updateDraft("featured",e.target.checked)}/><span>Feature this product on the homepage</span></label></div>{error ? <p className="form-error">{error}</p> : null}<div className="admin-modal-actions"><button type="button" className="admin-outline-button" onClick={() => setProductModal(false)}>Cancel</button><button type="submit" className="button button-accent" disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes" : "Create product"}<span>↗</span></button></div></form></section></div> : null}
  </div>;
}
