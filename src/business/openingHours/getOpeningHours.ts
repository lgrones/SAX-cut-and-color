import { OpeningHours } from '@domain/openingHours';
import { Firebase } from '@services/firebase';

import { mapOpeningHours } from './mapOpeningHours';

/** The opening hours of every weekday, Monday first */
export const getOpeningHours = async (): Promise<OpeningHours[]> => {
  const documents = await Firebase.getDocuments('openingHours');

  return OpeningHours.week(documents.map(mapOpeningHours));
};
