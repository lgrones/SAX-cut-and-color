import '../admin.css';

import { Price, PriceItem } from '@domain/price';
import { useEffect, useRef, useState } from 'preact/hooks';

import { moveItem } from '../editor/dragTarget';
import { PlusIcon, TrashIcon } from '../editor/icons';
import { DragHint, ReorderItem } from '../editor/reorderItem';
import { SaveBar, StatusBanner, UndoNote } from '../editor/saveBar';
import { type EditorStatus, saveRequest } from '../editor/saveRequest';
import { useDragReorder } from '../editor/useDragReorder';
import { useUnsavedWarning } from '../editor/useUnsavedWarning';
import { formatAmount, parseAmount } from './amount';

/** A service as edited, amounts as typed */
interface ItemDraft {
  key: string;
  title: string;
  min: string;
  max: string;
  salon: boolean;
}

/**
 * A category as edited. `key` is stable across saves; `id` is unset until
 * saved.
 */
interface CategoryDraft {
  key: string;
  id?: string;
  mainTitle: string;
  items: ItemDraft[];
}

type Removed =
  | { kind: 'category'; draft: CategoryDraft; index: number }
  | { kind: 'item'; categoryKey: string; item: ItemDraft; index: number };

// Services have no id, their keys only need to be stable while editing and the
// same on the server and in the browser
const toDraft = (price: Price): CategoryDraft => ({
  key: price.id,
  id: price.id,
  mainTitle: price.mainTitle,
  items: price.prices.map((item, i) => ({
    key: price.id + '-' + i,
    title: item.title,
    min: formatAmount(item.priceMin),
    max: formatAmount(item.priceMax),
    salon: !!item.salon,
  })),
});

const toPriceItem = (item: ItemDraft): PriceItem => {
  if (item.salon) return { title: item.title, salon: true };

  const priceMin = parseAmount(item.min);
  const priceMax = parseAmount(item.max);

  return {
    title: item.title,
    ...(priceMin !== undefined && { priceMin }),
    ...(priceMax !== undefined && { priceMax }),
  };
};

const payload = (drafts: CategoryDraft[]) =>
  drafts.map(({ id, mainTitle, items }) => ({
    id,
    mainTitle,
    prices: items.map(toPriceItem),
  }));

const itemProblem = (item: ItemDraft) => PriceItem.problem(toPriceItem(item));

const categoryProblem = (category: CategoryDraft) =>
  Price.problem({
    mainTitle: category.mainTitle,
    prices: category.items.map(toPriceItem),
  }) ??
  (category.items.some(itemProblem)
    ? 'Eine Leistung ist unvollständig'
    : undefined);

const newItem = (): ItemDraft => ({
  key: crypto.randomUUID(),
  title: '',
  min: '',
  max: '',
  salon: false,
});

