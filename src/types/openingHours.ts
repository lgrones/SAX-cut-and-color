export interface OpeningHours {
  index: number;
  day: string;
  closed: boolean;
  timeAmStart?: string;
  timeAmEnd?: string;
  timePmStart?: string;
  timePmEnd?: string;
}
