import type { Offer } from '@domain/offer';
import type { FirestoreDocument } from '@services/firebase';

// The admin form stores `index` as a string
export const mapOffer = ({
  id,
  data: { index, ...data },
}: FirestoreDocument): Offer => ({
  ...(data as Omit<Offer, 'id' | 'index'>),
  id,
  index: Number(index),
});
