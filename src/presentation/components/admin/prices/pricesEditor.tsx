import '../admin.css';

import { Price, PriceItem } from '@domain/price';
import { type UseFormReturnType, useForm } from '@mantine/form';
import { useEffect, useRef, useState } from 'react';

import { PlusIcon, TrashIcon } from '../editor/icons';
import { DragHint, ReorderItem } from '../editor/reorderItem';
import { SaveBar, StatusBanner } from '../editor/saveBar';
import { type EditorStatus, saveRequest } from '../editor/saveRequest';
import { useDragReorder } from '../editor/useDragReorder';
import { useUnsavedWarning } from '../editor/useUnsavedWarning';
import { formatAmount, parseAmount } from './amount';

/** A service as edited, amounts as typed */
interface Item {
  key: string;
  title: string;
  min: string;
  max: string;
  salon: boolean;
}

/** A new category has no id until saved, so rows go by `key` */
interface Category {
  key: string;
  id?: string;
  mainTitle: string;
  items: Item[];
}

interface Values {
  categories: Category[];
}

type PricesForm = UseFormReturnType<Values>;

// Services have no id, their keys only need to be stable while editing
const toValues = (prices: Price[]): Values => ({
  categories: prices.map(price => ({
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
  })),
});

const toPriceItem = (item: Item): PriceItem => {
  if (item.salon) return { title: item.title, salon: true };

  const priceMin = parseAmount(item.min);
  const priceMax = parseAmount(item.max);

  return {
    title: item.title,
    ...(priceMin !== undefined && { priceMin }),
    ...(priceMax !== undefined && { priceMax }),
  };
};

const itemProblem = (item: Item) => PriceItem.problem(toPriceItem(item));

const categoryProblem = (category: Category) =>
  Price.problem({
    mainTitle: category.mainTitle,
    prices: category.items.map(toPriceItem),
  }) ??
  (category.items.some(itemProblem)
    ? 'Eine Leistung ist unvollständig'
    : undefined);

const newItem = (): Item => ({
  key: crypto.randomUUID(),
  title: '',
  min: '',
  max: '',
  salon: false,
});

