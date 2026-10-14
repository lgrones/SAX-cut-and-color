import {
  createSessionCookie,
  revokeSessions,
  verifyIdToken,
  verifySessionCookie,
} from './auth';
import {
  addDocument,
  deleteDocument,
  getDocuments,
  updateDocument,
} from './firestore';

export const Firebase = {
  getDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  verifyIdToken,
  verifySessionCookie,
  createSessionCookie,
  revokeSessions,
};

export type * from './auth';
export type * from './firestore';
