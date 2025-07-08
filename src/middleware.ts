// src/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Log an error or redirect to an error page if environment variables are missing
    console.error('Supabase environment variables are missing!');
    // Redirect to an error page or simply return the response without Supabase client
    return NextResponse.redirect(
      new URL('/error?message=Supabase configuration missing', request.url),
    );
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });

  // Refresh session if expired - important to keep user logged in
  // Get user info
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log(
    `Middleware: Pathname: ${request.nextUrl.pathname}, User: ${user ? user.id : 'null'}`,
  );

  // Define protected and auth routes
  const protectedRoutes = [
    '/dashboard',
    '/questions',
    '/generate',
    '/profile', // Assuming /profile will be a protected route
  ];

  // Define routes that should not be accessible if the user is already logged in
  const authRoutes = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
  ];
  const { pathname } = request.nextUrl;

  // If user is not logged in and trying to access a protected route, redirect to login
  if (!user && protectedRoutes.some((route) => pathname.startsWith(route))) {
    console.log(
      `Middleware: Redirecting unauthenticated user from ${pathname} to /login`,
    );
    return NextResponse.redirect(
      new URL('/login?error=Please log in to access this page.', request.url),
    );
  }

  // If user is logged in and trying to access an auth route (login/register), redirect to dashboard
  if (user && authRoutes.some((route) => pathname.startsWith(route))) {
    console.log(
      `Middleware: Redirecting authenticated user from ${pathname} to /dashboard`,
    );
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
