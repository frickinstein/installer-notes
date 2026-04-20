"use client";

import { useEffect } from "react";
import { setUserProperties } from "@/lib/analytics";
import { SiteType } from "@/lib/site";

export function DomainTracker({ siteType }: { siteType: SiteType }) {
  const domain =
    siteType === "tint" ? "tintnotes" :
    siteType === "ppf"  ? "ppfnotes"  :
                          "installernotes";

  useEffect(() => {
    setUserProperties({ current_domain: domain });
  }, [domain]);

  return null;
}
