import type { APIRoute } from "astro";
import { app } from "../../../firebase/server";
import { getFirestore } from "firebase-admin/firestore";
import type { Price } from "../../../types";
import { error as logError } from "firebase-functions/logger";
// import data from "../../../../backups/prices.json";

const db = getFirestore(app);
const ref = db.collection("prices");

// const populate = () => {
//   for (const d of data) {
//     ref.add(d);
//   }
// };

export const POST: APIRoute = async ({ redirect, request }) => {
  // populate();
  // return redirect("/admin#prices");

  let formData: any;

  if (process.env.NODE_ENV === "development") {
    formData = await request.formData();
  } else {
    // firebase cloud functions parse the request to json before sending it to Astro
    // so we need to use the json content here instead of formData
    // took me an entire day to figure out, so fuck you firebase
    const obj = await request.json();
    delete obj.message;
    formData = Object.entries(obj);
  }

  const prices = new Map<string, Partial<Price>>();

  for (const [key, value] of formData) {
    const keyParts = key.split("-");
    const id = keyParts[0];
    const field = keyParts[1];
    const index = keyParts[2];
    const isPrices = !!index;

    if (isPrices) {
      if (!prices.has(id)) prices.set(id, { prices: [] });

      if (!prices.get(id)!.prices) prices.get(id)!.prices = [];

      const pricesList = prices.get(id)!.prices!;

      pricesList[parseInt(index)] = {
        ...pricesList[parseInt(index)],
        [field]:
          field === "title"
            ? value.toString()
            : field.includes("price")
            ? parseFloat(value.toString()) || ""
            : value.toString() === "on",
      };

      continue;
    }

    prices.set(id, {
      ...prices.get(id),
      [field]: value.toString(),
    });
  }

  const validPrices = [...prices].filter(
    ([id, data]) =>
      !id.startsWith("new") ||
      !Object.keys(data).find((x) => x.includes("delete"))
  );

  for (const validPrice of validPrices) {
    validPrice[1].prices = validPrice[1].prices?.filter(
      (x) => !Object.keys(x).find((y) => y.includes("delete"))
    );
  }

  for (const [id, data] of validPrices) {
    try {
      if (id.startsWith("new")) {
        await ref.add(data);
      } else if (Object.keys(data).find((x) => x.includes("delete"))) {
        await ref.doc(id).delete();
      } else {
        await ref.doc(id).update(data);
      }
    } catch (error) {
      logError("prices", error);

      return new Response("Something went wrong", {
        status: 500,
      });
    }
  }

  return redirect("/admin#prices");
};
