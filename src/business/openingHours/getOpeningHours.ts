import { OpeningHours } from '@domain/openingHours';
import { Collection, Firebase } from '@services/firebase';

import { mapOpeningHours } from './mapOpeningHours';

/** The opening hours of every weekday, Monday first */
export const getOpeningHours = async (): Promise<OpeningHours[]> => {
  const documents = await Firebase.getDocuments(Collection.openingHours);

  return OpeningHours.week(documents.map(mapOpeningHours));
};
