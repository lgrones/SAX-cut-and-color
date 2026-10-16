import type { Price } from '@domain/price';
import { Firebase } from '@services/firebase';

import { mapPrice } from './mapPrice';

// Categories on the same place, e.g. several old ones without any, keep a fixed
// order by id
const byPlace = (a: Price, b: Price) =>
  a.index === b.index ? (a.id < b.id ? -1 : 1) : a.index < b.index ? -1 : 1;

/**
 * All price categories, in the order the admin set, numbered from 0. Old ones
 * without a place come last.
 */
export const getPrices = async (): Promise<Price[]> => {
  const documents = await Firebase.getDocuments('prices');

  return documents
    .map(mapPrice)
    .toSorted(byPlace)
    .map((price, index) => ({ ...price, index }));
};
