declare namespace App {
  interface Locals {
    /** Verified admin user, set by the auth middleware on protected routes */
    user?: import('firebase-admin/auth').DecodedIdToken;
  }
}
