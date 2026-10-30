import { z } from 'astro/zod';

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
const dialNumber = (contact: Pick<Contact, 'phone'>) =>
  contact.phone.replaceAll(/[\s/()-]/g, '');

const phoneHref = (contact: Contact) => 'tel:' + dialNumber(contact);

// wa.me takes the international number with no "+"
const whatsappHref = (contact: Contact) =>
  'https://wa.me/' + dialNumber(contact).slice(1);

const emailHref = (contact: Contact) => 'mailto:' + contact.email;

/** On one line, e.g. "Landstraße 46, 6911 Lochau" */
const address = (contact: Contact) => `${contact.street}, ${contact.town}`;

/**
 * The town split into postal code and name, e.g. "6911" and "Lochau". A town
 * without a leading code is all name.
 */
const locality = (contact: Contact) => {
  const town = contact.town.trim();
  const match = /^(\d{4,5})\s+(.+)$/.exec(town);

  return match
    ? { postalCode: match[1], name: match[2] }
    : { postalCode: undefined, name: town };
};

// Searching for the name with the address finds the salon's own map entry,
// and still does after a move
const mapHref = (contact: Contact) =>
  'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent(`${NAME}, ${address(contact)}`);

const required = (message: string) => z.string().trim().min(1, message);

const schema = z.object({
  phone: z
    .string()
    .refine(
      phone => /^\+[1-9]\d{6,14}$/.test(dialNumber({ phone })),
      'Mit Ländervorwahl angeben, z. B. +43 664 …',
    ),
  email: z.string().trim().pipe(z.email('Keine gültige E-Mail-Adresse')),
  street: required('Straße fehlt'),
  town: required('PLZ und Ort fehlen'),
});

type Field = keyof typeof schema.shape;

/** Why each field can't be saved, for the fields that can't */
const problems = (contact: Contact): Partial<Record<Field, string>> => {
  const found: Partial<Record<Field, string>> = {};

  for (const issue of schema.safeParse(contact).error?.issues ?? []) {
    found[issue.path[0] as Field] ??= issue.message;
  }

  return found;
};

export const Contact = {
  dialNumber,
  phoneHref,
  whatsappHref,
  emailHref,
  address,
  locality,
  mapHref,
  problems,
};
