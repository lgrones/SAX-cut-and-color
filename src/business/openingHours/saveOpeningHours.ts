import { Firebase } from '@services/firebase';

/** Applies the admin form. Form keys are `<id>-<field>`. */
export const saveOpeningHours = async (entries: [string, string][]) => {
  const days = new Map<string, Record<string, string | boolean>>();

  for (const [key, value] of entries) {
    const [id, field] = key.split('-');
    if (!id || !field) continue;

    days.set(id, {
      ...days.get(id),
      [field]: field === 'closed' ? value === 'on' : value,
    });
  }

  for (const [id, data] of days) {
    // unchecked checkboxes are not submitted
    await Firebase.updateDocument('openingHours', id, {
      closed: false,
      ...data,
    });
  }
};
