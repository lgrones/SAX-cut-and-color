import type { APIRoute } from "astro";
import { app } from "../../../firebase/server";
import { getFirestore } from "firebase-admin/firestore";
import type { Offer } from "../../../types";

const db = getFirestore(app);
const ref = db.collection("offers");

export const POST: APIRoute = async ({ redirect, request }) => {
  const formData = await request.formData();
  const offers = new Map<string, Partial<Offer>>();

  for (const [key, value] of formData) {
    const keyParts = key.split("-");
    const id = keyParts[0];
    const field = keyParts[1];

    offers.set(id, {
      ...offers.get(id),
      [field]: value.toString(),
    });
  }

  const validOffers = [...offers].filter(
    ([id, data]) =>
      !id.startsWith("new") ||
      !Object.keys(data).find((x) => x.includes("delete"))
  );

  for (const [id, data] of validOffers) {
    try {
      if (id.startsWith("new")) {
        await ref.add(data);
      } else if (Object.keys(data).find((x) => x.includes("delete"))) {
        await ref.doc(id).delete();
      } else {
        await ref.doc(id).update(data);
      }
    } catch (error) {
      return new Response("Something went wrong", {
        status: 500,
      });
    }
  }

  return redirect("/admin#offers");
};
