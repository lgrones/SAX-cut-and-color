import type { SiteImages } from '@domain/image';
import { Firebase } from '@services/firebase';

import { mapImages } from './mapImages';

/** The page's images as the admin last saved them */
export const getImages = async (): Promise<SiteImages> =>
  mapImages(await Firebase.getDocument('images', 'site'));
