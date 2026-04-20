import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNotifications, markNotificationsRead } from "@/actions/notifications";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications — Installer Notes",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const notifications = await getNotifications();

  // Mark all as read on visit
  await markNotificationsRead();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-text-bright mb-8">Notifications</h1>

      {notifications.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-6 text-center">
          <p className="text-text-muted">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`bg-surface border rounded-lg p-4 ${
                n.read ? "border-border" : "border-primary/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-text">{n.message}</p>
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                )}
              </div>
              <p className="text-xs text-text-dim mt-1">
                {new Date(n.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
