import { Price, PriceItem } from '@domain/price';
import { Firebase } from '@services/firebase';
import { z } from 'astro/zod';

import { getPrices } from './getPrices';

const item = z.object({
  title: z.string(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  salon: z.boolean().optional(),
});

// The whole list in its new order. A category without an id is new. Deletions
// are explicit, so a category added elsewhere since the list was loaded survives.
const schema = z.object({
  categories: z.array(
    z.object({
      id: z.string().min(1).optional(),
      mainTitle: z.string(),
      prices: z.array(item),
    }),
  ),
  deleted: z.array(z.string().min(1)),
});

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

/** Applies the admin's list and returns all categories as now stored */
export const savePrices = async (input: unknown): Promise<SavePricesResult> => {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Ungültige Eingabe' };

  const { deleted } = parsed.data;
  const categories = parsed.data.categories.map(
    ({ id, mainTitle, prices }) => ({
      id,
      mainTitle,
      prices: prices.map(storedItem),
    }),
  );

  if (categories.some(x => x.id && deleted.includes(x.id))) {
    return { ok: false, message: 'Ungültige Eingabe' };
  }

  const problem =
    categories.map(Price.problem).find(x => x) ??
    categories
      .flatMap(x => x.prices)
      .map(PriceItem.problem)
      .find(x => x);
  if (problem) return { ok: false, message: problem };

  for (const id of deleted) {
    await Firebase.deleteDocument('prices', id);
  }

  for (const [index, { id, mainTitle, prices }] of categories.entries()) {
    const data = { mainTitle: mainTitle.trim(), index, prices };

    if (id) await Firebase.updateDocument('prices', id, data);
    else await Firebase.addDocument('prices', data);
  }

  return { ok: true, prices: await getPrices() };
};
