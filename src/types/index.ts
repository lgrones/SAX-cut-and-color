export interface OpeningHours {
  index: number;
  day: string;
  closed: boolean;
  timeAmStart?: string;
  timeAmEnd?: string;
  timePmStart?: string;
  timePmEnd?: string;
}

export interface Offer {
  title: string;
  text: string;
}

export interface Price {
  mainTitle: string;
  prices: {
    title: string;
    priceMin?: number;
    priceMax?: number;
    salon?: boolean;
  }[];
}
