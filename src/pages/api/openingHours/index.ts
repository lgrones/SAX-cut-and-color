import { saveOpeningHours } from '@business/openingHours/saveOpeningHours';
import { readFormEntries } from '@infrastructure/readFormEntries';
import type { APIRoute } from 'astro';
import { error as logError } from 'firebase-functions/logger';

export const prerender = false;

export const POST: APIRoute = async ({ redirect, request }) => {
  try {
    await saveOpeningHours(await readFormEntries(request));
  } catch (error) {
    logError('times', error);
    return new Response('Something went wrong', { status: 500 });
  }

  return redirect('/admin#times');
};
