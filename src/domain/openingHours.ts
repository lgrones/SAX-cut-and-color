import { z } from 'astro/zod';

/** The opening hours of one weekday. `index` is its place in the week, Monday 0 */
export interface OpeningHours {
  index: number;
  day: string;
  closed: boolean;
  timeAmStart?: string;
  timeAmEnd?: string;
  timePmStart?: string;
  timePmEnd?: string;
}

const weekdays = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag',
] as const;

/** Every weekday, Monday first. A day nothing is stored for is closed. */
const week = (stored: OpeningHours[]): OpeningHours[] =>
  weekdays.map((day, index) => ({
    closed: true,
    ...stored.find(x => x.index === index),
    day,
    index,
  }));

/**
 * The opening time ranges of a day, none if it is closed. Skips a half day
 * without both times.
 */
const ranges = (day: OpeningHours): [string, string][] =>
  day.closed
    ? []
    : [
        [day.timeAmStart, day.timeAmEnd],
        [day.timePmStart, day.timePmEnd],
      ].filter((range): range is [string, string] => !!range[0] && !!range[1]);

// Times are `HH:MM`, so they compare as strings. The checks run in this order
// and the first that fails names the problem.
const times = z
  .object({
    timeAmStart: z.string().optional(),
    timeAmEnd: z.string().optional(),
    timePmStart: z.string().optional(),
    timePmEnd: z.string().optional(),
  })
  .refine(
    x => !!x.timeAmStart && !!x.timeAmEnd,
    'Vormittag braucht Beginn und Ende',
  )
  .refine(
    x => !x.timeAmStart || !x.timeAmEnd || x.timeAmEnd > x.timeAmStart,
    'Vormittag endet vor dem Beginn',
  )
  .refine(
    x => !x.timePmStart === !x.timePmEnd,
    'Nachmittag braucht Beginn und Ende',
  )
  .refine(
    x => !x.timePmStart || !x.timePmEnd || x.timePmEnd > x.timePmStart,
    'Nachmittag endet vor dem Beginn',
  )
  .refine(
    x => !x.timePmStart || !x.timeAmEnd || x.timePmStart >= x.timeAmEnd,
    'Nachmittag beginnt vor Mittag',
  );

/**
 * Why the times of a day can't be saved, if they can't. The morning is
 * required, the afternoon optional.
 */
const problem = (day: OpeningHours): string | undefined =>
  day.closed ? undefined : times.safeParse(day).error?.issues[0]?.message;

/** Whether the salon is open on any day of the week */
const anyOpen = (week: OpeningHours[]): boolean =>
  week.some(day => ranges(day).length > 0);

// The salon's clock, whatever time zone the server runs in
const timeZone = 'Europe/Vienna';
const weekdayFormat = new Intl.DateTimeFormat('en-US', {
  timeZone,
  weekday: 'short',
});

const shortWeekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** The place in the week of the salon's current day, Monday 0 */
const todayIndex = (now: Date): number =>
  shortWeekdays.indexOf(weekdayFormat.format(now));

export const OpeningHours = {
  weekdays,
  week,
  ranges,
  anyOpen,
  problem,
  todayIndex,
};
