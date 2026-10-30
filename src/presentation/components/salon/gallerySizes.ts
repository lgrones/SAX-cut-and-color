export type TileShape = 'wide' | 'tall' | 'regular';

/** A tile's width as CSS, the most it gets in its range, and its height */
type Tile = [width: string, widest: number, height: number];

// The tiles as galleryList.astro lays them out, widest layout first. Below
// 760px one column between the gutters (16px, 4vw from 400px); from there four
// columns of (content − 3 × 16px gap) / 4, up to the 1240px page.
const layouts: { media?: string; tiles: Record<TileShape, Tile> }[] = [
  {
    media: '(min-width: 1240px)',
    tiles: {
      wide: ['564px', 564, 536],
      tall: ['274px', 274, 536],
      regular: ['274px', 274, 260],
    },
  },
  {
    media: '(min-width: 760px)',
    tiles: {
      wide: ['calc(46vw - 8px)', 564, 536],
      tall: ['calc(23vw - 12px)', 274, 536],
      regular: ['calc(23vw - 12px)', 274, 260],
    },
  },
  {
    media: '(min-width: 400px)',
    tiles: {
      wide: ['92vw', 700, 240],
      tall: ['92vw', 700, 240],
      regular: ['92vw', 700, 240],
    },
  },
  {
    tiles: {
      wide: ['calc(100vw - 32px)', 368, 240],
      tall: ['calc(100vw - 32px)', 368, 240],
      regular: ['calc(100vw - 32px)', 368, 240],
    },
  },
];

/**
 * The `sizes` of an image shown in a tile with `object-fit: cover`. An image
 * wider than its tile fills the tile's height and overflows its width, so it
 * shows wider than the tile.
 */
export const gallerySizes = (shape: TileShape, aspect: number) =>
  layouts
    .map(({ media, tiles }) => {
      const [width, widest, height] = tiles[shape];
      const covering = Math.ceil(height * aspect);
      // an image without a known size counts as no wider than its tile
      const size =
        Number.isFinite(covering) && covering > widest
          ? `${covering}px`
          : width;

      return media ? `${media} ${size}` : size;
    })
    .join(', ');
