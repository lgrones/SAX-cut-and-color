import { useState } from "react";
import type { Price } from "../../../types";

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
    <div className="flex flex-wrap gap-x-10 gap-y-16">
      {currPrices.map((prices, index) => (
        <InputElements
          prices={{ ...prices, index, removePrice }}
          key={prices.id}
        />
      ))}

      <div className="flex items-center">
        <button
          type="button"
          className="text-sax-tan text-6xl bg-stone-800 hover:bg-stone-900 border-2 border-stone-600 rounded-full px-4 pb-2.5"
          onClick={() => {
            setCurrPrices((prev) => [
              ...prev,
              {
                id: "new" + index.toString(),
                mainTitle: "",
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
  prices: { id, prices, mainTitle, removePrice, index },
}: {
  prices: PricesWithId & {
    index: number;
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
    <div className="flex flex-col gap-y-4 w-full lg:w-[48%]">
      <div className="grid grid-cols-2 gap-x-4 items-center">
        <div>
          <label htmlFor={id + "-mainTitle"} className="block text-sax-tan">
            Haupttitel
          </label>

          <input
            name={id + "-mainTitle"}
            id={id + "-mainTitle"}
            defaultValue={mainTitle}
            required
            disabled={checked}
            className="text-white bg-stone-800 border-2 border-stone-600 rounded-lg focus:border-sax-tan focus:ring-0 block w-full p-1.5 disabled:opacity-40"
          />
        </div>

        <div className="flex items-center mt-6">
          <input
            name={id + "-delete"}
            id={id + "-delete"}
            type="checkbox"
            checked={checked}
            onChange={(e) =>
              id.includes("new")
                ? removePrice(index)
                : setChecked(e.currentTarget.checked)
            }
            className="w-4 h-4 text-sax-tan rounded bg-stone-800 border-stone-600 focus:border-sax-tan focus:ring-0 focus:ring-offset-0"
          />
          <label htmlFor={id + "-delete"} className="ms-2">
            Block Löschen
          </label>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,_1fr)_repeat(4,_80px)] items-center gap-x-4 gap-y-2">
        <label htmlFor={id + "-title-0"} className="block text-sax-tan">
          Titel
        </label>

        <label htmlFor={id + "-priceMin-0"} className="block text-sax-tan">
          Min. Preis
        </label>

        <label htmlFor={id + "-priceMax-0"} className="block text-sax-tan">
          Max. Preis
        </label>

        <label
          htmlFor={id + "-salon-0"}
          className="block text-sax-tan justify-self-center"
        >
          Absprache
        </label>

        <label
          htmlFor={id + "-delete-0"}
          className="block text-sax-tan justify-self-center"
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
          className=" text-sax-tan bg-stone-800 hover:bg-stone-800/70  border-2 border-stone-600 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-40"
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
        className="text-white bg-stone-800 border-2 border-stone-600 rounded-lg focus:border-sax-tan focus:ring-0 block w-full p-1.5 disabled:opacity-40"
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
        className="text-white bg-stone-800 border-2 border-stone-600 rounded-lg focus:border-sax-tan focus:ring-0 block w-full p-1.5 disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />

      <input
        type="number"
        min={0}
        name={id + "-priceMax-" + index}
        id={id + "-priceMax-" + index}
        defaultValue={priceMax}
        step=".01"
        disabled={disabled || isSalon || isDelete}
        className="text-white bg-stone-800 border-2 border-stone-600 rounded-lg focus:border-sax-tan focus:ring-0 block w-full p-1.5 disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />

      <input
        name={id + "-salon-" + index}
        id={id + "-salon-" + index}
        type="checkbox"
        disabled={disabled}
        checked={isSalon}
        onChange={(e) => setIsSalon(e.currentTarget.checked)}
        className="w-4 h-4 justify-self-center text-sax-tan rounded bg-stone-800 border-stone-600 focus:border-sax-tan focus:ring-0 focus:ring-offset-0 disabled:opacity-40"
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
        className="w-4 h-4 justify-self-center text-sax-tan rounded bg-stone-800 border-stone-600 focus:border-sax-tan focus:ring-0 focus:ring-offset-0 disabled:opacity-40"
      />
    </>
  );
};
