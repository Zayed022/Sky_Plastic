"use client";

import Link from "next/link";
import { useState } from "react";
import type { SiteSettings } from "@/lib/types";

export default function SiteHeader({ settings }: { settings: SiteSettings }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand-lockup" href="/" aria-label="Sky Plastic home" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span className="brand-copy"><strong>{settings.brandName || "Sky Plastic"}</strong><small>PLASTIC MANUFACTURING</small></span>
        </Link>
        <button className="mobile-menu-button" type="button" aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span />
        </button>
        <nav className={`main-nav ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation">
          <Link href="/#products" onClick={() => setMenuOpen(false)}>Products</Link>
          <Link href="/#about" onClick={() => setMenuOpen(false)}>About us</Link>
          <Link href="/#capabilities" onClick={() => setMenuOpen(false)}>Why Sky Plastic</Link>
          <Link href="/#enquiry" onClick={() => setMenuOpen(false)}>Contact</Link>
          <Link className="button button-dark nav-cta" href="/#enquiry" onClick={() => setMenuOpen(false)}>Request a quote <span aria-hidden="true">↗</span></Link>
        </nav>
      </div>
    </header>
  );
}
