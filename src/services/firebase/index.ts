import {
  createSessionCookie,
  revokeSessions,
  verifyIdToken,
  verifySessionCookie,
} from './auth';
import { Collection, FixedDocument } from './collections';
import {
  addDocument,
  deleteDocument,
  getDocument,
  getDocuments,
  setDocument,
  updateDocument,
} from './firestore';
import {
  deleteFile,
  downloadFile,
  fileUrl,
  listFiles,
  uploadFile,
} from './storage';

export const Firebase = {
  getDocuments,
  getDocument,
  setDocument,
  addDocument,
  updateDocument,
  deleteDocument,
  verifyIdToken,
  verifySessionCookie,
  createSessionCookie,
  revokeSessions,
  fileUrl,
  uploadFile,
  downloadFile,
  deleteFile,
  listFiles,
};

export { Collection, FixedDocument };

export type * from './auth';
export type * from './firestore';
export type * from './storage';
