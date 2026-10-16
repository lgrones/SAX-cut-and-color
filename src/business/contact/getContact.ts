import type { Contact } from '@domain/contact';
import { Firebase, FixedDocument } from '@services/firebase';

/** The salon's contact details, empty until the admin first saves them */
export const getContact = async (): Promise<Contact> => {
  const document = await Firebase.getDocument(FixedDocument.contact);
  const data = document?.data ?? {};
  const text = (key: Exclude<keyof Contact, 'whatsapp'>) =>
    typeof data[key] === 'string' ? data[key] : '';

  return {
    phone: text('phone'),
    whatsapp: typeof data.whatsapp === 'boolean' ? data.whatsapp : false,
    email: text('email'),
    street: text('street'),
    town: text('town'),
  };
};
