import { PROJECT_ID } from 'astro:env/server';
import { initializeApp, getApps } from 'firebase-admin/app';

if (import.meta.env.DEV) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';
}

// No key: on Cloud Run the Admin SDK acts as the service's own service
// account (see docs/cloud-run.md), and the emulators need no credentials
export const app = getApps()[0] ?? initializeApp({ projectId: PROJECT_ID });
