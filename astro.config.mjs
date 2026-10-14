import node from '@astrojs/node';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import { defineConfig, envField } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  adapter: node({ mode: 'standalone' }),
  site: 'https://www.sax-cut-and-colour.at',
  integrations: [sitemap(), preact()],
  env: {
    schema: {
      PROJECT_ID: envField.string({ context: 'server', access: 'secret' }),
      CLIENT_EMAIL: envField.string({ context: 'server', access: 'secret' }),
      PRIVATE_KEY: envField.string({ context: 'server', access: 'secret' }),
    },
  },
});
