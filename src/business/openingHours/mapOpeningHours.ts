import type { OpeningHours } from '@domain/openingHours';
import type { FirestoreDocument } from '@services/firebase';

// The admin form stores `index` as a string
export const mapOpeningHours = ({
  id,
  data: { index, ...data },
}: FirestoreDocument): OpeningHours => ({
  ...(data as Omit<OpeningHours, 'id' | 'index'>),
  id,
  index: Number(index),
});
