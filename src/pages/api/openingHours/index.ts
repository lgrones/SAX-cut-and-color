import type { APIRoute } from "astro";
import { app } from "../../../firebase/server";
import { getFirestore } from "firebase-admin/firestore";
import type { OpeningHours } from "../../../types";
import { error as logError } from "firebase-functions/logger";
// import data from "../../../../backups/openingHours.json";

const db = getFirestore(app);
const ref = db.collection("openingHours");

// const populate = () => {
//   for (const d of data) {
//     ref.add(d);
//   }
// };

export const POST: APIRoute = async ({ redirect, request }) => {
  // populate();
  // return redirect("/admin#times");

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

  const days = new Map<string, Partial<Omit<OpeningHours, "index">>>();

  for (const [key, value] of formData) {
    const keyParts = key.split("-");
    const id = keyParts[0];
    const field = keyParts[1];

    days.set(id, {
      ...days.get(id),
      [field]:
        field === "closed" ? value.toString() === "on" : value.toString(),
    });
  }

  for (const [id, data] of days) {
    if (!Object.keys(data).includes("closed")) data.closed = false;

    try {
      await ref.doc(id).update(data);
    } catch (error) {
      logError("times", error);
      return new Response("Something went wrong", {
        status: 500,
      });
    }
  }

  return redirect("/admin#times");
};
