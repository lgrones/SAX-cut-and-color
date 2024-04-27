/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PRIVATE_KEY_ID: string;
  readonly PRIVATE_KEY: string;
  readonly PROJECT_ID: string;
  readonly CLIENT_EMAIL: string;
  readonly CLIENT_ID: string;
  readonly AUTH_URI: string;
  readonly TOKEN_URI: string;
  readonly AUTH_CERT_URL: string;
  readonly CLIENT_CERT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
