import { CLIENT_EMAIL, PRIVATE_KEY, PROJECT_ID } from 'astro:env/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (import.meta.env.DEV) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
}

// Firebase Hosting only forwards a cookie with exactly this name to the backend
export const SESSION_COOKIE = '__session';

export const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: PROJECT_ID,
      clientEmail: CLIENT_EMAIL,
      privateKey: PRIVATE_KEY.replaceAll('\\n', '\n'),
    }),
  });

/** All documents of a collection, ordered by their `index` field */
export const getCollection = async <T>(name: string) => {
  const snapshot = await getFirestore(app)
    .collection(name)
    .orderBy('index')
    .get();

  return snapshot.docs.map(doc => doc.data() as T);
};
