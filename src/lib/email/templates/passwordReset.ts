import { emailLayout, primaryButton, heading, paragraph } from "./layout";

export function passwordResetEmail({
  firstName,
  confirmUrl,
  siteName,
}: {
  firstName: string | null;
  confirmUrl: string;
  siteName: string;
}): string {
  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : "Hi there,";
  const body = `
    ${heading("Reset your password")}
    ${paragraph(greeting)}
    ${paragraph(`We received a request to reset the password for your ${escapeHtml(siteName)} account. Click below to choose a new one. The link works once and expires in an hour.`)}
    ${primaryButton("Reset my password", confirmUrl)}
    ${paragraph("If you didn&rsquo;t ask for this, you can ignore this email &mdash; your password stays as it is until this link is used.")}
  `;
  return emailLayout(body, {
    footer: `${escapeHtml(siteName)} &mdash; the free vehicle knowledge base by installers, for installers.`,
    preheaderText: `Reset your ${siteName} password`,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
