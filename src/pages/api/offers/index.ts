import { saveOffers } from '@business/offers/saveOffers';
import { captureException } from '@sentry/astro';
import type { APIRoute } from 'astro';
import { error as logError } from 'firebase-functions/logger';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // malformed JSON fails validation like any other bad input
    const body: unknown = await request.json().catch(() => undefined);
    const result = await saveOffers(body);

    return result.ok
      ? Response.json(result.offers)
      : Response.json({ message: result.message }, { status: 400 });
  } catch (error) {
    logError('offers', error);
    captureException(error);
    return Response.json(
      { message: 'Speichern fehlgeschlagen' },
      { status: 500 },
    );
  }
};
