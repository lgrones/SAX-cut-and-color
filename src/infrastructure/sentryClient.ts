import { SENTRY_OPTIONS, SENTRY_TUNNEL } from '@infrastructure/sentryOptions';
import { init } from '@sentry/astro';

init({
  ...SENTRY_OPTIONS,
  tunnel: SENTRY_TUNNEL,
  // A request per error, not per page view, and no language or time zone
  integrations: defaults =>
    defaults.filter(
      ({ name }) => name !== 'BrowserSession' && name !== 'CultureContext',
    ),
});
