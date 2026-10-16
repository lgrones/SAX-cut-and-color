import node from '@astrojs/node';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import { defineConfig, envField, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
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
    preact(),
  ],
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
      PROJECT_ID: envField.string({ context: 'server', access: 'secret' }),
      CLIENT_EMAIL: envField.string({ context: 'server', access: 'secret' }),
      PRIVATE_KEY: envField.string({ context: 'server', access: 'secret' }),
      STORAGE_BUCKET: envField.string({
        context: 'server',
        access: 'public',
        default: 'sax-cut-and-color.appspot.com',
      }),
    },
  },
});
