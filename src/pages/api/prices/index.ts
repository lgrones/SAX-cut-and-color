import type { APIRoute } from "astro";
import { app } from "../../../firebase/server";
import { getFirestore } from "firebase-admin/firestore";
import type { Price } from "../../../types";
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

  const formData = await request.formData();
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
      console.log(error);

      return new Response("Something went wrong", {
        status: 500,
      });
    }
  }

  return redirect("/admin#prices");
};
