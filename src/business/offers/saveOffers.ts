import { Offer } from '@domain/offer';
import { Firebase } from '@services/firebase';
import { z } from 'astro/zod';

import { getOffers } from './getOffers';

// The whole list in its new order. An offer without an id is new. Deletions
// are explicit, so an offer added elsewhere since the list was loaded survives.
const schema = z.object({
  offers: z.array(
    z.object({
      id: z.string().min(1).optional(),
      title: z.string(),
      kind: z.string(),
      text: z.string(),
    }),
  ),
  deleted: z.array(z.string().min(1)),
});

export type SaveOffersResult =
  | { ok: true; offers: Offer[] }
  | { ok: false; message: string };

/** Applies the admin's list and returns all offers as now stored */
export const saveOffers = async (input: unknown): Promise<SaveOffersResult> => {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Ungültige Eingabe' };

  const { offers, deleted } = parsed.data;

  if (offers.some(x => x.id && deleted.includes(x.id))) {
    return { ok: false, message: 'Ungültige Eingabe' };
  }

  const problem = offers.map(Offer.problem).find(x => x);
  if (problem) return { ok: false, message: problem };

  for (const id of deleted) {
    await Firebase.deleteDocument('offers', id);
  }

  for (const [index, { id, title, kind, text }] of offers.entries()) {
    const data = {
      title: title.trim(),
      kind: kind.trim(),
      text: text.trim(),
      index,
    };

    if (id) await Firebase.updateDocument('offers', id, data);
    else await Firebase.addDocument('offers', data);
  }

  return { ok: true, offers: await getOffers() };
};
