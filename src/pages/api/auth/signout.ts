import type { APIRoute } from 'astro';
import { getAuth } from 'firebase-admin/auth';

import { app, SESSION_COOKIE } from '../../../firebase/server';

export const prerender = false;

export const POST: APIRoute = async ({ locals, redirect, cookies }) => {
  // Invalidate every session of this user, not just the cookie in this browser
  if (locals.user) {
    await getAuth(app).revokeRefreshTokens(locals.user.sub);
  }

  cookies.delete(SESSION_COOKIE, { path: '/' });

  return redirect('/signin');
};
