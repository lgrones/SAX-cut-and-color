import {
  getAuth,
  inMemoryPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';

import { app } from './app';

const auth = getAuth(app);
// This will prevent the browser from storing session data
void auth.setPersistence(inMemoryPersistence);

/** Signs in with email and password and returns the user's ID token */
export const signIn = async (email: string, password: string) => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);

  return user.getIdToken();
};

export const signOut = () => firebaseSignOut(auth);
