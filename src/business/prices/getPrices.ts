import type { Price } from '@domain/price';
import { Collection, Firebase } from '@services/firebase';

import { mapPrice } from './mapPrice';

/** All price categories, in the order the admin set */
export const getPrices = async (): Promise<Price[]> => {
  const documents = await Firebase.getDocuments(Collection.prices);

  return documents.map(mapPrice).toSorted((a, b) => a.index - b.index);
};
