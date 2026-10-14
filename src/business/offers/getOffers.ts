import type { Offer } from '@domain/offer';
import { Firebase } from '@services/firebase';

import { mapOffer } from './mapOffer';

/** All offers, in the order the admin set */
export const getOffers = async (): Promise<Offer[]> => {
  const documents = await Firebase.getDocuments('offers');

  return documents.map(mapOffer).toSorted((a, b) => a.index - b.index);
};