export const PricesEditor = ({ prices }: { prices: Price[] }) => {
  const [saved, setSaved] = useState(() => prices.map(toDraft));
  const [drafts, setDrafts] = useState(saved);
  const [removed, setRemoved] = useState<Removed[]>([]);
  const [openCategory, setOpenCategory] = useState<string>();
  const [openItem, setOpenItem] = useState<string>();
  // the field to focus once it shows, after adding something
  const [focusKey, setFocusKey] = useState<string>();
  const [status, setStatus] = useState<EditorStatus>({ kind: 'idle' });

  const dirty =
    removed.length > 0 ||
    JSON.stringify(payload(drafts)) !== JSON.stringify(payload(saved));
  const invalid = drafts.some(x => categoryProblem(x));

  useUnsavedWarning(dirty);

  const edit = (update: (prev: CategoryDraft[]) => CategoryDraft[]) => {
    setDrafts(update);
    setStatus({ kind: 'idle' });
  };

  const changeCategory = (
    key: string,
    update: (category: CategoryDraft) => CategoryDraft,
  ) => edit(prev => prev.map(x => (x.key === key ? update(x) : x)));

  const changeItem = (
    categoryKey: string,
    key: string,
    patch: Partial<ItemDraft>,
  ) =>
    changeCategory(categoryKey, category => ({
      ...category,
      items: category.items.map(x => (x.key === key ? { ...x, ...patch } : x)),
    }));

  // A key is either a category's or one of its services'
  const move = (key: string, to: (from: number) => number) =>
    edit(prev => {
      const from = prev.findIndex(x => x.key === key);
      if (from !== -1) return moveItem(prev, from, to(from));

      return prev.map(category => {
        const index = category.items.findIndex(x => x.key === key);
        return index === -1
          ? category
          : { ...category, items: moveItem(category.items, index, to(index)) };
      });
    });

  const { dragKey, startDrag } = useDragReorder((key, to) =>
    move(key, () => to),
  );

  const addCategory = () => {
    const key = crypto.randomUUID();
    const item = newItem();
    edit(prev => [...prev, { key, mainTitle: '', items: [item] }]);
    setOpenCategory(key);
    setOpenItem(item.key);
    setFocusKey(key);
  };

  const addItem = (categoryKey: string) => {
    const item = newItem();
    changeCategory(categoryKey, category => ({
      ...category,
      items: [...category.items, item],
    }));
    setOpenItem(item.key);
    setFocusKey(item.key);
  };

  const removeCategory = (key: string) => {
    const index = drafts.findIndex(x => x.key === key);
    const draft = drafts[index];
    if (!draft) return;

    setRemoved(prev => [...prev, { kind: 'category', draft, index }]);
    edit(prev => prev.toSpliced(index, 1));
  };

  const removeItem = (categoryKey: string, key: string) => {
    const category = drafts.find(x => x.key === categoryKey);
    const index = category?.items.findIndex(x => x.key === key) ?? -1;
    const item = category?.items[index];
    if (!item) return;

    setRemoved(prev => [...prev, { kind: 'item', categoryKey, item, index }]);
    changeCategory(categoryKey, x => ({
      ...x,
      items: x.items.toSpliced(index, 1),
    }));
  };

  const undo = () => {
    const last = removed.at(-1);
    if (!last) return;

    setRemoved(prev => prev.slice(0, -1));

    if (last.kind === 'category') {
      edit(prev => prev.toSpliced(last.index, 0, last.draft));
    } else {
      changeCategory(last.categoryKey, x => ({
        ...x,
        items: x.items.toSpliced(last.index, 0, last.item),
      }));
    }
  };

  const submit = async (e: Event) => {
    e.preventDefault();
    setStatus({ kind: 'saving' });

    const result = await saveRequest('/api/prices', {
      categories: payload(drafts),
      deleted: removed.flatMap(x =>
        x.kind === 'category' && x.draft.id ? [x.draft.id] : [],
      ),
    });

    if (!result.ok) {
      setStatus(result.status);
      return;
    }

    // New categories only get their id now, so take the list as stored
    const next = (result.data as Price[]).map(toDraft);
    setSaved(next);
    setDrafts(next);
    setRemoved([]);
    setOpenItem(undefined);
    setStatus({ kind: 'saved' });
  };

  const lastRemoved = removed.at(-1);

  return (
    <form onSubmit={e => void submit(e)} autocomplete="off" noValidate>
      <StatusBanner
        status={status}
        savedText="Preise gespeichert"
        onClose={() => setStatus({ kind: 'idle' })}
      />

      <div className="panel">
        <DragHint />

        {drafts.length === 0 && (
          <p className="list-empty">Noch keine Kategorien.</p>
        )}

        <ol className="reorder-list" data-reorder>
          {drafts.map(category => (
            <ReorderItem
              key={category.key}
              itemKey={category.key}
              title={category.mainTitle}
              preview={
                category.items.length === 1
                  ? '1 Leistung'
                  : `${category.items.length} Leistungen`
              }
              problem={categoryProblem(category)}
              open={openCategory === category.key}
              dragging={dragKey === category.key}
              onToggle={() =>
                setOpenCategory(prev =>
                  prev === category.key ? undefined : category.key,
                )
              }
              onDragStart={e => startDrag(category.key, e)}
              onStep={by => move(category.key, from => from + by)}
            >
              <NameField
                id={'category-' + category.key}
                value={category.mainTitle}
                focus={focusKey === category.key}
                onInput={mainTitle =>
                  changeCategory(category.key, x => ({ ...x, mainTitle }))
                }
              />

              <div>
                <p className="label">Leistungen</p>

                <ol className="reorder-list nested" data-reorder>
                  {category.items.map(item => (
                    <ReorderItem
                      key={item.key}
                      itemKey={item.key}
                      title={item.title}
                      preview={PriceItem.label(toPriceItem(item))}
                      problem={itemProblem(item)}
                      open={openItem === item.key}
                      dragging={dragKey === item.key}
                      onToggle={() =>
                        setOpenItem(prev =>
                          prev === item.key ? undefined : item.key,
                        )
                      }
                      onDragStart={e => startDrag(item.key, e)}
                      onStep={by => move(item.key, from => from + by)}
                    >
                      <ItemFields
                        item={item}
                        focus={focusKey === item.key}
                        onChange={patch =>
                          changeItem(category.key, item.key, patch)
                        }
                        onRemove={() => removeItem(category.key, item.key)}
                      />
                    </ReorderItem>
                  ))}
                </ol>

                <button
                  type="button"
                  className="button button-secondary add-nested"
                  onClick={() => addItem(category.key)}
                >
                  <PlusIcon />
                  Leistung hinzufügen
                </button>
              </div>

              <button
                type="button"
                className="button button-secondary button-danger"
                onClick={() => removeCategory(category.key)}
              >
                <TrashIcon />
                Kategorie entfernen
              </button>
            </ReorderItem>
          ))}
        </ol>

        <div className="list-add">
          <button
            type="button"
            className="button button-secondary"
            onClick={addCategory}
          >
            <PlusIcon />
            Kategorie hinzufügen
          </button>
        </div>

        <SaveBar
          status={status}
          dirty={dirty}
          invalid={invalid}
          onDiscard={() => {
            setDrafts(saved);
            setRemoved([]);
            setOpenCategory(undefined);
            setOpenItem(undefined);
            setStatus({ kind: 'idle' });
          }}
        >
          {lastRemoved && (
            <UndoNote
              label={
                lastRemoved.kind === 'category'
                  ? lastRemoved.draft.mainTitle
                  : lastRemoved.item.title
              }
              onUndo={undo}
            />
          )}
        </SaveBar>
      </div>
    </form>
  );
};

