import type { APIRoute } from 'astro';
import { getFirestore } from 'firebase-admin/firestore';
import { error as logError } from 'firebase-functions/logger';

import { app } from '../../../firebase/server';
import { readFormEntries } from '../../../utils/formEntries';

export const prerender = false;
// import data from "../../../../backups/openingHours.json";

const db = getFirestore(app);
const ref = db.collection('openingHours');

// const populate = () => {
//   for (const d of data) {
//     ref.add(d);
//   }
// };

export const POST: APIRoute = async ({ redirect, request }) => {
  // populate();
  // return redirect("/admin#times");

  const days = new Map<string, Record<string, string | boolean>>();

  for (const [key, value] of await readFormEntries(request)) {
    const [id, field] = key.split('-');
    if (!id || !field) continue;

    days.set(id, {
      ...days.get(id),
      [field]: field === 'closed' ? value === 'on' : value,
    });
  }

  for (const [id, data] of days) {
    try {
      // unchecked checkboxes are not submitted
      await ref.doc(id).update({ closed: false, ...data });
    } catch (error) {
      logError('times', error);
      return new Response('Something went wrong', { status: 500 });
    }
  }

  return redirect('/admin#times');
};
