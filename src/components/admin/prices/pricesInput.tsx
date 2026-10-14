import { useState } from "preact/hooks";
import type { Price } from "../../../types";
import "../admin.css";

interface PricesWithId extends Price {
  id: string;
}

export const PricesInput = ({ prices }: { prices: PricesWithId[] }) => {
  const [index, setIndex] = useState(0);
  const [currPrices, setCurrPrices] = useState(prices);

  const removePrice = (index: number) => {
    setCurrPrices((prev) => prev.toSpliced(index, 1));
  };

  return (
    <div className="entries price-blocks">
      {currPrices.map((prices, i) => (
        <InputElements prices={{ ...prices, i, removePrice }} key={prices.id} />
      ))}

      <div className="add-button-wrapper">
        <button
          type="button"
          className="add-button"
          onClick={() => {
            setCurrPrices((prev) => [
              ...prev,
              {
                id: "new" + index.toString(),
                mainTitle: "",
                index: Math.max(...prev.map((x) => x.index)) + 1,
                prices: [{ title: "" }],
              },
            ]);
            setIndex((prev) => prev + 1);
          }}
        >
          +
        </button>
      </div>
    </div>
  );
};

export const InputElements = ({
  prices: { id, prices, mainTitle, removePrice, i, index },
}: {
  prices: PricesWithId & {
    i: number;
    removePrice: (index: number) => void;
  };
}) => {
  const [checked, setChecked] = useState(false);

  const [currPrices, setCurrPrices] = useState(
    prices.map((x, i) => ({ ...x, i }))
  );

  const removeItem = (index: number) => {
    if (index >= prices.length)
      setCurrPrices((prev) => prev.toSpliced(index, 1));
  };

  return (
    <div className="price-block">
      <div className="price-block-header">
        <div className="price-block-title">
          <label htmlFor={id + "-mainTitle"} className="label">
            Haupttitel
          </label>

          <input
            name={id + "-mainTitle"}
            id={id + "-mainTitle"}
            defaultValue={mainTitle}
            required
            disabled={checked}
            className="input"
          />
        </div>

        <div>
          <label htmlFor={id + "-index"} className="label">
            Position
          </label>

          <input
            name={id + "-index"}
            id={id + "-index"}
            defaultValue={index}
            type="number"
            min={0}
            required
            disabled={checked}
            className="input"
          />
        </div>

        <div className="price-block-delete">
          <input
            name={id + "-delete"}
            id={id + "-delete"}
            type="checkbox"
            checked={checked}
            onChange={(e) =>
              id.includes("new")
                ? removePrice(i)
                : setChecked(e.currentTarget.checked)
            }
            className="checkbox"
          />
          <label htmlFor={id + "-delete"}>
            Preisblock Löschen
          </label>
        </div>
      </div>

      <div className="price-rows">
        <label htmlFor={id + "-title-0"} className="label">
          Titel
        </label>

        <label htmlFor={id + "-priceMin-0"} className="label">
          Min. Preis
        </label>

        <label htmlFor={id + "-priceMax-0"} className="label">
          Max. Preis
        </label>

        <label
          htmlFor={id + "-salon-0"}
          className="label centered"
        >
          Absprache
        </label>

        <label
          htmlFor={id + "-delete-0"}
          className="label centered"
        >
          Löschen
        </label>

        {currPrices?.map((x, i) => (
          <InputElement
            {...x}
            id={id}
            index={i}
            removeItem={removeItem}
            key={x.i}
            disabled={checked}
          />
        ))}

        <button
          type="button"
          className="button button-secondary"
          disabled={checked}
          onClick={() => {
            setCurrPrices((prev) => [
              ...prev,
              {
                title: "",
                i:
                  prev
                    .map((x) => x.i)
                    .reduce((prev, curr) => (curr > prev ? curr : prev), 0) + 1,
              },
            ]);
          }}
        >
          Neuen Preis hinzufügen
        </button>
      </div>
    </div>
  );
};

export const InputElement = ({
  title,
  priceMin,
  priceMax,
  salon,
  id,
  index,
  removeItem,
  disabled,
}: Price["prices"][0] & {
  id: string;
  index: number;
  disabled: boolean;
  removeItem: (index: number) => void;
}) => {
  const [isSalon, setIsSalon] = useState(salon ?? false);
  const [isDelete, setDelete] = useState(false);

  return (
    <>
      <input
        name={id + "-title-" + index}
        id={id + "-title-" + index}
        defaultValue={title}
        required
        disabled={disabled || isDelete}
        className="input"
      />

      <input
        type="number"
        min={0}
        name={id + "-priceMin-" + index}
        id={id + "-priceMin-" + index}
        step=".01"
        defaultValue={priceMin}
        disabled={disabled || isSalon || isDelete}
        required
        className="input"
      />

      <input
        type="number"
        min={0}
        name={id + "-priceMax-" + index}
        id={id + "-priceMax-" + index}
        defaultValue={priceMax}
        step=".01"
        disabled={disabled || isSalon || isDelete}
        className="input"
      />

      <input
        name={id + "-salon-" + index}
        id={id + "-salon-" + index}
        type="checkbox"
        disabled={disabled}
        checked={isSalon}
        onChange={(e) => setIsSalon(e.currentTarget.checked)}
        className="checkbox centered"
      />

      <input
        name={id + "-delete-" + index}
        id={id + "-delete-" + index}
        type="checkbox"
        disabled={disabled}
        defaultChecked={isDelete}
        onChange={(e) => {
          removeItem(index);
          setDelete(e.currentTarget.checked);
        }}
        className="checkbox centered"
      />
    </>
  );
};
