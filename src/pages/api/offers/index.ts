import { saveOffers } from '@business/offers/saveOffers';
import { Sentry } from '@services/sentry';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    // malformed JSON fails validation like any other bad input
    const body: unknown = await request.json().catch(() => undefined);
    const result = await saveOffers(body);

    return result.ok
      ? Response.json(result.offers)
      : Response.json({ message: result.message }, { status: 400 });
  } catch (error) {
    Sentry.reportError('offers', error);

    return Response.json(
      { message: 'Speichern fehlgeschlagen' },
      { status: 500 },
    );
  }
};
