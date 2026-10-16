import { getAuth } from 'firebase-admin/auth';

import { app } from './app';

export type { DecodedIdToken } from 'firebase-admin/auth';

// checkRevoked rejects tokens of signed out, disabled or deleted users
export const verifyIdToken = (idToken: string) =>
  getAuth(app).verifyIdToken(idToken, true);

export const verifySessionCookie = (sessionCookie: string) =>
  getAuth(app).verifySessionCookie(sessionCookie, true);

export const createSessionCookie = (idToken: string, expiresInMs: number) =>
  getAuth(app).createSessionCookie(idToken, { expiresIn: expiresInMs });

/** Invalidates every session of this user, not just one browser's */
export const revokeSessions = (uid: string) =>
  getAuth(app).revokeRefreshTokens(uid);
