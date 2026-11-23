import Link from "next/link";
import type { SiteSettings } from "@/lib/types";

export default function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="site-footer" id="contact">
      <div className="container footer-main">
        <div className="footer-brand">
          <Link className="brand-lockup brand-lockup-light" href="/">
            <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
            <span className="brand-copy"><strong>{settings.brandName || "Sky Plastic"}</strong><small>PLASTIC MANUFACTURING</small></span>
          </Link>
          <p>{settings.footerNote}</p>
        </div>
        <div className="footer-col"><span className="footer-label">EXPLORE</span><ul><li><Link href="/#products">Product catalogue</Link></li><li><Link href="/#about">Our story</Link></li><li><Link href="/#capabilities">Why work with us</Link></li></ul></div>
        <div className="footer-col"><span className="footer-label">GET IN TOUCH</span><ul><li><p>{settings.address || "Bhiwandi, Maharashtra, India"}</p></li>{settings.email ? <li><a href={`mailto:${settings.email}`}>{settings.email}</a></li> : null}{settings.phone ? <li><a href={`tel:${settings.phone}`}>{settings.phone}</a></li> : null}{settings.whatsapp ? <li><a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp us ↗</a></li> : null}</ul></div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} {settings.brandName || "Sky Plastic"}. All rights reserved.</span><span>Manufactured in Bhiwandi, Maharashtra, India</span><Link href="/admin/login">Admin</Link></div>
    </footer>
  );
}
