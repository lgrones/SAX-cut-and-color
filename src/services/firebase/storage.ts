import { STORAGE_BUCKET } from 'astro:env/server';
import { getStorage } from 'firebase-admin/storage';

import { app } from './app';

export interface StoredFile {
  path: string;
  created: Date;
}

const bucket = () => getStorage(app).bucket(STORAGE_BUCKET);

// Files are served through the Firebase Storage API, where storage.rules
// decide what is public, rather than through bucket IAM. In dev the URL is
// relative and the dev server proxies it to the emulator
const host = import.meta.env.DEV
  ? ''
  : 'https://firebasestorage.googleapis.com';

/** The public URL of a file, readable if storage.rules allow it */
export const fileUrl = (path: string) =>
  `${host}/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(path)}?alt=media`;

export const uploadFile = async (
  path: string,
  data: Buffer,
  contentType: string,
  cacheControl: string,
) => {
  await bucket()
    .file(path)
    .save(data, { contentType, metadata: { cacheControl }, resumable: false });
};

export const downloadFile = async (path: string): Promise<Buffer> => {
  const [data] = await bucket().file(path).download();

  return data;
};

export const deleteFile = async (path: string) => {
  await bucket().file(path).delete({ ignoreNotFound: true });
};

export const listFiles = async (prefix: string): Promise<StoredFile[]> => {
  const [files] = await bucket().getFiles({ prefix });

  return files.map(x => ({
    path: x.name,
    created: new Date(x.metadata.timeCreated ?? 0),
  }));
};
