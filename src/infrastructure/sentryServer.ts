import { SENTRY_OPTIONS } from '@infrastructure/sentryOptions';
import { init } from '@sentry/astro';

init(SENTRY_OPTIONS);
