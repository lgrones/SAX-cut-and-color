/** Where an image's subject is, as fractions of its width and height */
export interface Focus {
  x: number;
  y: number;
}

/** An uploaded image. `id` names its stored original. */
export interface SiteImage {
  id: string;
  width: number;
  height: number;
  focus: Focus;
}

/** A gallery image, described for screen readers and search */
export interface GalleryImage extends SiteImage {
  alt: string;
}

/** A fixed place on the page that shows one image */
export const ImageSlot = {
  hero: 'hero',
  portrait: 'portrait',
  map: 'map',
} as const;

export type ImageSlot = (typeof ImageSlot)[keyof typeof ImageSlot];

const slotNames = Object.values(ImageSlot);

/** The images of the page: the fixed slots and a gallery in display order */
export type SiteImages = Partial<Record<ImageSlot, SiteImage>> & {
  gallery: GalleryImage[];
};

/**
 * The fixed slots as the page design shows them: aspect is width / height. The
 * page leaves out any slot without an image. Only an optional slot's image can
 * be taken off again; a required one, once set, can only be replaced.
 */
const slots: Record<
  ImageSlot,
  { label: string; alt: string; aspect: number; optional: boolean }
> = {
  hero: {
    label: 'Startbild',
    alt: 'Im Salon SAX Cut + Colour',
    aspect: 4 / 5,
    optional: false,
  },
  portrait: { label: 'Porträt', alt: 'Petra Otti', aspect: 1, optional: false },
  map: {
    label: 'Karte',
    alt: 'Karte mit dem Weg zum Salon',
    aspect: 8 / 5,
    optional: true,
  },
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/**
 * The largest crop of the given aspect, placed the way CSS `object-fit: cover`
 * with `object-position: <focus>` places it. A stored crop then looks exactly
 * like the preview.
 */
const crop = (image: SiteImage, aspect: number) => {
  const width = Math.min(image.width, image.height * aspect);
  const height = width / aspect;

  return {
    left: Math.round(clamp(image.focus.x) * (image.width - width)),
    top: Math.round(clamp(image.focus.y) * (image.height - height)),
    width: Math.round(width),
    height: Math.round(height),
  };
};

/** The focus as a CSS `object-position` */
const objectPosition = ({ x, y }: Focus) =>
  `${Math.round(clamp(x) * 100)}% ${Math.round(clamp(y) * 100)}%`;

/** Why a gallery image can't be saved, if it can't */
const problem = (image: Pick<GalleryImage, 'alt'>): string | undefined =>
  image.alt.trim() ? undefined : 'Bildbeschreibung fehlt';

export const SiteImage = { slotNames, slots, crop, objectPosition, problem };
