# Sentry setup

Errors from the browser and the server go to Sentry. The browser posts its
reports to `/api/relay` on our own domain, which forwards them, so ad blockers
let them through and Sentry never sees a visitor's IP address. The SDK options
in [sentryOptions.ts](../src/infrastructure/sentryOptions.ts) collect no
personal data; the privacy policy describes this, so keep the two in step.

Sentry is off in dev and in any build without `SENTRY_DSN`.

## 1. Create the project

Create an Astro project in an organization in the **EU data region**
(`*.ingest.de.sentry.io`). In the project settings, under Security & Privacy:

- turn on **Prevent Storing of IP Addresses**
- keep **Data Scrubber** and **Use Default Scrubbers** on

## 2. Give CI the build settings

In the GitHub repository, under Settings → Secrets and variables → Actions:

| Name                | Kind     | Value                                        |
| ------------------- | -------- | -------------------------------------------- |
| `SENTRY_DSN`        | variable | the project's DSN                            |
| `SENTRY_ORG`        | variable | the organization slug                        |
| `SENTRY_PROJECT`    | variable | the project slug                             |
| `SENTRY_AUTH_TOKEN` | secret   | an organization token, to upload source maps |

The DSN is baked into both bundles at build time, so Cloud Run needs nothing.
For `pnpm release` by hand, put `SENTRY_DSN` in `.env` and export the other
three in the shell; the source map upload reads them before `.env` is loaded.
