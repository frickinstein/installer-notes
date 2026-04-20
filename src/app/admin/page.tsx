import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminStats, getFlaggedNotes, getReportedReviews, getPendingAudits, getAdminLog } from "@/actions/admin";
import { AdminDashboard } from "@/components/AdminDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Installer Notes",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("installer_role")
    .eq("id", user.id)
    .single();

  if (!profile || !["mod", "admin"].includes(profile.installer_role)) {
    redirect("/");
  }

  const [stats, flaggedNotes, reportedReviews, pendingAudits, adminLog] = await Promise.all([
    getAdminStats(),
    getFlaggedNotes(),
    getReportedReviews(),
    getPendingAudits(),
    getAdminLog(),
  ]);

  return (
    <AdminDashboard
      role={profile.installer_role}
      stats={stats}
      flaggedNotes={flaggedNotes}
      reportedReviews={reportedReviews}
      pendingAudits={pendingAudits}
      adminLog={adminLog}
    />
  );
}
