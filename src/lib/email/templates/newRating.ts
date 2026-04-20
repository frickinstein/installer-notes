import {
  emailLayout,
  primaryButton,
  heading,
  paragraph,
  highlight,
  infoBox,
} from "./layout";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://installernotes.com";

export function newRatingEmail({
  username,
  reviewerName,
  stars,
  review,
  vehicleLabel,
  noteGroupId,
}: {
  username: string;
  reviewerName: string;
  stars: number;
  review: string;
  vehicleLabel: string;
  noteGroupId: string;
}): string {
  const starDisplay = "\u2605".repeat(stars) + "\u2606".repeat(5 - stars);

  const body = `
    ${heading("Someone rated your note!")}
    ${paragraph(`Hey${username ? ` ${username}` : ""} &mdash; ${highlight(reviewerName)} left a review on your note for the ${highlight(vehicleLabel)}.`)}
    ${infoBox(`
      <p style="margin:0 0 8px;color:#F59E0B;font-size:20px;letter-spacing:2px">${starDisplay}</p>
      <p style="margin:0;color:#CBD5E1;font-size:14px;line-height:1.6">&ldquo;${review.replace(/</g, "&lt;").replace(/>/g, "&gt;")}&rdquo;</p>
      <p style="margin:8px 0 0;color:#64748B;font-size:12px">&mdash; ${reviewerName}</p>
    `)}
    ${paragraph(`Your knowledge is helping other installers. Keep it up!`)}
    <div style="text-align:center;margin:28px 0">
      ${primaryButton("View Your Note", `${SITE}/vehicles/${noteGroupId}`)}
    </div>
  `;

  return emailLayout(body);
}
