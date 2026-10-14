/** A price category, e.g. "Damen", with its individual services */
export interface Price {
  id: string;
  mainTitle: string;
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

export const PriceItem = { label };
