export type EditorStatus =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved' }
  | { kind: 'error'; message: string };

export type SaveResult =
  | { ok: true; data: unknown }
  | { ok: false; status: EditorStatus };

const send = async (
  url: string,
  init: RequestInit,
  failure: string,
): Promise<SaveResult> => {
  const response = await fetch(url, { method: 'POST', ...init }).catch(
    () => undefined,
  );

  if (!response) {
    return {
      ok: false,
      status: { kind: 'error', message: 'Keine Verbindung' },
    };
  }

  if (response.ok) {
    const data: unknown =
      response.status === 204 ? undefined : await response.json();

    return { ok: true, data };
  }

  if (response.status === 401) {
    window.location.assign('/signin');
    return { ok: false, status: { kind: 'idle' } };
  }

  const error = (await response.json().catch(() => ({}))) as {
    message?: string;
  };

  return {
    ok: false,
    status: { kind: 'error', message: error.message ?? failure },
  };
};

/**
 * Posts an editor's state as JSON. Resolves to the response body on success and
 * to the status to show otherwise. An expired session goes to the sign-in.
 */
export const saveRequest = (url: string, body: unknown) =>
  send(
    url,
    {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    'Speichern fehlgeschlagen',
  );

/** Posts a multipart form, like `saveRequest` */
export const uploadRequest = (url: string, form: FormData) =>
  send(url, { body: form }, 'Hochladen fehlgeschlagen');
