import { startSession } from '@business/auth/startSession';
import { SESSION_COOKIE } from '@infrastructure/sessionCookie';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies }) => {
  const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
  if (!idToken) {
    return new Response('No token found', { status: 401 });
  }

  const session = await startSession(idToken);
  if (!session.ok) {
    return new Response(session.reason, { status: 401 });
  }

  cookies.set(SESSION_COOKIE, session.sessionCookie, {
    path: '/',
    maxAge: session.maxAge,
    httpOnly: true,
    // A phone reaches the dev server over plain http, where browsers drop a
    // secure cookie and the sign-in would end back on /signin
    secure: import.meta.env.PROD,
    sameSite: 'strict',
  });

  return new Response(null, { status: 204 });
};
