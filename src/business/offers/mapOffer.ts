import type { Offer } from '@domain/offer';
import type { FirestoreDocument } from '@services/firebase';

// The old admin form stored `index` as a string and had no `kind`
export const mapOffer = ({
  id,
  data: { index, kind, ...data },
}: FirestoreDocument): Offer => ({
  ...(data as Omit<Offer, 'id' | 'index' | 'kind'>),
  id,
  kind: typeof kind === 'string' ? kind : '',
  index: Number(index),
});
