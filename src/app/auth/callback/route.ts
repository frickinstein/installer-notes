import { createClient } from "@/lib/supabase/server";
import { getSiteType } from "@/lib/site";
import { NextRequest, NextResponse } from "next/server";
import { fireCampaignEvent } from "@/lib/email/campaign-events";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/search";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const userId = data?.user?.id;
      if (userId) {
        // Fire signup campaign event (fire-and-forget)
        void fireCampaignEvent(userId, "signup");

        // Set signup_domain for new users (created within the last 5 minutes)
        const createdAt = data.user.created_at ? new Date(data.user.created_at).getTime() : 0;
        const isNewUser = Date.now() - createdAt < 5 * 60 * 1000;
        if (isNewUser) {
          const siteType = await getSiteType();
          const domain =
            siteType === "tint" ? "tintnotes" :
            siteType === "ppf"  ? "ppfnotes"  :
                                  "installernotes";
          void supabase
            .from("profiles")
            .update({ signup_domain: domain })
            .eq("id", userId);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
