import { adminClient } from "@/lib/supabase/admin";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://installernotes.com";

// ─── Filter types ─────────────────────────────────────────────────────────────

/**
 * Legacy per-step audience filter (kept for backward compatibility with drip cron).
 */
export type AudienceFilter = {
  has_notes?: boolean;
  no_notes?: boolean;
  min_notes?: number;
  roles?: string[];
  has_tint_notes?: boolean;
  has_ppf_notes?: boolean;
} | null;

/**
 * Smart list filter — all dimensions available when building a smart list.
 * All fields are optional and AND-combined.
 */
export type SmartListFilter = {
  // Notes activity
  has_notes?: boolean;          // notes_count > 0
  no_notes?: boolean;           // notes_count = 0
  min_notes?: number;           // notes_count >= n
  // Reviews activity (installer_note_ratings.user_id = reviewer)
  has_reviews?: boolean;        // has left ≥1 review
  no_reviews?: boolean;         // has left 0 reviews
  min_reviews?: number;         // review count >= n
  // Profile
  roles?: string[];             // installer_role in [...]
  min_score?: number;           // contributor_score >= n
  // Join recency
  joined_within_days?: number;  // signed up within last N days (new users)
  joined_before_days?: number;  // signed up more than N days ago (established)
} | null;

export type EmailList = {
  id: string;
  type: "static" | "smart";
  slug: string;
  filter: SmartListFilter;
};

export type AudienceUser = {
  id: string;
  email: string;
  username: string;
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Fetch all auth user emails in bulk via paginated listUsers.
 * Returns a Map of userId → email.
 */
async function fetchAllUserEmails(): Promise<Map<string, string>> {
  const admin = adminClient();
  const emailMap = new Map<string, string>();
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) break;
    for (const u of data.users) {
      if (u.email) emailMap.set(u.id, u.email);
    }
    if (data.users.length < perPage) break;
    page++;
  }

  return emailMap;
}

/**
 * Fetch user IDs that have unsubscribed from a campaign (or globally).
 */
async function fetchUnsubscribedUserIds(campaign: string | null): Promise<Set<string>> {
  const admin = adminClient();
  let query = admin.from("email_unsubscribes").select("user_id");
  if (campaign) {
    query = query.or(`campaign.is.null,campaign.eq.${campaign}`);
  }
  const { data } = await query;
  return new Set((data ?? []).map((r) => r.user_id));
}

/**
 * Fetch IDs of users who have left at least one review.
 */
async function fetchReviewerIds(): Promise<Set<string>> {
  const admin = adminClient();
  const { data } = await admin
    .from("installer_note_ratings")
    .select("user_id");
  return new Set((data ?? []).map((r) => r.user_id));
}

/**
 * Count reviews per user_id. Returns Map<userId, count>.
 */
async function fetchReviewCounts(): Promise<Map<string, number>> {
  const admin = adminClient();
  const { data } = await admin
    .from("installer_note_ratings")
    .select("user_id");
  const counts = new Map<string, number>();
  for (const r of data ?? []) {
    counts.set(r.user_id, (counts.get(r.user_id) ?? 0) + 1);
  }
  return counts;
}

// ─── Smart list filter evaluation ────────────────────────────────────────────

/**
 * Determine if a profile row passes the smart list filter (notes/score/role/date parts only).
 * Reviews require a separate lookup — pass reviewCounts if needed.
 */
function passesFilter(
  profile: {
    id: string;
    notes_count: number | null;
    contributor_score: number | null;
    installer_role: string | null;
    created_at: string;
  },
  filter: SmartListFilter,
  reviewCounts?: Map<string, number>
): boolean {
  if (!filter) return true;

  const notes = profile.notes_count ?? 0;
  const score = profile.contributor_score ?? 0;
  const now = Date.now();
  const joinedMs = new Date(profile.created_at).getTime();
  const daysSinceJoin = Math.floor((now - joinedMs) / (1000 * 60 * 60 * 24));

  if (filter.has_notes && notes === 0) return false;
  if (filter.no_notes && notes > 0) return false;
  if (typeof filter.min_notes === "number" && notes < filter.min_notes) return false;

  if (filter.roles && filter.roles.length > 0) {
    if (!profile.installer_role || !filter.roles.includes(profile.installer_role)) return false;
  }

  if (typeof filter.min_score === "number" && score < filter.min_score) return false;

  if (typeof filter.joined_within_days === "number" && daysSinceJoin > filter.joined_within_days) return false;
  if (typeof filter.joined_before_days === "number" && daysSinceJoin < filter.joined_before_days) return false;

  if (reviewCounts !== undefined) {
    const reviews = reviewCounts.get(profile.id) ?? 0;
    if (filter.has_reviews && reviews === 0) return false;
    if (filter.no_reviews && reviews > 0) return false;
    if (typeof filter.min_reviews === "number" && reviews < filter.min_reviews) return false;
  }

  return true;
}

