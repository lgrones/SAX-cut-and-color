import { Offer } from '@domain/offer';
import { Collection, Firebase } from '@services/firebase';
import { z } from 'astro/zod';

import { getOffers } from './getOffers';

// The whole list in its new order. An offer without an id is new.
const schema = z.array(
  z.object({
    id: z.string().min(1).optional(),
    title: z.string(),
    kind: z.string(),
    text: z.string(),
  }),
);

export type SaveOffersResult =
  | { ok: true; offers: Offer[] }
  | { ok: false; message: string };

/**
 * Replaces the stored offers with the admin's list: what is missing from it is
 * deleted. Returns the offers as now stored.
 */
export const saveOffers = async (input: unknown): Promise<SaveOffersResult> => {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Ungültige Eingabe' };

  const offers = parsed.data;
  const problem = offers.map(Offer.problem).find(x => x);
  if (problem) return { ok: false, message: problem };

  const kept = new Set(offers.map(x => x.id));

  for (const { id } of await getOffers()) {
    if (!kept.has(id)) await Firebase.deleteDocument(Collection.offers, id);
  }

  for (const [index, { id, title, kind, text }] of offers.entries()) {
    const data = {
      title: title.trim(),
      kind: kind.trim(),
      text: text.trim(),
      index,
    };

    if (id) await Firebase.updateDocument(Collection.offers, id, data);
    else await Firebase.addDocument(Collection.offers, data);
  }

  return { ok: true, offers: await getOffers() };
};
