import { redirect } from "next/navigation";
import Link from "next/link";
import LoginForm from "@/components/LoginForm";
import { getServerAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getServerAdmin()) redirect("/admin");
  return <main className="admin-login-shell"><div className="admin-login-aside"><Link href="/" className="brand-lockup brand-lockup-light"><span className="brand-mark"><span /><span /><span /></span><span className="brand-copy"><strong>Sky Plastic</strong><small>PLASTIC MANUFACTURING</small></span></Link><div><span className="login-kicker">SKY PLASTIC / CONTROL ROOM</span><h1>Manage the<br />business behind<br /><em>the product.</em></h1><p>One place to update the catalogue, review buyer enquiries and maintain your website content.</p></div><span className="login-foot">BIWANDI · MAHARASHTRA · INDIA</span></div><section className="admin-login-card"><div className="eyebrow"><span className="eyebrow-line" /> ADMINISTRATOR ACCESS</div><h2>Welcome back.</h2><p>Sign in to manage the Sky Plastic website.</p><LoginForm /><Link href="/" className="login-back-link">← Back to public website</Link></section></main>;
}
