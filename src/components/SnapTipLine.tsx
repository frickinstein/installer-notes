import type { SiteType } from "@/lib/site";

// The one contextual link back to SnapTip, at the foot of every vehicle page
// (SnapTip SEO audit 2026-11-21, docs/marketing/seo/AUDIT.md in that repo).
// Honest same-owner link: plain brand anchor, www host (the apex 307s), one
// per page. Tint Notes also points at the window tint pricing guide; PPF and
// Installer Notes get the general line.
export const SNAPTIP_URL = "https://www.snaptip.app";

export function SnapTipLine({ siteType }: { siteType: SiteType }) {
  return (
    <aside className="mt-12 border-t border-border pt-6 text-sm text-text-muted">
      {siteType === "tint" ? (
        <p>
          Quoting this car for a customer?{" "}
          <a href={`${SNAPTIP_URL}/`} className="text-primary hover:underline">
            SnapTip
          </a>{" "}
          prices it from your own price list, by film, zone and body type. New to pricing that way? Read{" "}
          <a href={`${SNAPTIP_URL}/guides/how-to-price-window-tint`} className="text-primary hover:underline">
            how to price window tint
          </a>
          .
        </p>
      ) : (
        <p>
          Running a tint or PPF shop?{" "}
          <a href={`${SNAPTIP_URL}/`} className="text-primary hover:underline">
            SnapTip
          </a>{" "}
          is business management for window tint and PPF shops: quotes, booking, jobs and invoices, from the same
          account you use here.
        </p>
      )}
    </aside>
  );
}
