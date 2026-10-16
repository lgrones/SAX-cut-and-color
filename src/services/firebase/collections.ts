/** The Firestore collections the app keeps its content in */
export const Collection = {
  offers: 'offers',
  openingHours: 'openingHours',
  prices: 'prices',
  images: 'images',
  settings: 'settings',
} as const;

export type Collection = (typeof Collection)[keyof typeof Collection];

/** A document stored under an id of its own choosing */
export interface FixedDocument {
  collection: Collection;
  id: string;
}

export const FixedDocument = {
  contact: { collection: Collection.settings, id: 'contact' },
  sections: { collection: Collection.settings, id: 'sections' },
  images: { collection: Collection.images, id: 'site' },
} satisfies Record<string, FixedDocument>;
