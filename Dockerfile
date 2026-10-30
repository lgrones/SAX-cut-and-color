# Runs the prebuilt Astro server. It does not build: the pages it renders link
# the hashed assets of the same `pnpm build` that goes to Firebase Hosting.
FROM node:24-slim

ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
WORKDIR /app

RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY dist ./dist

CMD ["node", "dist/server/entry.mjs"]
