import { getResendClient } from "./resend";

export type SendResult = { success: true } | { success: false; error: string };

export type BatchEmail = {
  to: string;
  subject: string;
  html: string;
};

export type BatchSendResult = {
  sent: number;
  failed: number;
  /** Indices of the emails that failed in the original array */
  failedIndices: number[];
};

export async function sendEmail(
  to: string | null | undefined,
  subject: string,
  html: string
): Promise<SendResult> {
  if (!to) return { success: false, error: "No recipient email address." };

  const resend = getResendClient();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping email send.");
    return { success: false, error: "RESEND_API_KEY not configured." };
  }

  const fromAddress =
    process.env.RESEND_FROM_EMAIL ?? "Installer Notes <installernotes@snaptip.app>";
  const replyTo = process.env.RESEND_REPLY_TO ?? "bfm@snaptip.app";

  try {
    const { error } = await resend.emails.send({
      from: fromAddress,
      replyTo,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[email] Resend send error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown send error";
    console.error("[email] Resend send failed:", err);
    return { success: false, error: message };
  }
}

const BATCH_SIZE = 100;
const BATCH_DELAY_MS = 1000; // 1s between batches to respect rate limits

/**
 * Send emails in batches of up to 100 using Resend's batch API.
 * Adds a 1s delay between batches to respect rate limits.
 */
export async function sendBatchEmails(
  emails: BatchEmail[]
): Promise<BatchSendResult> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping batch send.");
    return { sent: 0, failed: emails.length, failedIndices: emails.map((_, i) => i) };
  }

  const fromAddress =
    process.env.RESEND_FROM_EMAIL ?? "Installer Notes <installernotes@snaptip.app>";
  const replyTo = process.env.RESEND_REPLY_TO ?? "bfm@snaptip.app";

  let totalSent = 0;
  let totalFailed = 0;
  const failedIndices: number[] = [];

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const chunk = emails.slice(i, i + BATCH_SIZE);

    // Add delay between batches (skip delay for the first batch)
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }

    try {
      const payload = chunk.map((e) => ({
        from: fromAddress,
        replyTo,
        to: e.to,
        subject: e.subject,
        html: e.html,
      }));

      const { data, error } = await resend.batch.send(payload);

      if (error) {
        console.error("[email] Resend batch error:", error);
        // Entire batch failed — mark all in this chunk as failed
        for (let j = 0; j < chunk.length; j++) {
          failedIndices.push(i + j);
        }
        totalFailed += chunk.length;
      } else {
        // Batch succeeded — count results
        const sentCount = data?.data?.length ?? chunk.length;
        totalSent += sentCount;
      }
    } catch (err) {
      console.error("[email] Resend batch send failed:", err);
      for (let j = 0; j < chunk.length; j++) {
        failedIndices.push(i + j);
      }
      totalFailed += chunk.length;
    }
  }

  return { sent: totalSent, failed: totalFailed, failedIndices };
}
