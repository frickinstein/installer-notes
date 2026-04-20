/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { NoteCardClient } from "./NoteCardClient";
import { NotePhotos } from "./NotePhotos";

const TINT_PANELS = [
  { key: "rollups",       label: "Rollups" },
  { key: "back_glass",    label: "Back Glass" },
  { key: "windshield",    label: "Windshield" },
  { key: "sunroof",       label: "Sunroof" },
  { key: "quarter_glass", label: "Quarter Glass" },
] as const;

const PPF_PANELS = [
  { key: "hood",           label: "Hood" },
  { key: "front_bumper",   label: "Front Bumper" },
  { key: "fender",         label: "Fender" },
  { key: "roof",           label: "Roof" },
  { key: "doors",          label: "Doors" },
  { key: "quarter_panels", label: "Quarter Panels / Bedside" },
  { key: "trunk_lid",      label: "Trunk Lid / Tailgate" },
  { key: "rear_bumper",    label: "Rear Bumper" },
] as const;

function getFacebookVideoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const isFacebook =
      u.hostname === "www.facebook.com" ||
      u.hostname === "facebook.com" ||
      u.hostname === "fb.watch" ||
      u.hostname === "www.fb.watch";
    if (!isFacebook) return null;
    if (u.pathname.includes("/videos/") || u.hostname.includes("fb.watch")) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&width=560&show_text=false`;
    }
    return null;
  } catch {
    return null;
  }
}

function getYoutubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
    const v = u.searchParams.get("v");
    if (v) return `https://www.youtube.com/embed/${v}`;
    return null;
  } catch {
    return null;
  }
}

export function NoteCard({ note, currentUserId, supabaseUrl }: { note: any; currentUserId: string | null; supabaseUrl: string }) {
  const noteType   = (note.note_type as "tint" | "ppf") ?? "tint";
  const isPpf      = noteType === "ppf";
  const difficulty = isPpf
    ? note.installer_note_ppf_difficulty?.[0]
    : note.installer_note_difficulty?.[0];
  const panels     = isPpf ? PPF_PANELS : TINT_PANELS;

  const ratings  = note.installer_note_ratings ?? [];
  const media    = note.installer_note_media ?? [];
  const profile  = Array.isArray(note.profiles) ? note.profiles[0] : note.profiles;
  const displayName = profile?.full_name ?? "Anonymous";
  const embedUrl    = note.youtube_url ? getYoutubeEmbedUrl(note.youtube_url) : null;
  const fbEmbedUrl  = note.facebook_url ? getFacebookVideoEmbedUrl(note.facebook_url) : null;
  const fbLinkOnly  = note.facebook_url && !fbEmbedUrl;
  const isOwnNote   = currentUserId === note.user_id;
  const hasRated    = currentUserId
    ? ratings.some((r: any) => r.user_id === currentUserId)
    : false;

  const avgStars = ratings.length > 0
    ? ratings.reduce((sum: number, r: any) => sum + r.stars, 0) / ratings.length
    : 0;

  const photoUrls = media.map((m: any) =>
    `${supabaseUrl}/storage/v1/object/public/installer-note-media/${m.storage_path}`
  );

  const editHref = `/submit/${note.group_id}?type=${noteType}`;

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      {/* Header: avatar + name + badges */}
      <div className="flex items-center justify-between mb-1">
        <Link href={`/profile/${note.user_id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
              {displayName[0]?.toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium text-text-bright">{displayName}</span>
        </Link>
        <div className="flex items-center gap-2">
          {/* Note type badge */}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
            isPpf
              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
              : "bg-primary/10 text-primary border-primary/20"
          }`}>
            {isPpf ? "PPF" : "Window Tint"}
          </span>
          {isOwnNote && (
            <Link
              href={editHref}
              className="text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-lg px-2.5 py-1 hover:bg-primary/20 transition-colors"
            >
              Edit
            </Link>
          )}
          {difficulty?.overall != null && (
            <span className="text-xs bg-bg border border-border rounded-full px-2 py-0.5 text-text-dim">
              Difficulty: {difficulty.overall}
            </span>
          )}
        </div>
      </div>

      {/* Trim package — prominent warning badge */}
      {note.trim_package && (
        <div className="mt-2 mb-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold rounded-full">
            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            Trim: {note.trim_package}
          </span>
        </div>
      )}

      {/* Interactive star rating */}
      <NoteCardClient
        noteId={note.id}
        initialAvg={avgStars}
        initialCount={ratings.length}
        initialRatings={ratings}
        currentUserId={currentUserId}
        isOwnNote={isOwnNote}
        hasRated={hasRated}
      />

      {/* General tips */}
      <p className="text-text whitespace-pre-wrap mb-4 mt-3">{note.general_tips}</p>

      {/* Tools needed */}
      {note.tools_needed && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-text-dim uppercase tracking-wide mb-1">
            Tools Needed
          </h4>
          <p className="text-sm text-text-muted whitespace-pre-wrap">{note.tools_needed}</p>
        </div>
      )}

      {/* Common problems */}
      {note.common_problems && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-text-dim uppercase tracking-wide mb-1">
            Common Problems
          </h4>
          <p className="text-sm text-text-muted whitespace-pre-wrap">{note.common_problems}</p>
        </div>
      )}

      {/* Per-panel difficulty */}
      {difficulty && (
        <div className="flex flex-wrap gap-2 mb-3">
          {panels.map((panel) => {
            const val = difficulty[panel.key];
            if (val == null) return null;
            return (
              <span
                key={panel.key}
                className="text-xs bg-bg border border-border rounded-md px-2 py-1 text-text-dim"
              >
                {panel.label}: {val}/5
              </span>
            );
          })}
        </div>
      )}

      {/* Photos */}
      {photoUrls.length > 0 && <NotePhotos urls={photoUrls} />}

      {/* YouTube embed */}
      {embedUrl && (
        <div className="mt-4 rounded-lg overflow-hidden aspect-video">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      )}

      {/* Facebook video embed */}
      {fbEmbedUrl && (
        <div className="mt-4 rounded-lg overflow-hidden" style={{ height: 315 }}>
          <iframe
            src={fbEmbedUrl}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          />
        </div>
      )}

      {/* Facebook link (non-video posts) */}
      {fbLinkOnly && (
        <div className="mt-4">
          <a
            href={note.facebook_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#1877F2] hover:underline"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
            </svg>
            View on Facebook
          </a>
        </div>
      )}
    </div>
  );
}
