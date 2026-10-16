import { originalUrl } from '@business/images/imageFiles';
import { uploadImage } from '@business/images/uploadImage';
import type { APIRoute } from 'astro';
import { error as logError } from 'firebase-functions/logger';

export const prerender = false;

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
      ? Response.json({ ...result.image, src: originalUrl(result.image.id) })
      : Response.json({ message: result.message }, { status: 400 });
  } catch (error) {
    logError('images', error);
    return Response.json(
      { message: 'Hochladen fehlgeschlagen' },
      { status: 500 },
    );
  }
};
