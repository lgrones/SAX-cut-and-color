import type { Contact } from '@domain/contact';
import { Firebase } from '@services/firebase';

// What the site showed before the contact became editable, until the admin
// first saves it
const initial: Contact = {
  phone: '+43 664 421 384 9',
  whatsapp: true,
  email: 'petra.zangerl@chello.at',
  street: 'Landstraße 46',
  town: '6911 Lochau',
};

/** The salon's contact details */
export const getContact = async (): Promise<Contact> => {
  const document = await Firebase.getDocument('settings', 'contact');
  const data = document?.data ?? {};
  const text = (key: Exclude<keyof Contact, 'whatsapp'>) =>
    typeof data[key] === 'string' ? data[key] : initial[key];

  return {
    phone: text('phone'),
    whatsapp:
      typeof data.whatsapp === 'boolean' ? data.whatsapp : initial.whatsapp,
    email: text('email'),
    street: text('street'),
    town: text('town'),
  };
};
