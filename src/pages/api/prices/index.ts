import { savePrices } from '@business/prices/savePrices';
import { Sentry } from '@services/sentry';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    // malformed JSON fails validation like any other bad input
    const body: unknown = await request.json().catch(() => undefined);
    const result = await savePrices(body);

    return result.ok
      ? Response.json(result.prices)
      : Response.json({ message: result.message }, { status: 400 });
  } catch (error) {
    Sentry.reportError('prices', error);

    return Response.json(
      { message: 'Speichern fehlgeschlagen' },
      { status: 500 },
    );
  }
};
