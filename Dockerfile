# Runs the prebuilt Astro server. It does not build: server island props are
# encrypted with a per-build key, so the server must ship from the same
# `pnpm build` as the static pages on Firebase Hosting.
FROM node:24-slim

ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
WORKDIR /app

RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY dist ./dist

CMD ["node", "dist/server/entry.mjs"]
