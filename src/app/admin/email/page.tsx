import { getEmailOverviewStats, listCampaigns, listEmailLists } from "@/actions/admin";

export default async function EmailOverviewPage() {
  const [stats, campaigns, lists] = await Promise.all([
    getEmailOverviewStats(),
    listCampaigns(),
    listEmailLists(),
  ]);

  const activeSequences = campaigns.filter((c) => c.status === "active");
  const recentCampaigns = campaigns.slice(-3).reverse();

  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Sent This Month", value: (stats?.sentThisMonth ?? 0).toLocaleString() },
          { label: "Active Sequences", value: stats?.activeSequences ?? 0 },
          { label: "Lists", value: stats?.listsCount ?? 0 },
          { label: "Total Sequences", value: campaigns.length },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-5 text-center">
            <p className="text-2xl font-bold text-text-bright">{s.value}</p>
            <p className="text-[10px] text-text-dim uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active sequences */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium uppercase tracking-wider text-text-dim">Active Sequences</p>
            <a href="/admin/email/sequences" className="text-xs text-primary hover:text-primary/80">
              View all →
            </a>
          </div>
          {activeSequences.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">No active sequences.</p>
          ) : (
            <div className="space-y-2">
              {activeSequences.map((c) => (
                <a
                  key={c.name}
                  href={`/admin/email/sequences/${c.name}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-hover hover:bg-primary/5 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-bright group-hover:text-primary transition-colors truncate">
                      {c.displayName}
                    </p>
                    {c.listName && (
                      <p className="text-xs text-text-dim mt-0.5">→ {c.listName}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-semibold text-text-bright">{c.stepCount}</p>
                    <p className="text-[10px] text-text-dim">steps</p>
                  </div>
                </a>
              ))}
            </div>
          )}
          <a
            href="/admin/email/sequences"
            className="mt-4 block w-full py-2 text-center text-xs font-medium text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
          >
            + New Sequence
          </a>
        </div>

        {/* Lists */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium uppercase tracking-wider text-text-dim">Email Lists</p>
            <a href="/admin/email/lists" className="text-xs text-primary hover:text-primary/80">
              Manage →
            </a>
          </div>
          {lists.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">No lists yet.</p>
          ) : (
            <div className="space-y-2">
              {lists.slice(0, 5).map((l) => (
                <a
                  key={l.slug}
                  href={`/admin/email/lists/${l.slug}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-hover hover:bg-primary/5 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-bright group-hover:text-primary transition-colors truncate">
                      {l.name}
                    </p>
                    <span className={`text-[10px] font-semibold uppercase ${l.type === "smart" ? "text-purple-400" : "text-blue-400"}`}>
                      {l.type}
                    </span>
                  </div>
                  {l.type === "static" && l.staticMemberCount !== null && (
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-sm font-semibold text-text-bright">{l.staticMemberCount}</p>
                      <p className="text-[10px] text-text-dim">members</p>
                    </div>
                  )}
                </a>
              ))}
            </div>
          )}
          <a
            href="/admin/email/lists"
            className="mt-4 block w-full py-2 text-center text-xs font-medium text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
          >
            + New List
          </a>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <a
          href="/admin/email/broadcast"
          className="bg-surface border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group"
        >
          <p className="text-sm font-semibold text-text-bright group-hover:text-primary transition-colors">
            Send Broadcast
          </p>
          <p className="text-xs text-text-dim mt-1">
            One-off email to any list
          </p>
        </a>
        <a
          href="/admin/email/sequences"
          className="bg-surface border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group"
        >
          <p className="text-sm font-semibold text-text-bright group-hover:text-primary transition-colors">
            Manage Sequences
          </p>
          <p className="text-xs text-text-dim mt-1">
            Drip campaigns and event triggers
          </p>
        </a>
        <a
          href="/admin/email/analytics"
          className="bg-surface border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group"
        >
          <p className="text-sm font-semibold text-text-bright group-hover:text-primary transition-colors">
            View Analytics
          </p>
          <p className="text-xs text-text-dim mt-1">
            Send history and event log
          </p>
        </a>
      </div>
    </div>
  );
}
