import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/actions/profiles";
import { ProfileEditForm } from "@/components/ProfileEditForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Profile — Installer Notes",
};

export default async function EditProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(user.id);

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-text-bright mb-8">Edit Profile</h1>
      <div className="bg-surface border border-border rounded-xl p-6">
        <ProfileEditForm
          currentFullName={profile?.full_name ?? null}
          currentAvatarUrl={profile?.avatar_url ?? null}
        />
      </div>
    </div>
  );
}
