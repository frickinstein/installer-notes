/**
 * Shared email layout for Installer Notes campaign & transactional emails.
 * Dark theme with red accent — matches the app.
 *
 * Brand colors:
 *   Primary red: #E31C23
 *   Dark background: #0F172A
 *   Surface dark: #1E293B
 *   Border subtle: #2D3A4D
 *   Text light: #CBD5E1
 *   Text muted: #94A3B8
 *   Text dim: #64748B
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://installernotes.com";

export type EmailLayoutOptions = {
  footer?: string;
  unsubscribeUrl?: string;
  preheaderText?: string;
};

export function emailLayout(body: string, options?: EmailLayoutOptions | string): string {
  // Backwards compat: if options is a string, treat as footer
  const opts: EmailLayoutOptions =
    typeof options === "string" ? { footer: options } : options ?? {};

  const footerText =
    opts.footer ??
    `Installer Notes &mdash; the free vehicle knowledge base by installers, for installers.
     <br/>Part of the <a href="https://snaptip.app" style="color:#64748B;text-decoration:underline">SnapTip</a> platform.`;

  const preheader = opts.preheaderText
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${opts.preheaderText}</div>`
    : "";

  const unsubLink = opts.unsubscribeUrl
    ? `<p style="margin:8px 0 0;font-size:11px;color:#475569">
        <a href="${opts.unsubscribeUrl}" style="color:#475569;text-decoration:underline">Unsubscribe</a>
      </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0F172A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  ${preheader}
  <div style="max-width:560px;margin:0 auto;padding:40px 20px">
    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px">
      <span style="color:#FFFFFF;font-size:26px;font-weight:900;letter-spacing:-0.5px">Installer Notes</span>
    </div>

    <!-- Card -->
    <div style="background:#1E293B;border:1px solid #2D3A4D;border-radius:12px;padding:32px 28px">
      ${body}
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;padding:0 20px">
      <p style="margin:0;font-size:12px;color:#64748B;line-height:1.6">${footerText}</p>
      <p style="margin:8px 0 0;font-size:11px;color:#475569">
        <a href="${SITE_URL}" style="color:#475569;text-decoration:underline">installernotes.com</a>
      </p>
      ${unsubLink}
    </div>
  </div>
</body>
</html>`;
}

export function primaryButton(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#E31C23;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:0.01em">${text}</a>`;
}

export function secondaryButton(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:transparent;color:#E31C23;text-decoration:none;padding:11px 27px;border-radius:8px;font-weight:700;font-size:14px;border:1px solid #E31C23">${text}</a>`;
}

export function infoBox(content: string): string {
  return `<div style="background:#0F172A;border:1px solid #2D3A4D;border-radius:8px;padding:16px 20px;margin:20px 0">${content}</div>`;
}

export function heading(text: string): string {
  return `<h2 style="margin:0 0 16px;color:#F1F5F9;font-size:20px;font-weight:700">${text}</h2>`;
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;color:#94A3B8;line-height:1.7;font-size:15px">${text}</p>`;
}

export function highlight(text: string): string {
  return `<strong style="color:#CBD5E1">${text}</strong>`;
}

export function divider(): string {
  return `<hr style="border:none;border-top:1px solid #2D3A4D;margin:24px 0" />`;
}

export function bulletList(items: string[]): string {
  const lis = items
    .map(
      (item) =>
        `<li style="margin:0 0 8px;color:#94A3B8;line-height:1.6;font-size:15px">${item}</li>`
    )
    .join("");
  return `<ul style="margin:0 0 16px;padding-left:20px">${lis}</ul>`;
}
