// Amounts as typed into the price fields: German style, comma for decimals

/** The amount typed, `undefined` when empty and `NaN` when it isn't one */
export const parseAmount = (text: string): number | undefined => {
  const value = text.trim().replace(',', '.');
  if (!value) return undefined;

  return /^\d+(\.\d{1,2})?$/.test(value) ? Number(value) : NaN;
};

/** An amount for editing, e.g. `9,5` */
export const formatAmount = (amount: number | undefined): string =>
  amount === undefined ? '' : String(amount).replace('.', ',');
