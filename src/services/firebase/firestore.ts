import { getFirestore } from 'firebase-admin/firestore';

import { app } from './app';

export interface FirestoreDocument {
  id: string;
  data: Record<string, unknown>;
}

const collection = (name: string) => getFirestore(app).collection(name);

export const getDocuments = async (
  name: string,
): Promise<FirestoreDocument[]> => {
  const snapshot = await collection(name).get();

  return snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
};

export const addDocument = async (name: string, data: object) => {
  await collection(name).add(data);
};

export const updateDocument = async (
  name: string,
  id: string,
  data: object,
) => {
  await collection(name).doc(id).update(data);
};

export const deleteDocument = async (name: string, id: string) => {
  await collection(name).doc(id).delete();
};

/** One document by id, `undefined` if it doesn't exist */
export const getDocument = async (
  name: string,
  id: string,
): Promise<FirestoreDocument | undefined> => {
  const snapshot = await collection(name).doc(id).get();
  const data = snapshot.data();

  return data ? { id: snapshot.id, data } : undefined;
};

/** Creates or replaces a document under a known id */
export const setDocument = async (name: string, id: string, data: object) => {
  await collection(name).doc(id).set(data);
};
