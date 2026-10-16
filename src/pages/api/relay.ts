import { Sentry } from '@services/sentry';
import type { APIRoute } from 'astro';

// An error report with its stack trace stays far below this
const MAX_ENVELOPE_BYTES = 1024 * 1024;

/** Sentry's tunnel: the browser's error reports, passed on to Sentry */
export const POST: APIRoute = async ({ request }) => {
  const envelope = new Uint8Array(await request.arrayBuffer());

  if (envelope.byteLength > MAX_ENVELOPE_BYTES) {
    return new Response(null, { status: 413 });
  }

  const response = await Sentry.forwardEnvelope(envelope);

  return response ?? new Response(null, { status: 400 });
};
