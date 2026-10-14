import type { Price, PriceItem } from '@domain/price';
import type { FirestoreDocument } from '@services/firebase';

// The old admin form stored `index` as a string and an empty price as `''`

const amount = (value: unknown): number | undefined => {
  const number = typeof value === 'string' ? parseFloat(value) : value;
  return typeof number === 'number' && number > 0 ? number : undefined;
};

const mapItem = (value: unknown): PriceItem => {
  const item = (value ?? {}) as Record<string, unknown>;
  const priceMin = amount(item.priceMin);
  const priceMax = amount(item.priceMax);

  return {
    title: typeof item.title === 'string' ? item.title : '',
    ...(priceMin !== undefined && { priceMin }),
    ...(priceMax !== undefined && { priceMax }),
    ...(item.salon === true && { salon: true }),
  };
};

export const mapPrice = ({
  id,
  data: { index, mainTitle, prices },
}: FirestoreDocument): Price => ({
  id,
  mainTitle: typeof mainTitle === 'string' ? mainTitle : '',
  index: Number(index),
  prices: Array.isArray(prices) ? prices.map(mapItem) : [],
});
