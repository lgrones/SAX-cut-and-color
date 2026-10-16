const names = { hours: 'hours', prices: 'prices', offers: 'offers' } as const;

/** A part of the start page the admin can take off the page */
export type PageSection = (typeof names)[keyof typeof names];

const all = Object.values(names);

export const PageSection = { ...names, all };
