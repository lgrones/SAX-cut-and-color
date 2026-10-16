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
];

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

/**
 * Why the times of a day can't be saved, if they can't. The morning is
 * required, the afternoon optional. Times are `HH:MM`, so they compare as
 * strings.
 */
const problem = (day: OpeningHours): string | undefined => {
  if (day.closed) return undefined;

  const { timeAmStart, timeAmEnd, timePmStart, timePmEnd } = day;

  if (!timeAmStart || !timeAmEnd) return 'Vormittag braucht Beginn und Ende';
  if (timeAmEnd <= timeAmStart) return 'Vormittag endet vor dem Beginn';

  if (!timePmStart && !timePmEnd) return undefined;
  if (!timePmStart || !timePmEnd) return 'Nachmittag braucht Beginn und Ende';
  if (timePmEnd <= timePmStart) return 'Nachmittag endet vor dem Beginn';
  if (timePmStart < timeAmEnd) return 'Nachmittag beginnt vor Mittag';

  return undefined;
};

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

export const OpeningHours = { weekdays, week, ranges, problem, todayIndex };
