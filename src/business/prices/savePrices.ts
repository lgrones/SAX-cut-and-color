import { Price, PriceItem } from '@domain/price';
import { Collection, Firebase } from '@services/firebase';
import { z } from 'astro/zod';

import { getPrices } from './getPrices';

const item = z.object({
  title: z.string(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  salon: z.boolean().optional(),
});

// The whole list in its new order. A category without an id is new.
const schema = z.array(
  z.object({
    id: z.string().min(1).optional(),
    mainTitle: z.string(),
    prices: z.array(item),
  }),
);

export type SavePricesResult =
  | { ok: true; prices: Price[] }
  | { ok: false; message: string };

// Only what the item's kind needs, Firestore rejects undefined fields
const storedItem = ({
  title,
  priceMin,
  priceMax,
  salon,
}: z.infer<typeof item>): PriceItem =>
  salon
    ? { title: title.trim(), salon: true }
    : {
        title: title.trim(),
        ...(priceMin !== undefined && { priceMin }),
        ...(priceMax !== undefined && { priceMax }),
      };

/**
 * Replaces the stored categories with the admin's list: what is missing from it
 * is deleted. Returns the categories as now stored.
 */
export const savePrices = async (input: unknown): Promise<SavePricesResult> => {
  const parsed = schema.safeParse(input);

  if (!parsed.success) return { ok: false, message: 'Ungültige Eingabe' };

  const categories = parsed.data.map(({ id, mainTitle, prices }) => ({
    id,
    mainTitle,
    prices: prices.map(storedItem),
  }));

  const problem =
    categories.map(Price.problem).find(x => x) ??
    categories
      .flatMap(x => x.prices)
      .map(PriceItem.problem)
      .find(x => x);
  if (problem) return { ok: false, message: problem };

  const kept = new Set(categories.map(x => x.id));

  for (const { id } of await getPrices()) {
    if (!kept.has(id)) await Firebase.deleteDocument(Collection.prices, id);
  }

  for (const [index, { id, mainTitle, prices }] of categories.entries()) {
    const data = { mainTitle: mainTitle.trim(), index, prices };

    if (id) await Firebase.updateDocument(Collection.prices, id, data);
    else await Firebase.addDocument(Collection.prices, data);
  }

  return { ok: true, prices: await getPrices() };
};
