import { saveImages } from '@business/images/saveImages';
import { captureException } from '@sentry/astro';
import type { APIRoute } from 'astro';
import { error as logError } from 'firebase-functions/logger';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // malformed JSON fails validation like any other bad input
    const body: unknown = await request.json().catch(() => undefined);
    const result = await saveImages(body);

    return result.ok
      ? Response.json(result.images)
      : Response.json({ message: result.message }, { status: 400 });
  } catch (error) {
    logError('images', error);
    captureException(error);
    return Response.json(
      { message: 'Speichern fehlgeschlagen' },
      { status: 500 },
    );
  }
};
