import { env } from 'node:process';

import node from '@astrojs/node';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import sentry from '@sentry/astro';
import { defineConfig, envField, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Pages render on request unless they opt into prerendering, as the 404 does
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  site: 'https://www.sax-cut-and-colour.at',
  // One URL per page: canonical, sitemap and links all go without the slash,
  // and the server redirects the other form (dev answers it with a 404)
  trailingSlash: 'never',
  // The CSS is small, so it comes with the HTML instead of blocking the first
  // paint with requests of its own
  build: { inlineStylesheets: 'always' },
  integrations: [
    // the back office has nothing to index
    sitemap({
      filter: page => !/^\/(admin|signin)(\/|$)/.test(new URL(page).pathname),
    }),
    react(),
    // Errors from the browser and the server; the options, which collect no
    // personal data, are in the init files
    sentry({
      clientInitPath: 'src/infrastructure/sentryClient.ts',
      serverInitPath: 'src/infrastructure/sentryServer.ts',
      // org, project and token come from SENTRY_ORG, SENTRY_PROJECT and
      // SENTRY_AUTH_TOKEN; source maps are uploaded, then deleted, only when
      // the token is set
      sourcemaps: { disable: !env.SENTRY_AUTH_TOKEN },
      telemetry: false,
    }),
  ],
  // Off for `pnpm dev:mobile`, where the toolbar covers the bottom of the page
  devToolbar: { enabled: env.ASTRO_DEV_TOOLBAR !== 'off' },
  vite: {
    // Leaves Sentry's tracing and debug logging out of the bundles, with or
    // without the upload, which would otherwise do it
    define: { __SENTRY_TRACING__: false, __SENTRY_DEBUG__: false },
    // In dev the browser reaches the storage and auth emulators through the
    // dev server, so a phone on the LAN gets them too instead of looking on
    // its own localhost
    server: {
      proxy: {
        '/v0': 'http://127.0.0.1:9199',
        '/identitytoolkit.googleapis.com': 'http://127.0.0.1:9099',
        '/securetoken.googleapis.com': 'http://127.0.0.1:9099',
      },
    },
  },
  // Downloaded at build time and served from our own domain, so visitors
  // never contact Google (GDPR)
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'DM Serif Display',
      cssVariable: '--font-serif',
      weights: [400],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Hanken Grotesk',
      cssVariable: '--font-sans',
      weights: [400, 500, 600],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Helvetica Neue', 'Helvetica', 'sans-serif'],
    },
  ],
  env: {
    schema: {
      PROJECT_ID: envField.string({
        context: 'server',
        access: 'public',
        default: 'sax-cut-and-color',
      }),
      // Public, it only lets the browser send reports. Without it Sentry is off
      SENTRY_DSN: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
      STORAGE_BUCKET: envField.string({
        context: 'server',
        access: 'public',
        default: 'sax-cut-and-color.appspot.com',
      }),
    },
  },
});
