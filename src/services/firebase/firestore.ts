import { getFirestore } from 'firebase-admin/firestore';

import { app } from './app';
import type { Collection, FixedDocument } from './collections';

export interface FirestoreDocument {
  id: string;
  data: Record<string, unknown>;
}

const collection = (name: Collection) => getFirestore(app).collection(name);

export const getDocuments = async (
  name: Collection,
): Promise<FirestoreDocument[]> => {
  const snapshot = await collection(name).get();

  return snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
};

export const addDocument = async (name: Collection, data: object) => {
  await collection(name).add(data);
};

export const updateDocument = async (
  name: Collection,
  id: string,
  data: object,
) => {
  await collection(name).doc(id).update(data);
};

export const deleteDocument = async (name: Collection, id: string) => {
  await collection(name).doc(id).delete();
};

/** A fixed document, `undefined` if it doesn't exist */
export const getDocument = async ({
  collection: name,
  id,
}: FixedDocument): Promise<FirestoreDocument | undefined> => {
  const snapshot = await collection(name).doc(id).get();
  const data = snapshot.data();

  return data ? { id: snapshot.id, data } : undefined;
};

/** Creates or replaces a fixed document */
export const setDocument = async (
  { collection: name, id }: FixedDocument,
  data: object,
) => {
  await collection(name).doc(id).set(data);
};
