// Firebase Cloud Functions parse form posts to JSON before they reach Astro,
// so in production the body has to be read as JSON instead of FormData
export const readFormEntries = async (
  request: Request,
): Promise<[string, string][]> => {
  if (import.meta.env.DEV) {
    const formData = await request.formData();

    return [...formData].filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    );
  }

  const { message, ...body } = (await request.json()) as Record<string, string>;

  return Object.entries(body);
};
