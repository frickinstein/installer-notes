"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  updateEmailList,
  deleteEmailList,
  getListMembers,
  removeListMember,
  populateListFromFilter,
  getListCountBySlug,
} from "@/actions/admin";
import { SmartListFilterEditor } from "./SmartListFilterEditor";
import type { SmartListFilter } from "@/actions/admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

const SOURCE_BADGE: Record<string, string> = {
  manual: "bg-text-dim/10 text-text-dim",
  auto: "bg-blue-500/10 text-blue-400",
  trigger: "bg-purple-500/10 text-purple-400",
};

export function ListDetailClient({ list: initialList }: { list: any }) {
  const router = useRouter();
  const [list, setList] = useState(initialList);
  const [filter, setFilter] = useState<SmartListFilter>(initialList.filter ?? null);
  const [members, setMembers] = useState<any[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialList.name);
  const [description, setDescription] = useState(initialList.description ?? "");
  const [saving, setSaving] = useState(false);
  const [populating, setPopulating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  function showMsg(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  const loadMembers = useCallback(async () => {
    if (list.type !== "static") return;
    const data = await getListMembers(list.id);
    setMembers(data);
  }, [list.id, list.type]);

  const loadCount = useCallback(async () => {
    const n = await getListCountBySlug(list.slug);
    setCount(n);
  }, [list.slug]);

  useEffect(() => {
    loadCount();
    if (list.type === "static") loadMembers();
  }, [loadCount, loadMembers, list.type]);

  async function save() {
    setSaving(true);
    const result = await updateEmailList(list.id, {
      name,
      description: description || undefined,
      ...(list.type === "smart" ? { filter } : {}),
    });
    setSaving(false);
    if ("error" in result && result.error) {
      showMsg("error", result.error);
    } else {
      setList({ ...list, name, description, filter });
      setEditing(false);
      showMsg("success", "List saved.");
      loadCount();
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${list.name}"? This cannot be undone.`)) return;
    const result = await deleteEmailList(list.id);
    if ("error" in result && result.error) {
      showMsg("error", result.error);
    } else {
      router.push("/admin/email/lists");
    }
  }

  async function handleRemoveMember(memberId: string) {
    const result = await removeListMember(list.id, memberId);
    if ("error" in result && result.error) {
      showMsg("error", result.error);
    } else {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setCount((c) => (c !== null ? c - 1 : null));
    }
  }

  async function handlePopulate() {
    if (!confirm("This will add all users matching the current filter to this list as members. Existing members are kept. Continue?")) return;
    setPopulating(true);
    const result = await populateListFromFilter(list.id);
    setPopulating(false);
    if ("error" in result && result.error) {
      showMsg("error", result.error);
    } else if ("added" in result) {
      showMsg("success", `Added up to ${result.added} members from filter.`);
      loadMembers();
      loadCount();
    }
  }

  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    const name = (m.profile?.full_name || m.profile?.username || "").toLowerCase();
    return name.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => router.push("/admin/email/lists")}
          className="text-text-muted hover:text-text transition-colors"
        >
          Lists
        </button>
        <span className="text-text-dim">/</span>
        <span className="text-text-bright font-medium">{list.name}</span>
      </div>

      {message && (
        <p className={`text-sm ${message.type === "error" ? "text-red-400" : "text-green-400"}`}>
          {message.text}
        </p>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-text-bright">{list.name}</h2>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${
              list.type === "smart"
                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                : "bg-text-dim/10 text-text-dim border-border"
            }`}>
              {list.type}
            </span>
          </div>
          {list.description && (
            <p className="text-sm text-text-muted">{list.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-muted hover:text-text hover:border-primary/30 transition-colors"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-text-bright">{count ?? "—"}</p>
          <p className="text-[10px] text-text-dim uppercase tracking-wider mt-0.5">
            {list.type === "static" ? "Members" : "Matching Users"}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-text-bright capitalize">{list.type}</p>
          <p className="text-[10px] text-text-dim uppercase tracking-wider mt-0.5">Type</p>
        </div>
      </div>

      {/* Edit panel */}
      {editing && (
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-text-dim">Edit List</p>
          <div>
            <label className="text-xs text-text-dim">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 bg-surface-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:border-primary/40 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-text-dim">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 bg-surface-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:border-primary/40 focus:outline-none transition-colors"
              placeholder="What is this list for?"
            />
          </div>

          {list.type === "smart" && (
            <div className="border border-border rounded-xl p-4">
              <SmartListFilterEditor filter={filter} onChange={setFilter} />
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Smart list actions */}
      {list.type === "smart" && !editing && (
        <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-text-dim">Smart Actions</p>
          <p className="text-sm text-text-muted">
            This list evaluates its filters at send time. You can also snapshot the current matching users into the member list.
          </p>
          <button
            onClick={handlePopulate}
            disabled={populating}
            className="px-4 py-2 bg-surface-hover border border-border rounded-lg text-sm text-text-muted hover:text-text hover:border-primary/30 disabled:opacity-50 transition-colors"
          >
            {populating ? "Populating..." : "Snapshot to member list"}
          </button>
        </div>
      )}

      {/* Member list (static) */}
      {list.type === "static" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-text-dim">Members</p>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members..."
              className="bg-surface-hover border border-border rounded-lg px-3 py-1.5 text-sm text-text w-52 focus:border-primary/40 focus:outline-none transition-colors"
            />
          </div>

          {filteredMembers.length === 0 ? (
            <div className="text-center py-10 bg-surface border border-border rounded-xl">
              <p className="text-text-muted text-sm">
                {members.length === 0 ? "No members yet." : "No members match your search."}
              </p>
              {members.length === 0 && (
                <p className="text-text-dim text-xs mt-1">
                  Add members manually or import from a smart list snapshot.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredMembers.map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg hover:border-border/80 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-bright font-medium truncate">
                      {m.profile?.full_name || m.profile?.username || "Unknown"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-text-dim capitalize">{m.profile?.installer_role ?? "user"}</p>
                      <span className="text-text-dim">·</span>
                      <p className="text-xs text-text-dim">{m.profile?.notes_count ?? 0} notes</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${SOURCE_BADGE[m.source] ?? SOURCE_BADGE.manual}`}>
                    {m.source}
                  </span>
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    className="text-text-dim hover:text-red-400 transition-colors p-1"
                    title="Remove from list"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
