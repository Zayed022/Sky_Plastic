"use client";

import { useState } from "react";

type Props = { productName?: string; compact?: boolean };
export default function EnquiryForm({ productName = "", compact = false }: Props) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your enquiry could not be submitted.");
      setSent(true);
      formElement.reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally { setBusy(false); }
  }

  if (sent) return <div className="form-success"><span className="success-mark">✓</span><h3>Enquiry received.</h3><p>Thank you for contacting Sky Plastic. Your message has been recorded and our team will review it.</p><button className="text-button" onClick={() => setSent(false)} type="button">Send another enquiry ↗</button></div>;

  return (
    <form className={`enquiry-form ${compact ? "enquiry-form-compact" : ""}`} onSubmit={submit}>
      <div className="form-grid">
        <label>Your name<input name="name" autoComplete="name" placeholder="Full name" required minLength={2} maxLength={90} /></label>
        <label>Company<input name="company" autoComplete="organization" placeholder="Company / business name" maxLength={120} /></label>
        <label>Business email<input name="email" type="email" autoComplete="email" placeholder="name@company.com" required maxLength={160} /></label>
        <label>Country<input name="country" autoComplete="country-name" placeholder="India / United Arab Emirates..." maxLength={80} /></label>
        <label>Phone / WhatsApp<input name="phone" autoComplete="tel" placeholder="Include country code" maxLength={40} /></label>
        <label>Product of interest<input name="product" defaultValue={productName} placeholder="Product name or SKU" maxLength={140} /></label>
        <label className="form-span">Estimated quantity<input name="quantity" placeholder="e.g. 10,000 pieces / month" maxLength={80} /></label>
        <label className="form-span">Tell us what you need<textarea name="message" rows={4} placeholder="Product details, colour, specifications, destination, or any questions..." required minLength={10} maxLength={2000} /></label>
      </div>
      <label className="honeypot" aria-hidden="true">Leave this field empty<input tabIndex={-1} name="website" autoComplete="off" /></label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="form-submit-row"><p>We only use your details to respond to this business enquiry.</p><button className="button button-accent" disabled={busy} type="submit">{busy ? "Sending…" : "Send enquiry"}<span aria-hidden="true">↗</span></button></div>
    </form>
  );
}
