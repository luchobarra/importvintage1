import { createServerClient } from "@supabase/ssr";
import { isAdminUser } from "@/features/auth/admin";
import { getCurrentSupabaseUser } from "@/features/auth/session";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const user = await getCurrentSupabaseUser(supabase);

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/retro-campus-admin/login";

  const isAdmin = isAdminUser(user);

  if (!isAdmin && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/retro-campus-admin/login";
    url.searchParams.set("redirectTo", pathname);
    return copyResponseCookies(supabaseResponse, NextResponse.redirect(url));
  }

  if (isAdmin && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/retro-campus-admin";
    url.search = "";
    return copyResponseCookies(supabaseResponse, NextResponse.redirect(url));
  }

  return supabaseResponse;
}

function copyResponseCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });

  return to;
}
