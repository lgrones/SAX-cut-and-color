import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
import preact from "@astrojs/preact";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  site: "https://www.sax-cut-and-colour.at",
  integrations: [sitemap(), preact()],
  vite: {
    plugins: [tailwindcss()],
  },
});
