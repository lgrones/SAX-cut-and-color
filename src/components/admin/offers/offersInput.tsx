import { useState } from "react";
import type { Offer } from "../../../types";

export const OffersInput = ({
  offers,
}: {
  offers: ({ id: string } & Offer)[];
}) => {
  const [index, setIndex] = useState(0);
  const [currOffers, setCurrOffers] = useState(offers);

  return (
    <div className="flex flex-wrap gap-x-10 gap-y-6">
      {currOffers.map((props) => (
        <InputElement {...props} key={props.id} />
      ))}

      <div className="flex items-center">
        <button
          type="button"
          className="text-sax-tan text-6xl bg-stone-800 hover:bg-stone-900 border-2 border-stone-600 rounded-full px-4 pb-2.5"
          onClick={() => {
            setCurrOffers((prev) => [
              ...prev,
              { id: "new" + index.toString(), text: "", title: "" },
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

export const InputElement = ({ id, text, title }: { id: string } & Offer) => {
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex flex-col gap-y-2">
      <label htmlFor={id + "-title"} className="block text-sax-tan">
        Titel
      </label>
      <input
        name={id + "-title"}
        id={id + "-title"}
        defaultValue={title}
        required
        disabled={checked}
        className="text-white bg-stone-800 border-2 border-stone-600 rounded-lg focus:border-sax-tan focus:ring-0 block w-full p-1.5 disabled:opacity-40"
      />

      <label htmlFor={id + "-text"} className="block  text-sax-tan">
        Text
      </label>

      <textarea
        name={id + "-text"}
        id={id + "-text"}
        defaultValue={text}
        disabled={checked}
        rows={5}
        cols={48}
        className="text-white bg-stone-800 border-2 border-stone-600 rounded-lg focus:border-sax-tan focus:ring-0 block w-full p-1.5 disabled:opacity-40"
      />

      <div className="flex items-center mb-4">
        <input
          name={id + "-delete"}
          id={id + "-delete"}
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.currentTarget.checked)}
          className="w-4 h-4 text-sax-tan rounded bg-stone-800 border-stone-600 focus:border-sax-tan focus:ring-0 focus:ring-offset-0"
        />
        <label htmlFor={id + "-delete"} className="ms-2">
          Löschen
        </label>
      </div>
    </div>
  );
};
