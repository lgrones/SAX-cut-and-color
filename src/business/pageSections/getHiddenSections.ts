import { PageSection } from '@domain/pageSection';
import { Firebase } from '@services/firebase';

/** The sections the admin took off the page, none if nothing is stored */
export const getHiddenSections = async (): Promise<PageSection[]> => {
  const document = await Firebase.getDocument('settings', 'sections');
  const hidden = document?.data.hidden;

  return Array.isArray(hidden) ? hidden.filter(PageSection.is) : [];
};
