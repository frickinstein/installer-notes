import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNotificationPreferences } from "@/actions/settings";
import { NOTIFICATION_TYPES } from "@/lib/notificationTypes";
import { NotificationSettings } from "@/components/NotificationSettings";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings — Installer Notes",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const preferences = await getNotificationPreferences();

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-text-bright mb-2">Settings</h1>
      <p className="text-sm text-text-muted mb-8">
        Manage your notification preferences and account settings.
      </p>

      {/* Profile link */}
      <div className="bg-surface border border-border rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-bright">Profile</h2>
            <p className="text-xs text-text-dim">Update your name and avatar</p>
          </div>
          <Link
            href="/profile/edit"
            className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Notification preferences */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-text-bright mb-1">Notifications</h2>
        <p className="text-xs text-text-dim mb-5">
          Choose how you want to be notified. Changes are saved automatically.
        </p>
        <NotificationSettings
          types={NOTIFICATION_TYPES.map((t) => ({ key: t.key, label: t.label, description: t.description }))}
          initial={preferences}
        />
      </div>
    </div>
  );
}
