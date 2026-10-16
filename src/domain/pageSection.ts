const all = ['hours', 'prices', 'offers'] as const;

/** A part of the start page the admin can take off the page */
export type PageSection = (typeof all)[number];

const is = (value: unknown): value is PageSection =>
  all.includes(value as PageSection);

export const PageSection = { all, is };
