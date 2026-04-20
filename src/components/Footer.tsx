import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border py-6 mt-auto">
      <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-text-dim">
          Built by{" "}
          <a
            href="https://snaptip.app"
            className="text-text-muted hover:text-text transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            SnapTip
          </a>
          {" "}&mdash; business management for automotive appearance shops
        </p>
        <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
          <Link href="/faq" className="text-xs text-text-dim hover:text-text-muted transition-colors">
            FAQ
          </Link>
          <Link href="/leaderboard" className="text-xs text-text-dim hover:text-text-muted transition-colors">
            Leaderboard
          </Link>
          <Link href="/privacy" className="text-xs text-text-dim hover:text-text-muted transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-xs text-text-dim hover:text-text-muted transition-colors">
            Terms of Service
          </Link>
          <p className="text-xs text-text-dim">
            &copy; {new Date().getFullYear()} SnapTip
          </p>
        </div>
      </div>
    </footer>
  );
}
