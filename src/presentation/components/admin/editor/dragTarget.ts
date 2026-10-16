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
