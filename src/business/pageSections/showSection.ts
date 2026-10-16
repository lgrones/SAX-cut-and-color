import { PageSection } from '@domain/pageSection';
import { Firebase, FixedDocument } from '@services/firebase';
import { z } from 'astro/zod';

import { getHiddenSections } from './getHiddenSections';

const schema = z.object({
  section: z.enum(PageSection.all),
  shown: z.boolean(),
});

export type ShowSectionResult = { ok: true } | { ok: false; message: string };

/** Puts a section on the page or takes it off */
export const showSection = async (
  input: unknown,
): Promise<ShowSectionResult> => {
  const parsed = schema.safeParse(input);

  if (!parsed.success) return { ok: false, message: 'Ungültige Eingabe' };

  const { section, shown } = parsed.data;
  const others = (await getHiddenSections()).filter(x => x !== section);

  await Firebase.setDocument(FixedDocument.sections, {
    hidden: shown ? others : [...others, section],
  });

  return { ok: true };
};
