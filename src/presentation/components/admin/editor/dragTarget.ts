/**
 * Where a dragged list item belongs: past every neighbour whose vertical middle
 * the pointer has crossed. `middles` holds the middle of each item in the
 * current order, the dragged one included.
 */
export const dragTarget = (
  index: number,
  pointerY: number,
  middles: number[],
): number => {
  let target = index;

  while (target > 0 && pointerY < (middles[target - 1] ?? -Infinity)) {
    target--;
  }

  while (
    target < middles.length - 1 &&
    pointerY > (middles[target + 1] ?? Infinity)
  ) {
    target++;
  }

  return target;
};

/** The list with the item at `from` moved to `to`, kept within the list */
export const moveItem = <T>(list: T[], from: number, to: number): T[] => {
  const item = list[from];
  const target = Math.max(0, Math.min(list.length - 1, to));
  if (item === undefined || from === target) return list;

  return list.toSpliced(from, 1).toSpliced(target, 0, item);
};
