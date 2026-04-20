"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { searchVehicleCatalogGrouped } from "@/actions/vehicles";
import { trackEvent } from "@/lib/analytics";

type VehicleResult = {
  group_id: string;
  make: string;
  model: string;
  body_type_alt: string;
  body_type: string;
  minYear: number;
  maxYear: number;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
type RecentNote = {
  id: string;
  group_id: string;
  user_id: string;
  general_tips: string;
  created_at: string;
  vehicleLabel: string | null;
  installer_note_difficulty: any[];
  installer_note_ratings: any[];
  profiles: { id: string; full_name: string | null; avatar_url: string | null }[] | { id: string; full_name: string | null; avatar_url: string | null } | null;
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function VehicleSearch({ recentNotes }: { recentNotes?: RecentNote[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VehicleResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      trackEvent("search_performed", { search_term: query });
      const data = await searchVehicleCatalogGrouped(query);
      setResults(data as VehicleResult[]);
      setSearching(false);
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Type a vehicle... e.g. "2024 Civic" or "Tesla Model 3"'
          autoFocus
          className="w-full bg-surface border border-border rounded-xl px-5 py-4 text-lg text-text-bright placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
        />
        {searching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-text-dim border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="mt-3 bg-surface border border-border rounded-xl overflow-hidden">
          {/* Desktop table */}
          <table className="w-full hidden sm:table">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-dim uppercase tracking-wide">Years</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-dim uppercase tracking-wide">Make</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-dim uppercase tracking-wide">Model</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-dim uppercase tracking-wide">Body Style</th>
              </tr>
            </thead>
            <tbody>
              {results.map((v) => {
                const yearRange = v.minYear === v.maxYear ? `${v.minYear}` : `${v.minYear}–${v.maxYear}`;
                return (
                  <tr
                    key={v.group_id}
                    onClick={() => router.push(`/vehicle/${v.group_id}`)}
                    className="border-b border-border last:border-0 hover:bg-surface-hover cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-text-muted tabular-nums">{yearRange}</td>
                    <td className="px-4 py-3 text-sm text-text-bright font-medium">{v.make}</td>
                    <td className="px-4 py-3 text-sm text-text-bright font-medium">{v.model}</td>
                    <td className="px-4 py-3 text-sm text-text-muted">{v.body_type_alt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mobile list */}
          <div className="sm:hidden divide-y divide-border">
            {results.map((v) => {
              const yearRange = v.minYear === v.maxYear ? `${v.minYear}` : `${v.minYear}–${v.maxYear}`;
              return (
                <button
                  key={v.group_id}
                  onClick={() => router.push(`/vehicle/${v.group_id}`)}
                  className="flex items-center justify-between w-full px-4 py-3 hover:bg-surface-hover transition-colors text-left"
                >
                  <span className="text-sm text-text-bright font-medium">
                    {yearRange} {v.make} {v.model}
                  </span>
                  <span className="text-xs text-text-dim ml-3 flex-shrink-0">
                    {v.body_type_alt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {query.length >= 2 && !searching && results.length === 0 && (
        <p className="mt-4 text-center text-text-dim text-sm">
          No vehicles found for &ldquo;{query}&rdquo;
        </p>
      )}

      {/* Mini-feed — visible when not searching */}
      {query.length < 2 && recentNotes && recentNotes.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
              Recent Activity
            </h2>
            <Link href="/feed" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {recentNotes.map((note) => {
              const profile = Array.isArray(note.profiles) ? note.profiles[0] : note.profiles;
              return (
                <div
                  key={note.id}
                  className="bg-surface border border-border rounded-lg p-3 hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <Link href={`/profile/${profile?.id ?? note.user_id}`} className="flex items-center gap-2 hover:opacity-80">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                          {(profile?.full_name ?? "?")[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-bold text-text-bright">
                        {profile?.full_name ?? "Anonymous"}
                      </span>
                    </Link>
                    <span className="text-[10px] text-text-dim">
                      {timeAgo(note.created_at)}
                    </span>
                  </div>
                  <Link href={`/vehicle/${note.group_id}`}>
                    {note.vehicleLabel && (
                      <p className="text-xs font-bold text-primary mb-0.5">{note.vehicleLabel}</p>
                    )}
                    <p className="text-sm text-text-muted line-clamp-1">
                      {note.general_tips}
                    </p>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
