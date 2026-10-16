import { SENTRY_DSN } from 'astro:env/client';

const NEWLINE = 0x0a;
const decoder = new TextDecoder();

/** The DSN in the envelope's first line, its header */
const envelopeDsn = (envelope: Uint8Array): URL | undefined => {
  const end = envelope.indexOf(NEWLINE);

  try {
    const { dsn } = JSON.parse(
      decoder.decode(end === -1 ? envelope : envelope.subarray(0, end)),
    ) as { dsn?: unknown };
    return typeof dsn === 'string' ? new URL(dsn) : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Passes a browser's envelope on to Sentry, without the browser's IP address.
 * Only envelopes for our own project go through, so the tunnel is no open
 * relay; for any other it resolves to undefined.
 */
export const forwardEnvelope = async (
  envelope: Uint8Array<ArrayBuffer>,
): Promise<Response | undefined> => {
  const dsn = envelopeDsn(envelope);
  const ours = SENTRY_DSN ? new URL(SENTRY_DSN) : undefined;

  if (
    !dsn ||
    !ours ||
    dsn.host !== ours.host ||
    dsn.pathname !== ours.pathname
  ) {
    return undefined;
  }

  // the pathname is the project id
  const upstream = await fetch(`${ours.origin}/api${ours.pathname}/envelope/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-sentry-envelope' },
    body: envelope,
  });

  // the rate limits tell the browser SDK to back off
  const headers = new Headers();
  for (const name of ['Retry-After', 'X-Sentry-Rate-Limits']) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new Response(null, { status: upstream.status, headers });
};
