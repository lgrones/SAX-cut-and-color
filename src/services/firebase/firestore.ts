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
