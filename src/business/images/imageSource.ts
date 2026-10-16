import { variantWidths } from './imageFiles';

/** What an `<img>` needs to show a stored image responsively */
export interface ImageSource {
  src: string;
  srcset: string;
  width: number;
  height: number;
  alt: string;
  /** CSS `object-position`, for images shown with `object-fit: cover` */
  objectPosition: string;
}

/**
 * `src` and `srcset` of the variants rendered from a source this wide, each
 * described by its real width
 */
export const variantSources = (
  widths: number[],
  sourceWidth: number,
  url: (width: number) => string,
): Pick<ImageSource, 'src' | 'srcset'> => {
  const rendered = variantWidths(widths, sourceWidth);

  return {
    src: url(rendered.includes(960) ? 960 : Math.max(...rendered)),
    srcset: rendered
      .map(x => `${url(x)} ${Math.min(x, sourceWidth)}w`)
      .join(', '),
  };
};
