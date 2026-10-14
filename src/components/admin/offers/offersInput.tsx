import '../admin.css';

import { useState } from 'preact/hooks';

import type { Offer } from '../../../types';

export const OffersInput = ({
  offers,
}: {
  offers: ({ id: string } & Offer)[];
}) => {
  const [index, setIndex] = useState(0);
  const [currOffers, setCurrOffers] = useState(offers);

  const removeItem = (index: number) => {
    setCurrOffers(prev => prev.toSpliced(index, 1));
  };

  return (
    <div className="entries offers">
      {currOffers.map((props, i) => (
        <InputElement {...props} i={i} removeItem={removeItem} key={props.id} />
      ))}

      <div className="add-button-wrapper">
        <button
          type="button"
          className="add-button"
          onClick={() => {
            setCurrOffers(prev => [
              ...prev,
              {
                id: 'new' + index.toString(),
                text: '',
                title: '',
                index: Math.max(...prev.map(x => x.index)) + 1,
              },
            ]);
            setIndex(prev => prev + 1);
          }}
        >
          +
        </button>
      </div>
    </div>
  );
};

export const InputElement = ({
  id,
  text,
  title,
  index,
  i,
  removeItem,
}: { id: string; i: number; removeItem: (index: number) => void } & Offer) => {
  const [checked, setChecked] = useState(false);

  return (
    <div className="offer">
      <div className="offer-header">
        <div className="offer-title">
          <label htmlFor={id + '-title'} className="label">
            Titel
          </label>
          <input
            name={id + '-title'}
            id={id + '-title'}
            defaultValue={title}
            required
            disabled={checked}
            className="input"
          />
        </div>

        <div className="offer-index">
          <label htmlFor={id + '-index'} className="label">
            Position
          </label>

          <input
            name={id + '-index'}
            id={id + '-index'}
            defaultValue={index}
            type="number"
            min={0}
            required
            disabled={checked}
            className="input"
          />
        </div>
      </div>

      <label htmlFor={id + '-text'} className="label">
        Text
      </label>

      <textarea
        name={id + '-text'}
        id={id + '-text'}
        defaultValue={text}
        disabled={checked}
        rows={5}
        cols={48}
        className="input"
      />

      <div className="checkbox-row">
        <input
          name={id + '-delete'}
          id={id + '-delete'}
          type="checkbox"
          checked={checked}
          onChange={e =>
            id.includes('new')
              ? removeItem(i)
              : setChecked(e.currentTarget.checked)
          }
          className="checkbox"
        />
        <label htmlFor={id + '-delete'}>Löschen</label>
      </div>
    </div>
  );
};
