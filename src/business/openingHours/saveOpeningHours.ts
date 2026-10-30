import { OpeningHours } from '@domain/openingHours';
import { Collection, Firebase } from '@services/firebase';
import { z } from 'astro/zod';

import { mapOpeningHours } from './mapOpeningHours';

const time = z.union([
  z.literal(''),
  z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
]);

// One entry per weekday, Monday first. Only the times are editable, a day's
// name and place in the week are fixed.
const schema = z
  .array(
    z.object({
      closed: z.boolean(),
      timeAmStart: time,
      timeAmEnd: time,
      timePmStart: time,
      timePmEnd: time,
    }),
  )
  .length(OpeningHours.weekdays.length);

export type SaveOpeningHoursResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Saves the times the admin set for each weekday, adding the days nothing is
 * stored for yet. Empty times are stored as `''`.
 */
export const saveOpeningHours = async (
  input: unknown,
): Promise<SaveOpeningHoursResult> => {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Ungültige Eingabe' };

  const week = OpeningHours.week(
    parsed.data.map((times, index) => ({ ...times, index, day: '' })),
  );

  const problem = week.map(OpeningHours.problem).find(x => x);
  if (problem) return { ok: false, message: problem };

  const documents = await Firebase.getDocuments(Collection.openingHours);
  const stored = new Map(
    documents.map(x => [mapOpeningHours(x).index, x.id] as const),
  );

  for (const day of week) {
    const id = stored.get(day.index);

    if (id) {
      const { day: _day, index: _index, ...times } = day;
      await Firebase.updateDocument(Collection.openingHours, id, times);
    } else {
      await Firebase.addDocument(Collection.openingHours, day);
    }
  }

  return { ok: true };
};