export const PricesEditor = ({ prices }: { prices: Price[] }) => {
  const [status, setStatus] = useState<EditorStatus>({ kind: 'idle' });
  const [openCategory, setOpenCategory] = useState<string>();
  const [openItem, setOpenItem] = useState<string>();
  // the field to focus once it shows, after adding something
  const [focusKey, setFocusKey] = useState<string>();

  // Controlled, since every row shows its name, prices and problem while typing
  const form = useForm<Values>({
    mode: 'controlled',
    initialValues: toValues(prices),
    onValuesChange: () => setStatus({ kind: 'idle' }),
  });

  const categories = form.values.categories;

  useUnsavedWarning(form.isDirty());

  // A dragged key is either a category's or one of its services'
  const { dragKey, startDrag } = useDragReorder((key, to) => {
    const from = categories.findIndex(x => x.key === key);
    if (from !== -1) return form.reorderListItem('categories', { from, to });

    categories.forEach((category, index) => {
      const item = category.items.findIndex(x => x.key === key);

      if (item !== -1) {
        form.reorderListItem(`categories.${index}.items`, { from: item, to });
      }
    });
  });

  const addCategory = () => {
    const key = crypto.randomUUID();
    const item = newItem();

    form.insertListItem('categories', { key, mainTitle: '', items: [item] });
    setOpenCategory(key);
    setOpenItem(item.key);
    setFocusKey(key);
  };

  const addItem = (index: number) => {
    const item = newItem();

    form.insertListItem(`categories.${index}.items`, item);
    setOpenItem(item.key);
    setFocusKey(item.key);
  };

  // Saving replaces the stored list. New categories only get their id now, so
  // the stored list is the new starting point.
  const submit = form.onSubmit(async values => {
    const result = await saveRequest(
      '/api/prices',
      values.categories.map(({ id, mainTitle, items }) => ({
        id,
        mainTitle,
        prices: items.map(toPriceItem),
      })),
    );

    if (!result.ok) {
      setStatus(result.status);

      return;
    }

    form.setInitialValues(toValues(result.data as Price[]));
    form.reset();
    setOpenItem(undefined);
    setStatus({ kind: 'saved' });
  });

  const shown: EditorStatus = form.submitting ? { kind: 'saving' } : status;

  return (
    <form onSubmit={submit} autoComplete="off" noValidate>
      <StatusBanner
        status={shown}
        savedText="Preise gespeichert"
        onClose={() => setStatus({ kind: 'idle' })}
      />

      <fieldset className="panel" disabled={form.submitting}>
        <DragHint />

        {categories.length === 0 && (
          <p className="list-empty">Noch keine Kategorien.</p>
        )}

        <ol className="reorder-list" data-reorder>
          {categories.map((category, index) => (
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
              index={index}
              count={categories.length}
              onMove={to =>
                form.reorderListItem('categories', { from: index, to })
              }
            >
              <NameField
                id={'category-' + category.key}
                invalid={!category.mainTitle.trim()}
                focus={focusKey === category.key}
                inputProps={form.getInputProps(
                  `categories.${index}.mainTitle`,
                  { withError: false },
                )}
              />

              <div>
                <p className="label">Leistungen</p>

                <ol className="reorder-list nested" data-reorder>
                  {category.items.map((item, itemIndex) => (
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
                      index={itemIndex}
                      count={category.items.length}
                      onMove={to =>
                        form.reorderListItem(`categories.${index}.items`, {
                          from: itemIndex,
                          to,
                        })
                      }
                    >
                      <ItemFields
                        form={form}
                        path={`categories.${index}.items.${itemIndex}`}
                        item={item}
                        focus={focusKey === item.key}
                        onRemove={() =>
                          form.removeListItem(
                            `categories.${index}.items`,
                            itemIndex,
                          )
                        }
                      />
                    </ReorderItem>
                  ))}
                </ol>

                <button
                  type="button"
                  className="button button-secondary add-nested"
                  onClick={() => addItem(index)}
                >
                  <PlusIcon />
                  Leistung hinzufügen
                </button>
              </div>

              <button
                type="button"
                className="button button-secondary button-danger"
                onClick={() => form.removeListItem('categories', index)}
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
          status={shown}
          dirty={form.isDirty()}
          invalid={categories.some(x => categoryProblem(x))}
          onDiscard={() => {
            form.reset();
            setOpenCategory(undefined);
            setOpenItem(undefined);
          }}
        />
      </fieldset>
    </form>
  );
};

const NameField = ({
  id,
  invalid,
  focus,
  inputProps,
}: {
  id: string;
  invalid: boolean;
  focus: boolean;
  inputProps: object;
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
        aria-invalid={invalid}
        {...inputProps}
      />
    </div>
  );
};

const ItemFields = ({
  form,
  path,
  item,
  focus,
  onRemove,
}: {
  form: PricesForm;
  /** Where the service sits in the form, e.g. `categories.0.items.2` */
  path: `categories.${number}.items.${number}`;
  item: Item;
  focus: boolean;
  onRemove: () => void;
}) => {
  const id = 'service-' + item.key;
  const title = useRef<HTMLInputElement>(null);

  const field = (name: 'title' | 'min' | 'max') =>
    form.getInputProps(`${path}.${name}`, { withError: false });

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
          aria-invalid={!item.title.trim()}
          {...field('title')}
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
            disabled={item.salon}
            {...field('min')}
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
            disabled={item.salon}
            {...field('max')}
          />
        </div>
      </div>

      <label className="checkbox-row">
        <input
          type="checkbox"
          className="checkbox"
          {...form.getInputProps(`${path}.salon`, {
            type: 'checkbox',
            withError: false,
          })}
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
