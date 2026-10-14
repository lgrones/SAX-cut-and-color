import type { APIRoute } from 'astro';
import { getAuth } from 'firebase-admin/auth';

import { app, SESSION_COOKIE } from '../../../firebase/server';

export const prerender = false;

const SESSION_MAX_AGE = 60 * 60 * 24 * 5; // 5 days, in seconds
const MAX_SIGN_IN_AGE = 5 * 60; // only accept tokens from a fresh sign-in

export const POST: APIRoute = async ({ request, cookies }) => {
  const auth = getAuth(app);

  const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
  if (!idToken) {
    return new Response('No token found', { status: 401 });
  }

  try {
    const { auth_time } = await auth.verifyIdToken(idToken, true);

    if (Date.now() / 1000 - auth_time > MAX_SIGN_IN_AGE) {
      return new Response('Recent sign-in required', { status: 401 });
    }
  } catch {
    return new Response('Invalid token', { status: 401 });
  }

  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE * 1000,
  });

  cookies.set(SESSION_COOKIE, sessionCookie, {
    path: '/',
    maxAge: SESSION_MAX_AGE,
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });

  return new Response(null, { status: 204 });
};
