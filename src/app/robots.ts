import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://installernotes.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Allow real search engines
      {
        userAgent: ["Googlebot", "Bingbot", "DuckDuckBot", "Slurp", "Yandex"],
        allow: "/",
        disallow: ["/admin", "/profile/edit", "/notifications", "/submit/"],
      },
      // Block AI training crawlers
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "CCBot",
          "Google-Extended",
          "anthropic-ai",
          "ClaudeBot",
          "Claude-Web",
          "Bytespider",
          "Diffbot",
          "FacebookBot",
          "Omgilibot",
          "Applebot-Extended",
          "PerplexityBot",
          "YouBot",
          "Amazonbot",
          "cohere-ai",
        ],
        disallow: "/",
      },
      // Default: allow crawling but block sensitive routes
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/profile/edit", "/notifications", "/submit/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
