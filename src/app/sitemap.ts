import type { MetadataRoute } from "next";
import { adminClient } from "@/lib/supabase/admin";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://installernotes.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = adminClient();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/feed`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/leaderboard`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/community`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Vehicle pages — only include vehicles that have approved notes
  const { data: notedVehicles } = await supabase
    .from("installer_notes")
    .select("group_id")
    .eq("status", "approved");

  const seenGroups = new Set<string>();
  const vehiclePages: MetadataRoute.Sitemap = [];
  for (const n of notedVehicles ?? []) {
    if (!seenGroups.has(n.group_id)) {
      seenGroups.add(n.group_id);
      vehiclePages.push({
        url: `${SITE_URL}/vehicle/${n.group_id}`,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  // Profile pages for contributors
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .gt("notes_count", 0)
    .order("contributor_score", { ascending: false })
    .limit(500);

  const profilePages: MetadataRoute.Sitemap = (profiles ?? []).map((p) => ({
    url: `${SITE_URL}/profile/${p.id}`,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...vehiclePages, ...profilePages];
}
