export interface Offer {
  id: string;
  title: string;
  /** What kind of treatment it is, e.g. "Coloration". Empty if not set. */
  kind: string;
  text: string;
  /** Place in the list, first 0 */
  index: number;
}

/** Why an offer can't be saved, if it can't */
const problem = (offer: Pick<Offer, 'title'>): string | undefined =>
  offer.title.trim() ? undefined : 'Titel fehlt';

export const Offer = { problem };
