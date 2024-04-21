import type { APIRoute } from "astro";
import { app } from "../../../firebase/server";
import { getFirestore } from "firebase-admin/firestore";
import type { OpeningHours } from "../../../types";

const db = getFirestore(app);
const ref = db.collection("openingHours");

export const POST: APIRoute = async ({ redirect, request }) => {
  const formData = await request.formData();
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

  console.log(days);

  for (const [id, data] of days) {
    if (!Object.keys(data).includes("closed")) data.closed = false;

    try {
      await ref.doc(id).update(data);
    } catch (error) {
      return new Response("Something went wrong", {
        status: 500,
      });
    }
  }

  return redirect("/admin#times");
};
