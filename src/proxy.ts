import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Tag request with site type based on hostname
  const host = request.headers.get("host") ?? "";
  if (host.includes("ppfnotes.com")) {
    supabaseResponse.headers.set("x-site-type", "ppf");
  } else if (host.includes("tintnotes.com")) {
    supabaseResponse.headers.set("x-site-type", "tint");
  }

  const { pathname } = request.nextUrl;

  // Protected routes — require auth
  const protectedPaths = ["/search", "/submit", "/profile/edit", "/admin", "/notifications", "/vehicle"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged-in users on homepage or auth routes → redirect to search
  const isHomepage = pathname === "/";
  const authPaths = ["/login", "/signup"];
  const isAuthRoute = authPaths.some((p) => pathname.startsWith(p));

  if ((isAuthRoute || isHomepage) && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/search";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
