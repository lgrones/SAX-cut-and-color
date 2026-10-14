import { SESSION_COOKIE } from '@infrastructure/sessionCookie';
import { Firebase } from '@services/firebase';
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ locals, redirect, cookies }) => {
  if (locals.user) {
    await Firebase.revokeSessions(locals.user.sub);
  }

  cookies.delete(SESSION_COOKIE, { path: '/' });

  return redirect('/signin');
};
