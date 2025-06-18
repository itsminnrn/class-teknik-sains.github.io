import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD5ijDk5ffUXFaOz7qswNArYVlabOXXGPs",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "classteknik-e076b"}.firebaseapp.com`,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://classteknik-e076b-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "classteknik-e076b",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "classteknik-e076b"}.firebasestorage.app`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "455736395718",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:455736395718:web:2deacd4c4f40811486d4c7",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-EJ15MWTSJ3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;
