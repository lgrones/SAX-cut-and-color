import type { Focus } from '@domain/image';

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const round = (value: number) => Math.round(value * 100) / 100;

/** The focus a pointer at (x, y) points to on an image shown in `rect` */
export const focusAt = (
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
  x: number,
  y: number,
): Focus => ({
  x: round(clamp((x - rect.left) / rect.width)),
  y: round(clamp((y - rect.top) / rect.height)),
});

/** The focus moved by a step, as arrow keys move it */
export const nudge = (focus: Focus, dx: number, dy: number): Focus => ({
  x: round(clamp(focus.x + dx)),
  y: round(clamp(focus.y + dy)),
});
