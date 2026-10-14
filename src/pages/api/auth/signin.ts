import { startSession } from '@business/auth/startSession';
import { SESSION_COOKIE } from '@infrastructure/sessionCookie';
import type { APIRoute } from 'astro';

export const prerender = false;

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
    secure: true,
    sameSite: 'strict',
  });

  return new Response(null, { status: 204 });
};
