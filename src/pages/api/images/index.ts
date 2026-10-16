import { saveImages } from '@business/images/saveImages';
import { withOriginals } from '@business/images/withOriginals';
import { Sentry } from '@services/sentry';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    // malformed JSON fails validation like any other bad input
    const body: unknown = await request.json().catch(() => undefined);
    const result = await saveImages(body);

    return result.ok
      ? Response.json(withOriginals(result.images))
      : Response.json({ message: result.message }, { status: 400 });
  } catch (error) {
    Sentry.reportError('images', error);

    return Response.json(
      { message: 'Speichern fehlgeschlagen' },
      { status: 500 },
    );
  }
};
