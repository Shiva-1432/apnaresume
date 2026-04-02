import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/upload(.*)',
  '/my-resumes(.*)',
  '/resumes(.*)',
  '/job-matcher(.*)',
  '/skill-gap(.*)',
  '/history(.*)',
  '/analytics(.*)',
  '/support(.*)',
  '/settings(.*)',
  '/analysis(.*)',
  '/admin(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const { pathname, search } = req.nextUrl;

  const isRootOrAuthPage =
    pathname === '/' || pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');

  if (userId && isRootOrAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (!userId && isProtectedRoute(req)) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', `${pathname}${search}`);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};