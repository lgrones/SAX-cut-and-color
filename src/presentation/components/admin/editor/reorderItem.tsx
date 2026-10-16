import { type PointerEvent, type ReactNode, useRef } from 'react';

import { ChevronIcon, GripIcon } from './icons';

/** Hidden instructions the drag handles point to, once per editor */
export const DragHint = () => (
  <p id="drag-hint" hidden>
    Ziehen oder mit den Pfeiltasten verschieben
  </p>
);

/**
 * A row of a reorderable list: drag handle, summary and a body that opens on
 * tap. Goes inside a `[data-reorder]` list, see `useDragReorder`.
 */
export const ReorderItem = ({
  itemKey,
  title,
  preview,
  problem,
  open,
  dragging,
  onToggle,
  onDragStart,
  index,
  count,
  onMove,
  media,
  children,
}: {
  itemKey: string;
  title: string;
  preview: string;
  problem: string | undefined;
  open: boolean;
  dragging: boolean;
  onToggle: () => void;
  onDragStart: (e: PointerEvent<HTMLButtonElement>) => void;
  /** The item's place in its list, and the list's length */
  index: number;
  count: number;
  /** Moves the item to another place, only ever one within the list */
  onMove: (to: number) => void;
  /** Shown before the summary, e.g. a thumbnail */
  media?: ReactNode;
  children: ReactNode;
}) => {
  const handle = useRef<HTMLButtonElement>(null);
  const bodyId = 'item-' + itemKey;
  const label = title.trim() || 'Ohne Titel';

  return (
    <li
      className={'reorder-item' + (dragging ? ' dragging' : '')}
      data-key={itemKey}
    >
      <div className="item-head">
        <button
          type="button"
          ref={handle}
          className="drag-handle"
          aria-label={`„${label}“ verschieben`}
          aria-describedby="drag-hint"
          onPointerDown={onDragStart}
          onKeyDown={e => {
            if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
            e.preventDefault();

            const to = index + (e.key === 'ArrowUp' ? -1 : 1);
            if (to < 0 || to >= count) return;

            onMove(to);
            // moving the item in the DOM can drop the focus
            requestAnimationFrame(() => handle.current?.focus());
          }}
        >
          <GripIcon />
        </button>

        <button
          type="button"
          className="item-toggle"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={onToggle}
        >
          {media}
          <span className="item-summary">
            <span className="item-title" data-empty={!title.trim()}>
              {label}
            </span>
            <span className={'item-preview' + (problem ? ' problem' : '')}>
              {problem ?? preview}
            </span>
          </span>
          <ChevronIcon />
        </button>
      </div>

      {open && (
        <div className="item-body" id={bodyId}>
          {children}
        </div>
      )}
    </li>
  );
};
