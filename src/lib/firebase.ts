import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCMKUmdPnZCED3tnCsm2xzsVc9Ri6Pu8YI",
  authDomain: "personal-hub-7d9f0.firebaseapp.com",
  databaseURL: "https://personal-hub-7d9f0-default-rtdb.firebaseio.com",
  projectId: "personal-hub-7d9f0",
  storageBucket: "personal-hub-7d9f0.firebasestorage.app",
  messagingSenderId: "451679332521",
  appId: "1:451679332521:web:e3fa9612a13f203e6c61b8",
  measurementId: "G-EXCF64564H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const isFirebaseConfigured = true;