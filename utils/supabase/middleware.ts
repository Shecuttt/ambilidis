import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
      cookieOptions: {
        maxAge: 172800, // 48 jam dalam detik
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      }
    }
  );

  // Refresh session if expired
  const { data: { user }, error } = await supabase.auth.getUser();

  // Check paths
  const pathname = request.nextUrl.pathname;
  const isSellerRoute = pathname.startsWith('/seller');
  const isCheckoutRoute = pathname.startsWith('/checkout');
  const isOrdersRoute = pathname.startsWith('/orders');
  const isLoginRoute = pathname === '/login' || pathname === '/seller/login';

  // 1. Redirect guest to login if accessing protected routes
  // But EXCLUDE the login routes themselves
  if (!user && (isSellerRoute || isCheckoutRoute || isOrdersRoute) && !isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // 2. Redirect logged-in user away from login pages
  if (user && isLoginRoute) {
    const url = request.nextUrl.clone();
    
    // If user is at seller login, redirect to seller dashboard
    if (pathname.startsWith('/seller')) {
      url.pathname = '/seller/dashboard';
    } else {
      url.pathname = '/';
    }
    
    // Clear redirect param to avoid clutter
    url.searchParams.delete('redirect');
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