/**
 * Determine if the filter requires the review counts lookup.
 */
function needsReviewData(filter: SmartListFilter): boolean {
  if (!filter) return false;
  return !!(filter.has_reviews || filter.no_reviews || typeof filter.min_reviews === "number");
}

// ─── Public: list-based queries ───────────────────────────────────────────────

/**
 * Fetch all users in a list (static or smart), excluding unsubscribes.
 * For static lists: reads email_list_members.
 * For smart lists: evaluates the filter against profiles.
 */
export async function getListUsers(
  list: EmailList,
  campaignName?: string | null
): Promise<AudienceUser[]> {
  const admin = adminClient();

  if (list.type === "static") {
    const { data: members } = await admin
      .from("email_list_members")
      .select("user_id")
      .eq("list_id", list.id);

    const userIds = (members ?? []).map((m) => m.user_id);
    if (userIds.length === 0) return [];

    const [profilesResult, emailMap, unsubscribedIds] = await Promise.all([
      admin.from("profiles").select("id, full_name, username").in("id", userIds),
      fetchAllUserEmails(),
      fetchUnsubscribedUserIds(campaignName ?? null),
    ]);

    const result: AudienceUser[] = [];
    for (const p of profilesResult.data ?? []) {
      if (unsubscribedIds.has(p.id)) continue;
      const email = emailMap.get(p.id);
      if (email) result.push({ id: p.id, email, username: p.full_name || p.username || "" });
    }
    return result;
  }

  // Smart list — evaluate filter
  const filter = list.filter;
  const withReviews = needsReviewData(filter);

  let query = admin
    .from("profiles")
    .select("id, full_name, username, notes_count, contributor_score, installer_role, created_at")
    .not("full_name", "is", null);

  if (filter?.roles && filter.roles.length > 0) {
    query = query.in("installer_role", filter.roles);
  }

  const [profilesResult, emailMap, unsubscribedIds, reviewCounts] = await Promise.all([
    query,
    fetchAllUserEmails(),
    fetchUnsubscribedUserIds(campaignName ?? null),
    withReviews ? fetchReviewCounts() : Promise.resolve(undefined),
  ]);

  const result: AudienceUser[] = [];
  for (const p of profilesResult.data ?? []) {
    if (!passesFilter(p, filter, reviewCounts)) continue;
    if (unsubscribedIds.has(p.id)) continue;
    const email = emailMap.get(p.id);
    if (email) result.push({ id: p.id, email, username: p.full_name || p.username || "" });
  }
  return result;
}

/**
 * Count users in a list (approximate — does not exclude unsubscribes for speed).
 * For static lists: counts rows in email_list_members.
 * For smart lists: evaluates the filter against profiles.
 */
export async function countListUsers(list: EmailList): Promise<number> {
  const admin = adminClient();

  if (list.type === "static") {
    const { count } = await admin
      .from("email_list_members")
      .select("id", { count: "exact", head: true })
      .eq("list_id", list.id);
    return count ?? 0;
  }

  // Smart list
  const filter = list.filter;
  const withReviews = needsReviewData(filter);

  let query = admin
    .from("profiles")
    .select("id, notes_count, contributor_score, installer_role, created_at")
    .not("full_name", "is", null);

  if (filter?.roles && filter.roles.length > 0) {
    query = query.in("installer_role", filter.roles);
  }

  const [profilesResult, reviewCounts] = await Promise.all([
    query,
    withReviews ? fetchReviewCounts() : Promise.resolve(undefined),
  ]);

  return (profilesResult.data ?? []).filter((p) => passesFilter(p, filter, reviewCounts)).length;
}

/**
 * Get profile IDs matching a SmartListFilter (used for populating static lists).
 */
export async function getFilteredUserIds(filter: SmartListFilter): Promise<string[]> {
  const admin = adminClient();
  const withReviews = needsReviewData(filter);

  let query = admin
    .from("profiles")
    .select("id, notes_count, contributor_score, installer_role, created_at")
    .not("full_name", "is", null);

  if (filter?.roles && filter.roles.length > 0) {
    query = query.in("installer_role", filter.roles);
  }

  const [profilesResult, reviewCounts] = await Promise.all([
    query,
    withReviews ? fetchReviewCounts() : Promise.resolve(undefined),
  ]);

  return (profilesResult.data ?? [])
    .filter((p) => passesFilter(p, filter, reviewCounts))
    .map((p) => p.id);
}

