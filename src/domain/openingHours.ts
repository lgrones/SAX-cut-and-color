export interface OpeningHours {
  id: string;
  index: number;
  day: string;
  closed: boolean;
  timeAmStart?: string;
  timeAmEnd?: string;
  timePmStart?: string;
  timePmEnd?: string;
}

/** The opening time ranges of a day, skipping a half day without both times */
const ranges = (day: OpeningHours): [string, string][] =>
  [
    [day.timeAmStart, day.timeAmEnd],
    [day.timePmStart, day.timePmEnd],
  ].filter((range): range is [string, string] => !!range[0] && !!range[1]);

export const OpeningHours = { ranges };
