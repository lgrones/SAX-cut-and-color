import { Firebase } from '@services/firebase';

type Fields = Record<string, string | number | boolean>;

const isDeleted = (fields: Fields) =>
  Object.keys(fields).some(x => x.includes('delete'));

const parsePriceField = (field: string, value: string) => {
  if (field === 'title') return value;
  if (field.includes('price')) return parseFloat(value) || '';
  return value === 'on';
};

/**
 * Applies the admin form: adds categories with a `new` id, deletes the ones
 * marked for deletion and updates the rest. Form keys are `<id>-<field>` for a
 * category and `<id>-<field>-<index>` for one of its prices.
 */
export const savePrices = async (entries: [string, string][]) => {
  const blocks = new Map<string, { fields: Fields; prices?: Fields[] }>();

  for (const [key, value] of entries) {
    const [id, field, index] = key.split('-');
    if (!id || !field) continue;

    const block = blocks.get(id) ?? { fields: {} };
    blocks.set(id, block);

    if (index) {
      const i = parseInt(index);
      block.prices ??= [];
      block.prices[i] = {
        ...block.prices[i],
        [field]: parsePriceField(field, value),
      };
    } else {
      block.fields[field] = value;
    }
  }

  for (const [id, { fields, prices }] of blocks) {
    if (isDeleted(fields) && id.startsWith('new')) continue;

    const data = prices
      ? { ...fields, prices: prices.filter(x => !isDeleted(x)) }
      : fields;

    if (id.startsWith('new')) {
      await Firebase.addDocument('prices', data);
    } else if (isDeleted(fields)) {
      await Firebase.deleteDocument('prices', id);
    } else {
      await Firebase.updateDocument('prices', id, data);
    }
  }
};
