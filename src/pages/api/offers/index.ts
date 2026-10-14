import { saveOffers } from '@business/offers/saveOffers';
import { readFormEntries } from '@infrastructure/readFormEntries';
import type { APIRoute } from 'astro';
import { error as logError } from 'firebase-functions/logger';

export const prerender = false;

export const POST: APIRoute = async ({ redirect, request }) => {
  try {
    await saveOffers(await readFormEntries(request));
  } catch (error) {
    logError('offers', error);
    return new Response('Something went wrong', { status: 500 });
  }

  return redirect('/admin#offers');
};