// ─── Public: legacy audience-based queries (used by drip cron) ───────────────

/**
 * Apply legacy AudienceFilter to a profile result set.
 */
function applyAudienceFilters<T extends { id: string; notes_count: number | null }>(
  profiles: T[],
  audience: AudienceFilter,
  tintUserIds?: Set<string>,
  ppfUserIds?: Set<string>
): T[] {
  let filtered = profiles;
  if (audience?.has_notes) filtered = filtered.filter((p) => (p.notes_count ?? 0) > 0);
  if (audience?.no_notes) filtered = filtered.filter((p) => (p.notes_count ?? 0) === 0);
  if (typeof audience?.min_notes === "number") {
    filtered = filtered.filter((p) => (p.notes_count ?? 0) >= audience.min_notes!);
  }
  if (tintUserIds) filtered = filtered.filter((p) => tintUserIds.has(p.id));
  if (ppfUserIds)  filtered = filtered.filter((p) => ppfUserIds.has(p.id));
  return filtered;
}

export async function getAudienceUsers(
  audience: AudienceFilter,
  campaign?: string | null
): Promise<AudienceUser[]> {
  const admin = adminClient();

  let query = admin
    .from("profiles")
    .select("id, full_name, username, notes_count, installer_role")
    .not("full_name", "is", null);

  if (audience?.roles && audience.roles.length > 0) {
    query = query.in("installer_role", audience.roles);
  }

  // Pre-fetch note-type user sets if needed
  const [{ data: profiles }, tintUserIds, ppfUserIds] = await Promise.all([
    query,
    audience?.has_tint_notes
      ? admin.from("installer_notes").select("user_id").eq("note_type", "tint").eq("status", "approved")
          .then(({ data }) => new Set((data ?? []).map((n) => n.user_id)))
      : Promise.resolve(undefined),
    audience?.has_ppf_notes
      ? admin.from("installer_notes").select("user_id").eq("note_type", "ppf").eq("status", "approved")
          .then(({ data }) => new Set((data ?? []).map((n) => n.user_id)))
      : Promise.resolve(undefined),
  ]);

  if (!profiles || profiles.length === 0) return [];

  const filtered = applyAudienceFilters(profiles, audience, tintUserIds, ppfUserIds);
  if (filtered.length === 0) return [];

  const [emailMap, unsubscribedIds] = await Promise.all([
    fetchAllUserEmails(),
    fetchUnsubscribedUserIds(campaign ?? null),
  ]);

  const result: AudienceUser[] = [];
  for (const p of filtered) {
    if (unsubscribedIds.has(p.id)) continue;
    const email = emailMap.get(p.id);
    if (email) result.push({ id: p.id, email, username: p.full_name || p.username || "" });
  }
  return result;
}

export async function countAudienceUsers(audience: AudienceFilter): Promise<number> {
  const admin = adminClient();

  let query = admin
    .from("profiles")
    .select("id, notes_count, installer_role")
    .not("full_name", "is", null);

  if (audience?.roles && audience.roles.length > 0) {
    query = query.in("installer_role", audience.roles);
  }

  const [{ data: profiles }, tintUserIds, ppfUserIds] = await Promise.all([
    query,
    audience?.has_tint_notes
      ? admin.from("installer_notes").select("user_id").eq("note_type", "tint").eq("status", "approved")
          .then(({ data }) => new Set((data ?? []).map((n) => n.user_id)))
      : Promise.resolve(undefined),
    audience?.has_ppf_notes
      ? admin.from("installer_notes").select("user_id").eq("note_type", "ppf").eq("status", "approved")
          .then(({ data }) => new Set((data ?? []).map((n) => n.user_id)))
      : Promise.resolve(undefined),
  ]);

  if (!profiles) return 0;
  return applyAudienceFilters(profiles, audience, tintUserIds, ppfUserIds).length;
}

// ─── Template variables ───────────────────────────────────────────────────────

export function replaceTemplateVars(html: string, user: { username?: string }): string {
  const name = user.username || "";
  return html
    .replace(/\{\{username_greeting\}\}/g, name ? `, ${name}` : "")
    .replace(/\{\{username\}\}/g, name)
    .replace(/\{\{site_url\}\}/g, SITE_URL);
}
