import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmailNav } from "@/components/admin/campaign/EmailNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Management — Installer Notes",
};

export default async function EmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("installer_role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.installer_role !== "admin") {
    redirect("/admin");
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-2">
        <a
          href="/admin"
          className="text-sm text-text-muted hover:text-text transition-colors"
        >
          &larr; Admin
        </a>
        <h1 className="text-2xl font-black text-text-bright">
          Email Management
        </h1>
      </div>

      <EmailNav />

      <div className="mt-6">{children}</div>
    </div>
  );
}
