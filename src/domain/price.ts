import { z } from 'astro/zod';

/** A price category, e.g. "Damen", with its individual services */
export interface Price {
  id: string;
  mainTitle: string;
  /** Place in the list, first 0 */
  index: number;
  prices: PriceItem[];
}

export interface PriceItem {
  title: string;
  priceMin?: number;
  priceMax?: number;
  /** Priced individually at the salon instead of a fixed amount */
  salon?: boolean;
}

// "36–48 €", "9,50 €"
const formatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  trailingZeroDisplay: 'stripIfInteger',
});

const formatRange = (min: number, max?: number) =>
  max && max !== min ? formatter.formatRange(min, max) : formatter.format(min);

const label = (item: PriceItem): string =>
  item.salon || !item.priceMin
    ? 'nach Absprache'
    : formatRange(item.priceMin, item.priceMax);

// Not a number when typed as something else, see the admin's amount fields
const amount = z
  .number({ error: 'Ungültiger Preis' })
  .positive('Ungültiger Preis')
  .optional();

// The checks run in this order and the first that fails names the problem. A
// service priced at the salon needs no amount.
const itemSchema = z
  .object({
    title: z.string().trim().min(1, 'Bezeichnung fehlt'),
    priceMin: amount,
    priceMax: amount,
    salon: z.boolean().optional(),
  })
  .refine(x => x.salon === true || x.priceMin !== undefined, 'Preis fehlt')
  .refine(
    x =>
      x.priceMin === undefined ||
      x.priceMax === undefined ||
      x.priceMax >= x.priceMin,
    '„bis“ liegt unter „von“',
  );

/** Why a service can't be saved, if it can't */
const itemProblem = (item: PriceItem): string | undefined =>
  itemSchema.safeParse(item).error?.issues[0]?.message;

export const PriceItem = { label, problem: itemProblem };

const schema = z.object({
  mainTitle: z.string().trim().min(1, 'Name fehlt'),
  prices: z.array(z.unknown()).min(1, 'Mindestens eine Leistung'),
});

/**
 * Why a category can't be saved, if it can't. Its services are checked on their
 * own.
 */
const problem = (
  price: Pick<Price, 'mainTitle' | 'prices'>,
): string | undefined => schema.safeParse(price).error?.issues[0]?.message;

/**
 * The lowest to the highest fixed price of all categories, e.g. "9,50–120 €".
 * None if every service is priced at the salon.
 */
const rangeLabel = (categories: Price[]): string | undefined => {
  const amounts = categories
    .flatMap(x => x.prices)
    .flatMap(x =>
      x.salon || !x.priceMin ? [] : [x.priceMin, x.priceMax ?? x.priceMin],
    );

  return amounts.length > 0
    ? formatRange(Math.min(...amounts), Math.max(...amounts))
    : undefined;
};

export const Price = { problem, rangeLabel };
