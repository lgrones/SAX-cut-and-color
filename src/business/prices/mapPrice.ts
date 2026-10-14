import type { Price } from '@domain/price';
import type { FirestoreDocument } from '@services/firebase';

// The admin form stores `index` as a string
export const mapPrice = ({
  id,
  data: { index, ...data },
}: FirestoreDocument): Price => ({
  ...(data as Omit<Price, 'id' | 'index'>),
  id,
  index: Number(index),
});
