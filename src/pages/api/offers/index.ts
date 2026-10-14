import type { APIRoute } from 'astro';
import { getFirestore } from 'firebase-admin/firestore';
import { error as logError } from 'firebase-functions/logger';

import { app } from '../../../firebase/server';
import { readFormEntries } from '../../../utils/formEntries';

export const prerender = false;
// import data from "../../../../backups/offers.json";

const db = getFirestore(app);
const ref = db.collection('offers');

// const populate = () => {
//   for (const d of data) {
//     ref.add(d);
//   }
// };

export const POST: APIRoute = async ({ redirect, request }) => {
  // populate();
  // return redirect("/admin#offers");

  const offers = new Map<string, Record<string, string>>();

  for (const [key, value] of await readFormEntries(request)) {
    const [id, field] = key.split('-');
    if (!id || !field) continue;

    offers.set(id, { ...offers.get(id), [field]: value });
  }

  const validOffers = [...offers].filter(
    ([id, data]) =>
      !id.startsWith('new') ||
      !Object.keys(data).find(x => x.includes('delete')),
  );

  for (const [id, data] of validOffers) {
    try {
      if (id.startsWith('new')) {
        await ref.add(data);
      } else if (Object.keys(data).find(x => x.includes('delete'))) {
        await ref.doc(id).delete();
      } else {
        await ref.doc(id).update(data);
      }
    } catch (error) {
      logError('offers', 'id', id, 'data', data, error);
      return new Response('Something went wrong', { status: 500 });
    }
  }

  return redirect('/admin#offers');
};
