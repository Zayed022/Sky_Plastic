import { redirect } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";
import { getServerAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getServerAdmin();
  if (!admin) redirect("/admin/login");
  return <AdminDashboard email={admin.email} />;
}
