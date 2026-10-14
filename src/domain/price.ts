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

const formatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  currencyDisplay: 'code',
  trailingZeroDisplay: 'stripIfInteger',
});

const formatRange = (min: number, max?: number) =>
  max && max !== min
    ? formatter.formatRange(min, max).replace('–', ' - ')
    : formatter.format(min);

const label = (item: PriceItem): string =>
  item.salon || !item.priceMin
    ? 'Absprache im Salon'
    : formatRange(item.priceMin, item.priceMax);

/** Why a service can't be saved, if it can't */
const itemProblem = (item: PriceItem): string | undefined => {
  if (!item.title.trim()) return 'Bezeichnung fehlt';
  if (item.salon) return undefined;
  if (item.priceMin === undefined) return 'Preis fehlt';
  if (!(item.priceMin > 0)) return 'Ungültiger Preis';
  if (item.priceMax !== undefined && !(item.priceMax >= item.priceMin))
    return '„bis“ liegt unter „von“';

  return undefined;
};

export const PriceItem = { label, problem: itemProblem };

/**
 * Why a category can't be saved, if it can't. Its services are checked on their
 * own.
 */
const problem = (
  price: Pick<Price, 'mainTitle' | 'prices'>,
): string | undefined => {
  if (!price.mainTitle.trim()) return 'Name fehlt';
  if (price.prices.length === 0) return 'Mindestens eine Leistung';

  return undefined;
};

export const Price = { problem };
