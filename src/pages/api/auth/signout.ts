import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ redirect, cookies }) => {
  cookies.delete(
    "session",
    // @ts-ignore
    {
      path: "/",
    }
  );

  return redirect("/signin");
};
