"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { listUsers, updateUserRole, suspendUser, unsuspendUser, sendPasswordResetLink, deleteUserAccount, type UserSortField, type UserSortDir } from "@/actions/admin";
import Link from "next/link";

/* eslint-disable @typescript-eslint/no-explicit-any */

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

export function UserManagementPanel({ callerRole }: { callerRole: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [sortField, setSortField] = useState<UserSortField>("full_name");
  const [sortDir, setSortDir] = useState<UserSortDir>("asc");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ type: "role" | "suspend" | "unsuspend" | "reset_password" | "delete"; user: any } | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function showActionMessage(type: "success" | "error", text: string) {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 5000);
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const result = await listUsers({ page, perPage, sortField, sortDir, search: search || undefined });
    setUsers(result.users);
    setTotal(result.total);
    setLoading(false);
  }, [page, perPage, sortField, sortDir, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function handleSort(field: UserSortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "full_name" ? "asc" : "desc");
    }
    setPage(1);
  }

  function handleSearch() {
    setSearch(searchInput);
    setPage(1);
  }

  function handleClearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  function updateUser(userId: string, updates: any) {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updates } : u)));
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const isSuspended = (u: any) => u.suspended_until && new Date(u.suspended_until) > new Date();

  function SortIcon({ field }: { field: UserSortField }) {
    if (sortField !== field) return <span className="text-text-dim/30 ml-1">↕</span>;
    return <span className="text-primary ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <div>
      {/* Search + per page */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex gap-2 flex-1">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by name..."
            className="flex-1 bg-bg border border-border rounded-lg px-4 py-2 text-sm text-text-bright placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
          <button
            onClick={handleSearch}
            className="bg-primary text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors"
          >
            Search
          </button>
          {search && (
            <button
              onClick={handleClearSearch}
              className="text-sm text-text-dim hover:text-text-muted px-3 py-2"
            >
              Clear
            </button>
          )}
        </div>
        <select
          value={perPage}
          onChange={(e) => { setPerPage(parseInt(e.target.value)); setPage(1); }}
          className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-bright focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none"
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n} per page</option>
          ))}
        </select>
      </div>

      {/* Action message */}
      {actionMessage && (
        <div className={`text-sm px-4 py-2 rounded-lg border mb-3 ${
          actionMessage.type === "success"
            ? "bg-green-500/10 border-green-500/20 text-green-400"
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          {actionMessage.text}
        </div>
      )}

      {/* Results info */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-text-dim">
          {total} user{total !== 1 ? "s" : ""}
          {search && <> matching &ldquo;{search}&rdquo;</>}
        </p>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-visible">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3">
                <button onClick={() => handleSort("full_name")} className="text-xs font-semibold text-text-dim uppercase tracking-wide hover:text-text-muted flex items-center">
                  User<SortIcon field="full_name" />
                </button>
              </th>
              <th className="text-right px-4 py-3 hidden sm:table-cell">
                <span className="text-xs font-semibold text-text-dim uppercase tracking-wide">Notes</span>
              </th>
              <th className="text-right px-4 py-3 hidden sm:table-cell">
                <button onClick={() => handleSort("contributor_score")} className="text-xs font-semibold text-text-dim uppercase tracking-wide hover:text-text-muted flex items-center ml-auto">
                  Score<SortIcon field="contributor_score" />
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <span className="text-xs font-semibold text-text-dim uppercase tracking-wide">Role</span>
              </th>
              <th className="text-left px-4 py-3">
                <span className="text-xs font-semibold text-text-dim uppercase tracking-wide">Status</span>
              </th>
              <th className="w-10 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-dim text-sm">Loading...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-dim text-sm">No users found.</td>
              </tr>
            ) : (
              users.map((u) => {
                const suspended = isSuspended(u);
                return (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/profile/${u.id}`} className="flex items-center gap-2 hover:opacity-80">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                            {(u.full_name ?? "?")[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-bright truncate">{u.full_name ?? "Anonymous"}</p>
                          <p className="text-xs text-text-dim truncate">
                            {u.email && <><span className="text-text-muted">{u.email}</span> &middot; </>}
                            {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="text-right px-4 py-3 text-sm text-text-muted hidden sm:table-cell">
                      {u.actual_notes_count}
                    </td>
                    <td className="text-right px-4 py-3 text-sm text-text-muted hidden sm:table-cell">
                      {u.contributor_score > 0 ? u.contributor_score.toFixed(1) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium capitalize ${
                        u.installer_role === "admin" ? "text-primary" :
                        u.installer_role === "mod" ? "text-yellow-400" :
                        "text-text-dim"
                      }`}>
                        {u.installer_role === "mod" ? "Moderator" : u.installer_role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {suspended ? (
                        <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-2 py-0.5">
                          Suspended
                        </span>
                      ) : (
                        <span className="text-xs text-green-400">Active</span>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <UserActionMenu
                        user={u}
                        suspended={suspended}
                        onAction={(type) => setModal({ type, user: u })}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-text-dim">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-2.5 py-1.5 text-xs rounded-md border border-border text-text-muted hover:bg-surface-hover disabled:opacity-30 transition-colors"
            >
              First
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1.5 text-xs rounded-md border border-border text-text-muted hover:bg-surface-hover disabled:opacity-30 transition-colors"
            >
              Prev
            </button>
            {/* Page number buttons */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    page === pageNum
                      ? "bg-primary text-white border-primary"
                      : "border-border text-text-muted hover:bg-surface-hover"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1.5 text-xs rounded-md border border-border text-text-muted hover:bg-surface-hover disabled:opacity-30 transition-colors"
            >
              Next
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="px-2.5 py-1.5 text-xs rounded-md border border-border text-text-muted hover:bg-surface-hover disabled:opacity-30 transition-colors"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {modal?.type === "role" && (
        <ChangeRoleModal
          user={modal.user}
          callerRole={callerRole}
          onClose={() => setModal(null)}
          onSuccess={(newRole) => {
            updateUser(modal.user.id, { installer_role: newRole });
            setModal(null);
          }}
        />
      )}
      {modal?.type === "suspend" && (
        <SuspendModal
          user={modal.user}
          onClose={() => setModal(null)}
          onSuccess={(until) => {
            updateUser(modal.user.id, { suspended_until: until });
            setModal(null);
          }}
        />
      )}
      {modal?.type === "unsuspend" && (
        <UnsuspendModal
          user={modal.user}
          onClose={() => setModal(null)}
          onSuccess={() => {
            updateUser(modal.user.id, { suspended_until: null, suspension_reason: null });
            setModal(null);
          }}
        />
      )}
      {modal?.type === "reset_password" && (
        <ResetPasswordModal
          user={modal.user}
          onClose={() => setModal(null)}
          onSuccess={(email) => {
            setModal(null);
            showActionMessage("success", `Password reset link sent to ${email}`);
          }}
        />
      )}
      {modal?.type === "delete" && (
        <DeleteAccountModal
          user={modal.user}
          onClose={() => setModal(null)}
          onSuccess={() => {
            setModal(null);
            showActionMessage("success", `Account "${modal.user.full_name ?? modal.user.email ?? "user"}" deleted.`);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}

// ─── 3-dot Action Menu ───────────────────────────────────────────────────────

function UserActionMenu({
  user,
  suspended,
  onAction,
}: {
  user: any;
  suspended: boolean;
  onAction: (type: "role" | "suspend" | "unsuspend" | "reset_password" | "delete") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-dim hover:text-text-muted hover:bg-surface-hover transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 bottom-full mb-1 w-44 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-[100]">
          <button
            onClick={() => { setOpen(false); onAction("role"); }}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-text-muted hover:bg-surface-hover hover:text-text transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Change Role
          </button>
          {suspended ? (
            <button
              onClick={() => { setOpen(false); onAction("unsuspend"); }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-green-400 hover:bg-surface-hover transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Lift Suspension
            </button>
          ) : (
            <button
              onClick={() => { setOpen(false); onAction("suspend"); }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-surface-hover transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Suspend Account
            </button>
          )}
          <Link
            href={`/profile/${user.id}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-text-muted hover:bg-surface-hover hover:text-text transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            View Profile
          </Link>
          <div className="border-t border-border" />
          <button
            onClick={() => { setOpen(false); onAction("reset_password"); }}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-text-muted hover:bg-surface-hover hover:text-text transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Send Password Reset
          </button>
          <button
            onClick={() => { setOpen(false); onAction("delete"); }}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-surface-hover transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Account
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Modal Backdrop ──────────────────────────────────────────────────────────

function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-xl shadow-xl w-full max-w-md p-6">
        {children}
      </div>
    </div>
  );
}

// ─── Change Role Modal ───────────────────────────────────────────────────────

function ChangeRoleModal({
  user,
  callerRole,
  onClose,
  onSuccess,
}: {
  user: any;
  callerRole: string;
  onClose: () => void;
  onSuccess: (role: string) => void;
}) {
  const [role, setRole] = useState(user.installer_role);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const result = await updateUserRole(user.id, role);
    if ("error" in result) {
      setError(result.error ?? "Failed.");
      setSubmitting(false);
    } else {
      onSuccess(role);
    }
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <h3 className="text-lg font-bold text-text-bright mb-1">Change Role</h3>
      <p className="text-sm text-text-muted mb-4">
        Update role for <strong className="text-text-bright">{user.full_name ?? "Anonymous"}</strong>
      </p>

      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

      <div className="space-y-2 mb-6">
        {["user", "mod", ...(callerRole === "admin" ? ["admin"] : [])].map((r) => (
          <label
            key={r}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              role === r ? "border-primary bg-primary/5" : "border-border hover:border-text-dim"
            }`}
          >
            <input
              type="radio"
              name="role"
              value={r}
              checked={role === r}
              onChange={() => setRole(r)}
              className="accent-primary"
            />
            <div>
              <p className="text-sm font-medium text-text-bright capitalize">{r === "mod" ? "Moderator" : r === "admin" ? "Admin" : "User"}</p>
              <p className="text-xs text-text-dim">
                {r === "user" && "Standard access — can submit notes and ratings"}
                {r === "mod" && "Can review flagged content, manage reports, run audits (1/hr)"}
                {r === "admin" && "Full access — manage users, roles, unlimited audits"}
              </p>
            </div>
          </label>
        ))}
      </div>

      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="text-sm text-text-dim hover:text-text-muted px-4 py-2">Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={role === user.installer_role || submitting}
          className="text-sm font-semibold bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-40 transition-colors"
        >
          {submitting ? "Saving..." : "Update Role"}
        </button>
      </div>
    </ModalBackdrop>
  );
}

// ─── Suspend Modal ───────────────────────────────────────────────────────────

function SuspendModal({
  user,
  onClose,
  onSuccess,
}: {
  user: any;
  onClose: () => void;
  onSuccess: (until: string) => void;
}) {
  const [days, setDays] = useState("7");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const d = parseInt(days, 10);
    if (!d || d < 1) { setError("Enter a valid number of days."); return; }
    if (!reason.trim()) { setError("A reason is required."); return; }

    setSubmitting(true);
    setError(null);
    const result = await suspendUser(user.id, d, reason);
    if ("error" in result) {
      setError(result.error ?? "Failed.");
      setSubmitting(false);
    } else {
      const until = new Date();
      until.setDate(until.getDate() + d);
      onSuccess(until.toISOString());
    }
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <h3 className="text-lg font-bold text-text-bright mb-1">Suspend Account</h3>
      <p className="text-sm text-text-muted mb-4">
        Suspend <strong className="text-text-bright">{user.full_name ?? "Anonymous"}</strong> from leaving reviews.
      </p>

      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Duration (days)</label>
          <input
            type="number"
            min="1"
            max="365"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-bright focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Explain why this account is being suspended..."
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-bright placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="text-sm text-text-dim hover:text-text-muted px-4 py-2">Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="text-sm font-semibold bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors"
        >
          {submitting ? "Suspending..." : "Suspend Account"}
        </button>
      </div>
    </ModalBackdrop>
  );
}

// ─── Unsuspend Modal ─────────────────────────────────────────────────────────

function UnsuspendModal({
  user,
  onClose,
  onSuccess,
}: {
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const result = await unsuspendUser(user.id);
    if ("error" in result) {
      setError(result.error ?? "Failed.");
      setSubmitting(false);
    } else {
      onSuccess();
    }
  }

  const until = user.suspended_until
    ? new Date(user.suspended_until).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "";

  return (
    <ModalBackdrop onClose={onClose}>
      <h3 className="text-lg font-bold text-text-bright mb-1">Lift Suspension</h3>
      <p className="text-sm text-text-muted mb-2">
        Remove the suspension on <strong className="text-text-bright">{user.full_name ?? "Anonymous"}</strong>?
      </p>
      {user.suspension_reason && (
        <p className="text-xs text-text-dim bg-bg border border-border rounded-lg p-3 mb-4">
          <strong>Original reason:</strong> {user.suspension_reason}
        </p>
      )}
      <p className="text-sm text-text-muted mb-6">
        Currently suspended until <strong className="text-text-bright">{until}</strong>. This will restore their ability to leave reviews immediately.
      </p>

      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="text-sm text-text-dim hover:text-text-muted px-4 py-2">Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="text-sm font-semibold bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 disabled:opacity-40 transition-colors"
        >
          {submitting ? "Lifting..." : "Lift Suspension"}
        </button>
      </div>
    </ModalBackdrop>
  );
}

// ─── Reset Password Modal ───────────────────────────────────────────────────

function ResetPasswordModal({
  user,
  onClose,
  onSuccess,
}: {
  user: any;
  onClose: () => void;
  onSuccess: (email: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const result = await sendPasswordResetLink(user.id);
    if ("error" in result && result.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      onSuccess(result.email ?? user.email ?? "user");
    }
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <h3 className="text-lg font-bold text-text-bright mb-1">Send Password Reset</h3>
      <p className="text-sm text-text-muted mb-4">
        Send a password reset link to <strong className="text-text-bright">{user.full_name ?? "Anonymous"}</strong>?
      </p>
      {user.email && (
        <p className="text-xs text-text-dim bg-bg border border-border rounded-lg p-3 mb-4">
          Reset link will be sent to: <strong className="text-text-bright">{user.email}</strong>
        </p>
      )}

      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="text-sm text-text-dim hover:text-text-muted px-4 py-2">Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="text-sm font-semibold bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-40 transition-colors"
        >
          {submitting ? "Sending..." : "Send Reset Link"}
        </button>
      </div>
    </ModalBackdrop>
  );
}

// ─── Delete Account Modal ───────────────────────────────────────────────────

function DeleteAccountModal({
  user,
  onClose,
  onSuccess,
}: {
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expectedText = "DELETE";
  const canDelete = confirmText === expectedText;

  async function handleSubmit() {
    if (!canDelete) return;
    setSubmitting(true);
    setError(null);
    const result = await deleteUserAccount(user.id);
    if ("error" in result && result.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      onSuccess();
    }
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <h3 className="text-lg font-bold text-red-400 mb-1">Delete Account</h3>
      <p className="text-sm text-text-muted mb-2">
        Permanently delete <strong className="text-text-bright">{user.full_name ?? "Anonymous"}</strong>?
      </p>
      {user.email && (
        <p className="text-xs text-text-muted mb-3">{user.email}</p>
      )}
      <div className="text-xs text-text-dim bg-red-500/5 border border-red-500/20 rounded-lg p-3 mb-4 space-y-1">
        <p><strong className="text-red-400">This cannot be undone.</strong> This will:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Delete their auth account and profile</li>
          <li>Delete all their notes, ratings, and media</li>
          <li>Remove them from the leaderboard</li>
        </ul>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-text-muted mb-1">
          Type <strong className="text-text-bright">DELETE</strong> to confirm
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="DELETE"
          className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-bright font-mono focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
        />
      </div>

      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="text-sm text-text-dim hover:text-text-muted px-4 py-2">Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={!canDelete || submitting}
          className="text-sm font-semibold bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors"
        >
          {submitting ? "Deleting..." : "Delete Account"}
        </button>
      </div>
    </ModalBackdrop>
  );
}
