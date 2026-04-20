import { headers } from "next/headers";

export type SiteType = "tint" | "ppf" | null;

/**
 * Returns "tint" on tintnotes.com, "ppf" on ppfnotes.com, null on the main site.
 * Only callable from server components / server actions.
 */
export async function getSiteType(): Promise<SiteType> {
  const h = await headers();
  const val = h.get("x-site-type");
  if (val === "tint") return "tint";
  if (val === "ppf") return "ppf";
  return null;
}

export function getSiteName(siteType: SiteType): string {
  if (siteType === "tint") return "Tint Notes";
  if (siteType === "ppf") return "PPF Notes";
  return "Installer Notes";
}
