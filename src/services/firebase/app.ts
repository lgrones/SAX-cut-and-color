import { CLIENT_EMAIL, PRIVATE_KEY, PROJECT_ID } from 'astro:env/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

if (import.meta.env.DEV) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
}

export const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: PROJECT_ID,
      clientEmail: CLIENT_EMAIL,
      privateKey: PRIVATE_KEY.replaceAll('\\n', '\n'),
    }),
  });
