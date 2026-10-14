import '../admin.css';

import { Offer } from '@domain/offer';
import { useEffect, useRef, useState } from 'preact/hooks';

import { moveItem } from '../editor/dragTarget';
import { PlusIcon, TrashIcon } from '../editor/icons';
import { DragHint, ReorderItem } from '../editor/reorderItem';
import { SaveBar, StatusBanner, UndoNote } from '../editor/saveBar';
import { type EditorStatus, saveRequest } from '../editor/saveRequest';
import { useDragReorder } from '../editor/useDragReorder';
import { useUnsavedWarning } from '../editor/useUnsavedWarning';

/** An offer as edited. `key` is stable across saves; `id` is unset until saved. */
interface Draft {
  key: string;
  id?: string;
  title: string;
  text: string;
}

interface Removed {
  draft: Draft;
  index: number;
}

const toDraft = (offer: Offer): Draft => ({
  key: offer.id,
  id: offer.id,
  title: offer.title,
  text: offer.text,
});

const content = (drafts: Draft[]) =>
  JSON.stringify(drafts.map(({ id, title, text }) => ({ id, title, text })));

export const OffersEditor = ({ offers }: { offers: Offer[] }) => {
  const [saved, setSaved] = useState(() => offers.map(toDraft));
  const [drafts, setDrafts] = useState(saved);
  const [removed, setRemoved] = useState<Removed[]>([]);
  const [openKey, setOpenKey] = useState<string>();
  const [status, setStatus] = useState<EditorStatus>({ kind: 'idle' });

  const dirty = removed.length > 0 || content(drafts) !== content(saved);
  const invalid = drafts.some(x => Offer.problem(x));

  useUnsavedWarning(dirty);

  const edit = (update: (prev: Draft[]) => Draft[]) => {
    setDrafts(update);
    setStatus({ kind: 'idle' });
  };

  const change = (key: string, patch: Partial<Draft>) =>
    edit(prev => prev.map(x => (x.key === key ? { ...x, ...patch } : x)));

  const move = (key: string, to: (from: number) => number) =>
    edit(prev => {
      const from = prev.findIndex(x => x.key === key);
      return moveItem(prev, from, to(from));
    });

  const { dragKey, startDrag } = useDragReorder((key, to) =>
    move(key, () => to),
  );

  const add = () => {
    const key = crypto.randomUUID();
    edit(prev => [...prev, { key, title: '', text: '' }]);
    setOpenKey(key);
  };

  const remove = (key: string) => {
    const index = drafts.findIndex(x => x.key === key);
    const draft = drafts[index];
    if (!draft) return;

    setRemoved(prev => [...prev, { draft, index }]);
    edit(prev => prev.toSpliced(index, 1));
  };

  const undo = () => {
    const last = removed.at(-1);
    if (!last) return;

    setRemoved(prev => prev.slice(0, -1));
    edit(prev => prev.toSpliced(last.index, 0, last.draft));
  };

  const submit = async (e: Event) => {
    e.preventDefault();
    setStatus({ kind: 'saving' });

    const result = await saveRequest('/api/offers', {
      offers: drafts.map(({ id, title, text }) => ({ id, title, text })),
      deleted: removed.flatMap(x => (x.draft.id ? [x.draft.id] : [])),
    });

    if (!result.ok) {
      setStatus(result.status);
      return;
    }

    // New offers only get their id now, so take the list as stored
    const next = (result.data as Offer[]).map(toDraft);
    setSaved(next);
    setDrafts(next);
    setRemoved([]);
    setStatus({ kind: 'saved' });
  };

  const lastRemoved = removed.at(-1);

  return (
    <form onSubmit={e => void submit(e)} autocomplete="off" noValidate>
      <StatusBanner
        status={status}
        savedText="Angebote gespeichert"
        onClose={() => setStatus({ kind: 'idle' })}
      />

      <div className="panel">
        <DragHint />

        {drafts.length === 0 && (
          <p className="list-empty">Noch keine Angebote.</p>
        )}

        <ol className="reorder-list" data-reorder>
          {drafts.map(draft => (
            <ReorderItem
              key={draft.key}
              itemKey={draft.key}
              title={draft.title}
              preview={draft.text}
              problem={Offer.problem(draft)}
              open={openKey === draft.key}
              dragging={dragKey === draft.key}
              onToggle={() =>
                setOpenKey(prev => (prev === draft.key ? undefined : draft.key))
              }
              onDragStart={e => startDrag(draft.key, e)}
              onStep={by => move(draft.key, from => from + by)}
            >
              <OfferFields
                draft={draft}
                onChange={patch => change(draft.key, patch)}
                onRemove={() => remove(draft.key)}
              />
            </ReorderItem>
          ))}
        </ol>

        <div className="list-add">
          <button
            type="button"
            className="button button-secondary"
            onClick={add}
          >
            <PlusIcon />
            Angebot hinzufügen
          </button>
        </div>

        <SaveBar
          status={status}
          dirty={dirty}
          invalid={invalid}
          onDiscard={() => {
            setDrafts(saved);
            setRemoved([]);
            setOpenKey(undefined);
            setStatus({ kind: 'idle' });
          }}
        >
          {lastRemoved && (
            <UndoNote label={lastRemoved.draft.title} onUndo={undo} />
          )}
        </SaveBar>
      </div>
    </form>
  );
};

const OfferFields = ({
  draft,
  onChange,
  onRemove,
}: {
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
  onRemove: () => void;
}) => {
  const id = 'offer-' + draft.key;
  const title = useRef<HTMLInputElement>(null);
  const isNew = !draft.id;

  // a new offer opens straight into its title
  useEffect(() => {
    if (isNew) title.current?.focus();
  }, [isNew]);

  return (
    <>
      <div>
        <label className="label" htmlFor={id + '-title'}>
          Titel
        </label>
        <input
          id={id + '-title'}
          ref={title}
          className="input"
          value={draft.title}
          aria-invalid={!!Offer.problem(draft)}
          onInput={e => onChange({ title: e.currentTarget.value })}
        />
      </div>

      <div>
        <label className="label" htmlFor={id + '-text'}>
          Text
        </label>
        <textarea
          id={id + '-text'}
          className="input"
          rows={5}
          value={draft.text}
          onInput={e => onChange({ text: e.currentTarget.value })}
        />
      </div>

      <button
        type="button"
        className="button button-secondary button-danger"
        onClick={onRemove}
      >
        <TrashIcon />
        Angebot entfernen
      </button>
    </>
  );
};
