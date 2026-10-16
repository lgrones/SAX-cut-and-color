import { Sentry } from '@services/sentry';
import type { APIRoute } from 'astro';

export const prerender = false;

// An error report with its stack trace stays far below this
const MAX_ENVELOPE_BYTES = 1024 * 1024;

/** Sentry's tunnel: the browser's error reports, passed on to Sentry */
export const POST: APIRoute = async ({ request }) => {
  const envelope = new Uint8Array(await request.arrayBuffer());

  if (envelope.byteLength > MAX_ENVELOPE_BYTES) {
    return new Response(null, { status: 413 });
  }

  return (
    (await Sentry.forwardEnvelope(envelope)) ??
    new Response(null, { status: 400 })
  );
};
