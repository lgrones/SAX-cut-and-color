import type { APIRoute } from 'astro';
import { getFirestore } from 'firebase-admin/firestore';
import { error as logError } from 'firebase-functions/logger';

import { app } from '../../../firebase/server';
import { readFormEntries } from '../../../utils/formEntries';

export const prerender = false;
// import data from "../../../../backups/prices.json";

const db = getFirestore(app);
const ref = db.collection('prices');

// const populate = () => {
//   for (const d of data) {
//     ref.add(d);
//   }
// };

type Fields = Record<string, string | number | boolean>;

const hasDelete = (fields: Fields) =>
  Object.keys(fields).some(x => x.includes('delete'));

const parsePriceField = (field: string, value: string) => {
  if (field === 'title') return value;
  if (field.includes('price')) return parseFloat(value) || '';
  return value === 'on';
};

export const POST: APIRoute = async ({ redirect, request }) => {
  // populate();
  // return redirect("/admin#prices");

  const blocks = new Map<string, { fields: Fields; prices?: Fields[] }>();

  for (const [key, value] of await readFormEntries(request)) {
    const [id, field, index] = key.split('-');
    if (!id || !field) continue;

    const block = blocks.get(id) ?? { fields: {} };
    blocks.set(id, block);

    if (index) {
      const i = parseInt(index);
      block.prices ??= [];
      block.prices[i] = {
        ...block.prices[i],
        [field]: parsePriceField(field, value),
      };
    } else {
      block.fields[field] = value;
    }
  }

  for (const [id, { fields, prices }] of blocks) {
    if (hasDelete(fields) && id.startsWith('new')) continue;

    const data = prices
      ? { ...fields, prices: prices.filter(x => !hasDelete(x)) }
      : fields;

    try {
      if (id.startsWith('new')) {
        await ref.add(data);
      } else if (hasDelete(fields)) {
        await ref.doc(id).delete();
      } else {
        await ref.doc(id).update(data);
      }
    } catch (error) {
      logError('prices', error);

      return new Response('Something went wrong', { status: 500 });
    }
  }

  return redirect('/admin#prices');
};
