import type { ServiceAccount } from "firebase-admin";
import { initializeApp, cert, getApps } from "firebase-admin/app";

const activeApps = getApps();

const serviceAccount = {
  type: "service_account",
  project_id: import.meta.env.PROJECT_ID,
  private_key_id: import.meta.env.PRIVATE_KEY_ID,
  private_key: import.meta.env.PRIVATE_KEY.replaceAll(/\\n/g, "\n"),
  client_email: import.meta.env.CLIENT_EMAIL,
  client_id: import.meta.env.CLIENT_ID,
  auth_uri: import.meta.env.AUTH_URI,
  token_uri: import.meta.env.TOKEN_URI,
  auth_provider_x509_cert_url: import.meta.env.AUTH_CERT_URL,
  client_x509_cert_url: import.meta.env.CLIENT_CERT_URL,
};

if (process.env.NODE_ENV === "development") {
  process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
}

export const app =
  activeApps.length === 0
    ? initializeApp({
        credential: cert(serviceAccount as ServiceAccount),
      })
    : activeApps[0];
