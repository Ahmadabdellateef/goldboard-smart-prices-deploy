import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDyFy5u8n9PmkQoD7ucGnTL_9Oy9RHd--I",
  authDomain: "goldboard-smart-prices.firebaseapp.com",
  projectId: "goldboard-smart-prices",
  storageBucket: "goldboard-smart-prices.firebasestorage.app",
  messagingSenderId: "822672242463",
  appId: "1:822672242463:web:3ae4b3a2a61b021a14622a",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const firestore = getFirestore(app);
