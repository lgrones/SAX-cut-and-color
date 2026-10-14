import type { OpeningHours } from '@domain/openingHours';
import type { FirestoreDocument } from '@services/firebase';

// The old admin form stored `index` as a string
export const mapOpeningHours = ({
  data: { index, ...data },
}: FirestoreDocument): OpeningHours => ({
  ...(data as Omit<OpeningHours, 'index'>),
  index: Number(index),
});
