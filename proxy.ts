import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';
import {getToken} from 'next-auth/jwt';
import createMiddleware from 'next-intl/middleware';
import {locales, defaultLocale} from './lib/i18n/navigation';

const handleI18nRouting = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

const PUBLIC_CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=86400';
const RESERVED_TOP_LEVEL = new Set([
  'login',
  'register',
  'forgot-password',
  'reset-password',
  'verify-email',
  'packages',
  'payment',
  'demo',
  'activate',
  'partner',
  'dashboard',
  'admin',
  'app',
]);

function isPublicMenuRoute(pathname: string): boolean {
  if (pathname === '/') return true;
  if (pathname === '/demo') return true;
  if (pathname.startsWith('/menu/')) return true;
  if (pathname.startsWith('/app/') || pathname.startsWith('/dashboard/') || pathname.startsWith('/admin/') || pathname.startsWith('/api/')) {
    return false;
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 1) {
    return !RESERVED_TOP_LEVEL.has(segments[0]);
  }
  if (segments.length === 2 && segments[1] === 'list') return true;
  return false;
}

async function handleAuthProxy(req: NextRequest) {
  const {pathname, search} = req.nextUrl;
  const isLoginRoute = pathname === '/login' || pathname.endsWith('/login');

  if (isLoginRoute) {
    const token = await getToken({req, secret: process.env.NEXTAUTH_SECRET});
    if (!token) {
      return NextResponse.next();
    }

    const role = String((token as any)?.role || '').toLowerCase();
    const isAdmin = role === 'admin';
    const redirectUrl = isAdmin ? '/admin' : '/dashboard';
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  if (isPublicMenuRoute(pathname)) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', PUBLIC_CACHE_CONTROL);
    return response;
  }

  const token = await getToken({req, secret: process.env.NEXTAUTH_SECRET});

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  const role = String((token as any)?.role || '').toLowerCase();
  const isAdmin = role === 'admin';

  if ((pathname.startsWith('/admin') || pathname.endsWith('/admin')) && !isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (isAdmin && ((pathname.startsWith('/dashboard') || pathname.endsWith('/dashboard')) || (pathname.startsWith('/app') || pathname.endsWith('/app')))) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  return NextResponse.next();
}

export default async function proxy(request: NextRequest) {
  const {pathname} = request.nextUrl;

  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const i18nResponse = handleI18nRouting(request);

  const hasLocaleRoutingDecision =
    i18nResponse.headers.has('x-middleware-rewrite') ||
    i18nResponse.headers.has('location');

  if (hasLocaleRoutingDecision) {
    return i18nResponse;
  }

  return await handleAuthProxy(request);
}

export const config = {
  matcher: [
    '/((?!_next|api|.*\\..*|public).*)',
    '/',
    '/menu/:path*',
    '/:slug',
    '/:slug/list',
    '/dashboard/:path*',
    '/app/:path*',
    '/admin/:path*',
    '/login',
  ],
};
