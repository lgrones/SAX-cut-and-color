import { Firebase } from '@services/firebase';

const isDeleted = (data: Record<string, string>) =>
  Object.keys(data).some(x => x.includes('delete'));

/**
 * Applies the admin form: adds offers with a `new` id, deletes the ones marked
 * for deletion and updates the rest. Form keys are `<id>-<field>`.
 */
export const saveOffers = async (entries: [string, string][]) => {
  const offers = new Map<string, Record<string, string>>();

  for (const [key, value] of entries) {
    const [id, field] = key.split('-');
    if (!id || !field) continue;

    offers.set(id, { ...offers.get(id), [field]: value });
  }

  for (const [id, data] of offers) {
    if (id.startsWith('new')) {
      if (!isDeleted(data)) await Firebase.addDocument('offers', data);
    } else if (isDeleted(data)) {
      await Firebase.deleteDocument('offers', id);
    } else {
      await Firebase.updateDocument('offers', id, data);
    }
  }
};
