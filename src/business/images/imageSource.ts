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
