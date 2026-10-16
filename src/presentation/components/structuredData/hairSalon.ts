import type { StartPage } from '@business/startPage/getStartPage';
import { Contact } from '@domain/contact';
import { OpeningHours } from '@domain/openingHours';
import { Price } from '@domain/price';

// schema.org names the days in English, Monday first like the stored week
const dayNames = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/**
 * One entry per opening time range, with the days that share it, e.g. Tuesday
 * to Friday 08:00–12:00. Closed days have no range, so they are left out.
 */
const openingHoursSpecification = (week: OpeningHours[]) => {
  const byRange = new Map<
    string,
    { opens: string; closes: string; days: string[] }
  >();

  for (const day of week) {
    const dayName = dayNames[day.index];
    if (!dayName) continue;

    for (const [opens, closes] of OpeningHours.ranges(day)) {
      const key = `${opens}-${closes}`;
      const entry = byRange.get(key) ?? { opens, closes, days: [] };
      entry.days.push(dayName);
      byRange.set(key, entry);
    }
  }

  return [...byRange.values()].map(({ opens, closes, days }) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: days,
    opens,
    closes,
  }));
};

/**
 * The salon as schema.org `HairSalon` for search engines, from the same data
 * the start page shows: a section the page leaves out adds nothing here either
 */
export const hairSalon = (
  startPage: StartPage,
  contact: Contact,
  site: URL | undefined,
) => {
  const url = new URL('/', site).toString();
  const { postalCode, name: town } = Contact.locality(contact);
  const hours = openingHoursSpecification(startPage.hours);
  const priceRange = Price.rangeLabel(startPage.prices);

  return {
    '@context': 'https://schema.org',
    '@type': 'HairSalon',
    '@id': `${url}#salon`,
    name: 'SAX Cut + Colour by Petra Zangerl',
    url,
    telephone: contact.phone,
    email: contact.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: contact.street,
      postalCode,
      addressLocality: town,
      addressCountry: 'AT',
    },
    // TODO: add `geo` (latitude/longitude) once the salon's coordinates are
    // stored with the contact; geocoding the address here could be wrong
    ...(hours.length > 0 && { openingHoursSpecification: hours }),
    ...(priceRange && { priceRange }),
    ...(startPage.hero && { image: startPage.hero.src }),
  };
};

/**
 * The data as the body of a `<script type="application/ld+json">`. The fields
 * come from the admin, so `<` is escaped to keep a `</script>` in them from
 * ending the script early.
 */
export const jsonLd = (data: object) =>
  JSON.stringify(data).replaceAll('<', '\\u003c');
