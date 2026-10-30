import type { Offer } from '@domain/offer';
import type { FirestoreDocument } from '@services/firebase';

export const mapOffer = ({ id, data }: FirestoreDocument): Offer => ({
  ...(data as Omit<Offer, 'id'>),
  id,
});
