import { captureException } from '@sentry/astro';

/**
 * Sends a failure to Sentry, tagged with the `area` it happened in. Dropped
 * while no DSN is set.
 */
export const reportError = (area: string, error: unknown) => {
  captureException(error, { tags: { area } });
};
