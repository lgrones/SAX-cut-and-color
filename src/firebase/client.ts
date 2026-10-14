import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDGF3QDYt-jNHnHbJjR56jNUosvjt81NJo",
  authDomain: "sax-cut-and-color.firebaseapp.com",
  projectId: "sax-cut-and-color",
  storageBucket: "sax-cut-and-color.appspot.com",
  messagingSenderId: "807779129066",
  appId: "1:807779129066:web:c0136bdd2e846ddde82993",
  measurementId: "G-76PDWXC7DG",
};

export const app = initializeApp(firebaseConfig);

if (import.meta.env.DEV) {
  connectFirestoreEmulator(getFirestore(), "127.0.0.1", 8080);
}
