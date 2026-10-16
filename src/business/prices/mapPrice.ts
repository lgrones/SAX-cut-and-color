import type { Price } from '@domain/price';
import type { FirestoreDocument } from '@services/firebase';

export const mapPrice = ({ id, data }: FirestoreDocument): Price => ({
  ...(data as Omit<Price, 'id'>),
  id,
});
