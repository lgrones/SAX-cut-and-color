import { showSection } from '@business/pageSections/showSection';
import { Sentry } from '@services/sentry';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    // malformed JSON fails validation like any other bad input
    const body: unknown = await request.json().catch(() => undefined);
    const result = await showSection(body);

    return result.ok
      ? new Response(null, { status: 204 })
      : Response.json({ message: result.message }, { status: 400 });
  } catch (error) {
    Sentry.reportError('sections', error);

    return Response.json(
      { message: 'Speichern fehlgeschlagen' },
      { status: 500 },
    );
  }
};
