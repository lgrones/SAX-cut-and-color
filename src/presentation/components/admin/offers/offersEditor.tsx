import '../admin.css';

import { Offer } from '@domain/offer';
import { type UseFormReturnType, useForm } from '@mantine/form';
import { useEffect, useRef, useState } from 'react';

import { PlusIcon, TrashIcon } from '../editor/icons';
import { DragHint, ReorderItem } from '../editor/reorderItem';
import { SaveBar, StatusBanner } from '../editor/saveBar';
import { type EditorStatus, saveRequest } from '../editor/saveRequest';
import { useDragReorder } from '../editor/useDragReorder';
import { useUnsavedWarning } from '../editor/useUnsavedWarning';

/** A new offer has no id until saved, so rows go by `key` */
type Item = Pick<Offer, 'title' | 'kind' | 'text'> & {
  id?: string;
  key: string;
};

interface Values {
  offers: Item[];
}

const toValues = (offers: Offer[]): Values => ({
  offers: offers.map(x => ({ ...x, key: x.id })),
});

export const OffersEditor = ({ offers }: { offers: Offer[] }) => {
  const [status, setStatus] = useState<EditorStatus>({ kind: 'idle' });
  const [openKey, setOpenKey] = useState<string>();

  // Controlled, since every row shows its title and problem while typing
  const form = useForm<Values>({
    mode: 'controlled',
    initialValues: toValues(offers),
    onValuesChange: () => setStatus({ kind: 'idle' }),
  });

  const items = form.values.offers;

  useUnsavedWarning(form.isDirty());

  const { dragKey, startDrag } = useDragReorder((key, to) =>
    form.reorderListItem('offers', {
      from: items.findIndex(x => x.key === key),
      to,
    }),
  );

  // Saving replaces the stored list. New offers only get their id now, so the
  // stored list is the new starting point.
  const submit = form.onSubmit(async values => {
    const result = await saveRequest('/api/offers', values.offers);

    if (!result.ok) {
      setStatus(result.status);
      return;
    }

    form.setInitialValues(toValues(result.data as Offer[]));
    form.reset();
    setStatus({ kind: 'saved' });
  });

  const shown: EditorStatus = form.submitting ? { kind: 'saving' } : status;

  return (
    <form onSubmit={submit} autoComplete="off" noValidate>
      <StatusBanner
        status={shown}
        savedText="Angebote gespeichert"
        onClose={() => setStatus({ kind: 'idle' })}
      />

      <fieldset className="panel" disabled={form.submitting}>
        <DragHint />

        {items.length === 0 && (
          <p className="list-empty">Noch keine Angebote.</p>
        )}

        <ol className="reorder-list" data-reorder>
          {items.map((item, index) => (
            <ReorderItem
              key={item.key}
              itemKey={item.key}
              title={item.title}
              preview={item.text}
              problem={Offer.problem(item)}
              open={openKey === item.key}
              dragging={dragKey === item.key}
              onToggle={() =>
                setOpenKey(prev => (prev === item.key ? undefined : item.key))
              }
              onDragStart={e => startDrag(item.key, e)}
              index={index}
              count={items.length}
              onMove={to => form.reorderListItem('offers', { from: index, to })}
            >
              <OfferFields form={form} index={index} item={item} />
            </ReorderItem>
          ))}
        </ol>

        <div className="list-add">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => {
              const key = crypto.randomUUID();

              form.insertListItem('offers', {
                key,
                title: '',
                kind: '',
                text: '',
              });
              setOpenKey(key);
            }}
          >
            <PlusIcon />
            Angebot hinzufügen
          </button>
        </div>

        <SaveBar
          status={shown}
          dirty={form.isDirty()}
          invalid={items.some(x => Offer.problem(x))}
          onDiscard={() => {
            form.reset();
            setOpenKey(undefined);
          }}
        />
      </fieldset>
    </form>
  );
};

const OfferFields = ({
  form,
  index,
  item,
}: {
  form: UseFormReturnType<Values>;
  index: number;
  item: Item;
}) => {
  const id = 'offer-' + item.key;
  const title = useRef<HTMLInputElement>(null);
  const isNew = !item.id;

  const field = (name: 'title' | 'kind' | 'text') =>
    form.getInputProps(`offers.${index}.${name}`, { withError: false });

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
          aria-invalid={!!Offer.problem(item)}
          {...field('title')}
        />
      </div>

      <div>
        <label className="label" htmlFor={id + '-kind'}>
          Kategorie (optional)
        </label>
        <input
          id={id + '-kind'}
          className="input"
          placeholder="z. B. Coloration"
          {...field('kind')}
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
          {...field('text')}
        />
      </div>

      <button
        type="button"
        className="button button-secondary button-danger"
        onClick={() => form.removeListItem('offers', index)}
      >
        <TrashIcon />
        Angebot entfernen
      </button>
    </>
  );
};
