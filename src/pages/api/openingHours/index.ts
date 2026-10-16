import { saveOpeningHours } from '@business/openingHours/saveOpeningHours';
import { captureException } from '@sentry/astro';
import type { APIRoute } from 'astro';
import { error as logError } from 'firebase-functions/logger';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // malformed JSON fails validation like any other bad input
    const body: unknown = await request.json().catch(() => undefined);
    const result = await saveOpeningHours(body);

    return result.ok
      ? new Response(null, { status: 204 })
      : Response.json({ message: result.message }, { status: 400 });
  } catch (error) {
    logError('times', error);
    captureException(error);
    return Response.json(
      { message: 'Speichern fehlgeschlagen' },
      { status: 500 },
    );
  }
};
