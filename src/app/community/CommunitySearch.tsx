"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CommunitySearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/community?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/community");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name..."
        className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-bright placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <button
        type="submit"
        className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
      >
        Search
      </button>
    </form>
  );
}
