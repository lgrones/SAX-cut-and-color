<div align="center">
  <img src="docs/assets/wordmark.svg" alt="SAX Cut + Colour" width="492">
  <p><em>Website of SAX Cut + Colour, a hair salon in Lochau, Austria.</em></p>
  <p>
    <a href="https://www.sax-cut-and-colour.at"><b>www.sax-cut-and-colour.at</b></a>
  </p>
</div>

## The site

A one-page website for a small hair salon. Visitors find everything they need to book an appointment on a single scroll:

- Opening hours and contact details, with a map link to the salon
- Prices for cuts, colour and care
- Current offers and promotions
- A photo gallery of the salon

## Admin

The salon owner keeps prices, offers and opening hours up to date in a password-protected admin page. Changes show without a redeploy: right away while signed in, for visitors within a minute (the Impressum within ten).

## Development

```sh
# start the local database and auth, then the site
# (add an admin user at http://localhost:4000/auth; data is kept on exit)
pnpm firebase:emulators
pnpm dev

# before pushing: lint, format and type check
pnpm validate
```

## Deploys

A merge to main deploys; `pnpm release` does the same by hand. Assets go to Firebase Hosting. Everything else is rewritten to the Astro server on Cloud Run, which renders every page on request. The Hosting CDN keeps the public pages for a short while, set in [cacheControl.ts](src/infrastructure/cacheControl.ts). Both halves come from the same build.

| Topic                    | Where                                  |
| ------------------------ | -------------------------------------- |
| Cloud Run one-time setup | [docs/cloud-run.md](docs/cloud-run.md) |
| Error reporting setup    | [docs/sentry.md](docs/sentry.md)       |
