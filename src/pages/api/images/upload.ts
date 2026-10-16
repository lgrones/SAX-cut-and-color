import { uploadImage } from '@business/images/uploadImage';
import { withOriginal } from '@business/images/withOriginals';
import { Sentry } from '@services/sentry';
import type { APIRoute } from 'astro';

/** Takes one photo as `image` in a multipart form */
export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData().catch(() => undefined);
    const file = form?.get('image');

    if (!(file instanceof File)) {
      return Response.json({ message: 'Kein Bild erhalten' }, { status: 400 });
    }

    const result = await uploadImage(new Uint8Array(await file.arrayBuffer()));

    return result.ok
      ? Response.json(withOriginal(result.image))
      : Response.json({ message: result.message }, { status: 400 });
  } catch (error) {
    Sentry.reportError('images', error);

    return Response.json(
      { message: 'Hochladen fehlgeschlagen' },
      { status: 500 },
    );
  }
};