const NameField = ({
  id,
  value,
  focus,
  onInput,
}: {
  id: string;
  value: string;
  focus: boolean;
  onInput: (value: string) => void;
}) => {
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focus) input.current?.focus();
  }, [focus]);

  return (
    <div>
      <label className="label" htmlFor={id}>
        Name
      </label>
      <input
        id={id}
        ref={input}
        className="input"
        value={value}
        aria-invalid={!value.trim()}
        onInput={e => onInput(e.currentTarget.value)}
      />
    </div>
  );
};

const ItemFields = ({
  item,
  focus,
  onChange,
  onRemove,
}: {
  item: ItemDraft;
  focus: boolean;
  onChange: (patch: Partial<ItemDraft>) => void;
  onRemove: () => void;
}) => {
  const id = 'service-' + item.key;
  const title = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focus) title.current?.focus();
  }, [focus]);

  return (
    <>
      <div>
        <label className="label" htmlFor={id + '-title'}>
          Bezeichnung
        </label>
        <input
          id={id + '-title'}
          ref={title}
          className="input"
          value={item.title}
          aria-invalid={!item.title.trim()}
          onInput={e => onChange({ title: e.currentTarget.value })}
        />
      </div>

      <div className="price-fields">
        <div>
          <label className="label" htmlFor={id + '-min'}>
            Preis in €
          </label>
          <input
            id={id + '-min'}
            className="input"
            inputMode="decimal"
            placeholder="z. B. 36"
            value={item.min}
            disabled={item.salon}
            onInput={e => onChange({ min: e.currentTarget.value })}
          />
        </div>

        <div>
          <label className="label" htmlFor={id + '-max'}>
            bis (optional)
          </label>
          <input
            id={id + '-max'}
            className="input"
            inputMode="decimal"
            value={item.max}
            disabled={item.salon}
            onInput={e => onChange({ max: e.currentTarget.value })}
          />
        </div>
      </div>

      <label className="checkbox-row">
        <input
          type="checkbox"
          className="checkbox"
          checked={item.salon}
          onChange={e => onChange({ salon: e.currentTarget.checked })}
        />
        Absprache im Salon
      </label>

      <button
        type="button"
        className="button button-secondary button-danger"
        onClick={onRemove}
      >
        <TrashIcon />
        Leistung entfernen
      </button>
    </>
  );
};
