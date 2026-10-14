import type { ComponentChildren } from 'preact';
import { useRef } from 'preact/hooks';

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
  onStep,
  children,
}: {
  itemKey: string;
  title: string;
  preview: string;
  problem: string | undefined;
  open: boolean;
  dragging: boolean;
  onToggle: () => void;
  onDragStart: (e: PointerEvent) => void;
  /** Moves the item up (-1) or down (1) */
  onStep: (by: number) => void;
  children: ComponentChildren;
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
            onStep(e.key === 'ArrowUp' ? -1 : 1);
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
