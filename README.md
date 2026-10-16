<div align="center">
  <img src="docs/assets/wordmark.svg" alt="SAX Cut + Colour" width="492">
  <p><em>Website of SAX Cut + Colour, a hair salon in Lochau, Austria.</em></p>
  <p>
    <img alt="Astro" src="https://img.shields.io/badge/Astro-BC52EE?logo=astro&logoColor=white">
    <img alt="Cloud Run" src="https://img.shields.io/badge/Cloud_Run-4285F4?logo=googlecloud&logoColor=white">
  </p>
  <p>
    <a href="https://www.sax-cut-and-colour.at"><b>www.sax-cut-and-colour.at</b></a> · <a href="#development">Development</a> · <a href="#deploys">Deploys</a>
  </p>
</div>

## The site

A one-page website for a small hair salon. Visitors find everything they need to book an appointment on a single scroll:

- Today's opening hours up top, the full week further down
- Prices for cuts, colour and care
- Current offers and promotions
- Photos of the salon
- Contact details, a map and a link to directions

An Impressum and a privacy policy sit behind the footer, written for Austrian law.

## Admin

The salon owner keeps prices, offers, opening hours, photos and contact details up to date in a password-protected admin area. Prices, offers and opening hours can also be taken off the page. Changes show without a redeploy: right away while signed in, for visitors within a minute. The legal pages follow within ten.

## Development

```sh
# start the local database and auth, then the site
# (add an admin user at http://localhost:4000/auth; data is kept on exit)
pnpm firebase:emulators
pnpm dev

# to try the site on a phone in the same network (opens the firewall port)
pnpm dev:mobile

# before pushing: lint, format and type check
pnpm validate
```

## Deploys

A merge to main deploys; `pnpm release` does the same by hand. Assets go to Firebase Hosting. Everything else is rewritten to the Astro server on Cloud Run, which renders every page on request. The Hosting CDN keeps the public pages for a short while, set in [cacheControl.ts](src/infrastructure/cacheControl.ts). Both halves come from the same build.

| Topic                    | Where                                  |
| ------------------------ | -------------------------------------- |
| Cloud Run one-time setup | [docs/cloud-run.md](docs/cloud-run.md) |
| Error reporting setup    | [docs/sentry.md](docs/sentry.md)       |
