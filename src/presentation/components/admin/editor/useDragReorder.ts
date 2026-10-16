import { type PointerEvent as ReactPointerEvent, useState } from 'react';

import { dragTarget } from './dragTarget';

/**
 * Drag to reorder the items of a `[data-reorder]` list, each marked with
 * `data-key`. `move` gets the dragged item's key and its new index. Nested
 * lists work, a handle drags within the list closest to it.
 */
export const useDragReorder = (move: (key: string, to: number) => void) => {
  const [dragKey, setDragKey] = useState<string>();

  // Listens on the window, since reordering moves the handle's element and a
  // pointer capture would not survive that
  const startDrag = (key: string, e: ReactPointerEvent) => {
    const list = (e.currentTarget as HTMLElement | null)?.closest(
      '[data-reorder]',
    );
    if (e.button !== 0 || !list) return;

    e.preventDefault();
    setDragKey(key);

    const onMove = (event: PointerEvent) => {
      const items = [...list.children] as HTMLElement[];
      const middles = items.map(x => {
        const rect = x.getBoundingClientRect();

        return rect.top + rect.height / 2;
      });
      const index = items.findIndex(x => x.dataset.key === key);

      move(key, dragTarget(index, event.clientY, middles));
    };

    const onEnd = () => {
      setDragKey(undefined);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
  };

  return { dragKey, startDrag };
};
