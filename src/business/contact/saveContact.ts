import { Contact } from '@domain/contact';
import { Firebase, FixedDocument } from '@services/firebase';
import { z } from 'astro/zod';

const text = z.string().trim().max(200);

const schema = z.object({
  phone: text,
  whatsapp: z.boolean(),
  email: text,
  street: text,
  town: text,
});

export type SaveContactResult =
  | { ok: true; contact: Contact }
  | { ok: false; message: string };

/** Replaces the contact details, trimmed */
export const saveContact = async (
  input: unknown,
): Promise<SaveContactResult> => {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Ungültige Eingabe' };

  const contact = parsed.data;
  const problem = Object.values(Contact.problems(contact)).find(x => x);

  if (problem) return { ok: false, message: problem };

  await Firebase.setDocument(FixedDocument.contact, contact);

  return { ok: true, contact };
};
