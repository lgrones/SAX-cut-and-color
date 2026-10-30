import { Firebase } from '@services/firebase';

const SESSION_MAX_AGE = 60 * 60 * 24 * 5; // 5 days, in seconds
const MAX_SIGN_IN_AGE = 5 * 60; // only accept tokens from a fresh sign-in

type StartSessionResult =
  | { ok: true; sessionCookie: string; maxAge: number }
  | { ok: false; reason: string };

/** Trades the ID token of a fresh sign-in for a long-lived session cookie */
export const startSession = async (
  idToken: string,
): Promise<StartSessionResult> => {
  try {
    const { auth_time } = await Firebase.verifyIdToken(idToken);

    if (Date.now() / 1000 - auth_time > MAX_SIGN_IN_AGE) {
      return { ok: false, reason: 'Recent sign-in required' };
    }
  } catch {
    return { ok: false, reason: 'Invalid token' };
  }

  const sessionCookie = await Firebase.createSessionCookie(
    idToken,
    SESSION_MAX_AGE * 1000,
  );

  return { ok: true, sessionCookie, maxAge: SESSION_MAX_AGE };
};
