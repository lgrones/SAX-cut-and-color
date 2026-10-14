// Staggered placement for cards in a `.staggered-grid` (see global.css)
export const getGridPos = (i: number) => {
  const index = i + 1 > 4 ? i - 3 : i + 1;

  if (index % 4 === 0) return 'pos-a';

  if (index % 3 == 0) return 'pos-b';

  if (index % 2 == 0) return 'pos-c';

  return 'pos-d';
};
