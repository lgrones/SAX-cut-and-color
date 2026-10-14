import { SESSION_COOKIE } from '@infrastructure/sessionCookie';
import { Firebase } from '@services/firebase';
import { defineMiddleware } from 'astro:middleware';

// Matched against the resolved route instead of the raw URL, so variants like
// `/admin/` or `/%61dmin` can't slip past the check
const PUBLIC_API_ROUTES = new Set(['/api/auth/signin', '/api/auth/signout']);

const isProtected = (route: string) =>
  route === '/admin' ||
  route.startsWith('/admin/') ||
  (route.startsWith('/api/') && !PUBLIC_API_ROUTES.has(route));

// Routes that read the session but stay reachable without one
const usesSession = (route: string) =>
  route === '/signin' || route === '/api/auth/signout';

export const onRequest = defineMiddleware(async (context, next) => {
  const route = context.routePattern;

  if (context.isPrerendered || !(isProtected(route) || usesSession(route))) {
    return next();
  }

  const sessionCookie = context.cookies.get(SESSION_COOKIE)?.value;

  if (sessionCookie) {
    try {
      context.locals.user = await Firebase.verifySessionCookie(sessionCookie);
    } catch {
      context.cookies.delete(SESSION_COOKIE, { path: '/' });
    }
  }

  if (route === '/signin') {
    return context.locals.user ? context.redirect('/admin') : next();
  }

  if (!context.locals.user && isProtected(route)) {
    return route.startsWith('/api/')
      ? new Response('Unauthorized', { status: 401 })
      : context.redirect('/signin');
  }

  return next();
});
