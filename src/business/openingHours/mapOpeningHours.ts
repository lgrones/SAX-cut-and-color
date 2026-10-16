import type { OpeningHours } from '@domain/openingHours';
import type { FirestoreDocument } from '@services/firebase';

export const mapOpeningHours = ({ data }: FirestoreDocument): OpeningHours =>
  data as unknown as OpeningHours;
