/** How customers reach the salon, as the admin keeps it */
export interface Contact {
  /** As shown, with the country code, e.g. "+43 664 421 384 9" */
  phone: string;
  /** Whether the phone number also takes WhatsApp messages */
  whatsapp: boolean;
  email: string;
  /** Street and number, e.g. "Landstraße 46" */
  street: string;
  /** Postal code and town, e.g. "6911 Lochau" */
  town: string;
}

const NAME = 'SAX Cut + Colour';

/** The phone number without separators, e.g. "+436644213849" */
const dialNumber = (contact: Contact) =>
  contact.phone.replaceAll(/[\s/()-]/g, '');

const phoneHref = (contact: Contact) => 'tel:' + dialNumber(contact);

// wa.me takes the international number with no "+"
const whatsappHref = (contact: Contact) =>
  'https://wa.me/' + dialNumber(contact).slice(1);

const emailHref = (contact: Contact) => 'mailto:' + contact.email;

/** On one line, e.g. "Landstraße 46, 6911 Lochau" */
const address = (contact: Contact) => `${contact.street}, ${contact.town}`;

// Searching for the name with the address finds the salon's own map entry,
// and still does after a move
const mapHref = (contact: Contact) =>
  'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent(`${NAME}, ${address(contact)}`);

type Field = Exclude<keyof Contact, 'whatsapp'>;

/** Why each field can't be saved, for the fields that can't */
const problems = (contact: Contact): Partial<Record<Field, string>> => {
  const found: Partial<Record<Field, string>> = {};

  if (!/^\+[1-9]\d{6,14}$/.test(dialNumber(contact)))
    found.phone = 'Mit Ländervorwahl angeben, z. B. +43 664 …';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim()))
    found.email = 'Keine gültige E-Mail-Adresse';
  if (!contact.street.trim()) found.street = 'Straße fehlt';
  if (!contact.town.trim()) found.town = 'PLZ und Ort fehlen';

  return found;
};

export const Contact = {
  phoneHref,
  whatsappHref,
  emailHref,
  address,
  mapHref,
  problems,
};
