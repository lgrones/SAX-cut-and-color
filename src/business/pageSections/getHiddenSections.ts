import { PageSection } from '@domain/pageSection';
import { Firebase, FixedDocument } from '@services/firebase';
import { z } from 'astro/zod';

const schema = z.object({ hidden: z.array(z.enum(PageSection.all)) });

/** The sections the admin took off the page, none if nothing is stored */
export const getHiddenSections = async (): Promise<PageSection[]> => {
  const document = await Firebase.getDocument(FixedDocument.sections);

  return schema.safeParse(document?.data).data?.hidden ?? [];
};
