"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin/email", label: "Overview", matchExact: true },
  { href: "/admin/email/sequences", label: "Sequences", matchExact: false },
  { href: "/admin/email/lists", label: "Lists", matchExact: false },
  { href: "/admin/email/broadcast", label: "Broadcast", matchExact: false },
  { href: "/admin/email/analytics", label: "Analytics", matchExact: false },
] as const;

export function EmailNav() {
  const pathname = usePathname();

  function isActive(item: (typeof NAV_ITEMS)[number]) {
    if (item.matchExact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  }

  return (
    <nav className="flex gap-1 mt-4 border-b border-border pb-px overflow-x-auto">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg relative whitespace-nowrap ${
              active
                ? "text-primary bg-primary/5"
                : "text-text-muted hover:text-text hover:bg-surface-hover"
            }`}
          >
            {item.label}
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
