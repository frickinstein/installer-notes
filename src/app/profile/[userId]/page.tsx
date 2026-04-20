import { notFound } from "next/navigation";
import { getProfile, getProfileNotes } from "@/actions/profiles";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  const profile = await getProfile(userId);

  if (!profile) {
    return { title: "Profile Not Found" };
  }

  const name = profile.full_name ?? "Anonymous";
  const title = `${name} — Installer Notes Contributor`;
  const description = `${name} has shared ${profile.notes_count} install note${profile.notes_count !== 1 ? "s" : ""} on Installer Notes with a contributor score of ${profile.contributor_score.toFixed(1)}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const [profile, notes] = await Promise.all([
    getProfile(userId),
    getProfileNotes(userId),
  ]);

  if (!profile) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwnProfile = user?.id === userId;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Profile header */}
      <div className="flex items-start gap-4 mb-8">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold flex-shrink-0">
            {(profile.full_name ?? "?")[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-text-bright truncate">
              {profile.full_name ?? "Anonymous"}
            </h1>
            {isOwnProfile && (
              <Link
                href="/profile/edit"
                className="text-xs text-primary hover:underline flex-shrink-0"
              >
                Edit Profile
              </Link>
            )}
          </div>
          <p className="text-text-dim text-xs mt-1">
            Joined {new Date(profile.created_at).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-text-bright">{profile.notes_count}</p>
          <p className="text-xs text-text-dim">Notes</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-yellow-400">
            {profile.avg_rating > 0 ? profile.avg_rating.toFixed(1) : "—"}
          </p>
          <p className="text-xs text-text-dim">Avg Rating</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-primary">{profile.contributor_score.toFixed(1)}</p>
          <p className="text-xs text-text-dim">Score</p>
        </div>
      </div>

      {/* Notes list */}
      <h2 className="text-lg font-semibold text-text-bright mb-4">
        Notes ({notes.length})
      </h2>
      {notes.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-6 text-center">
          <p className="text-text-muted text-sm">No approved notes yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note: any) => {
            const avgStars =
              note.installer_note_ratings?.length > 0
                ? (
                    note.installer_note_ratings.reduce((s: number, r: any) => s + r.stars, 0) /
                    note.installer_note_ratings.length
                  ).toFixed(1)
                : null;
            const overall = note.installer_note_difficulty?.[0]?.overall;

            return (
              <Link
                key={note.id}
                href={`/vehicle/${note.group_id}`}
                className="block bg-surface border border-border rounded-xl p-4 hover:bg-surface-hover transition-colors"
              >
                {note.vehicleLabel && (
                  <p className="text-xs font-semibold text-primary mb-1">{note.vehicleLabel}</p>
                )}
                <p className="text-sm text-text-bright line-clamp-2 mb-2">
                  {note.general_tips}
                </p>
                <div className="flex items-center gap-3 text-xs text-text-dim">
                  {avgStars && (
                    <span className="text-yellow-400">{avgStars} ★</span>
                  )}
                  {overall != null && (
                    <span>Difficulty: {overall}</span>
                  )}
                  <span>
                    {new Date(note.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
