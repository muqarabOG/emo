// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB8X-dhu9eqNrZxPOGZxRqonlMB0m8uMag",
  authDomain: "echome-5d103.firebaseapp.com",
  projectId: "echome-5d103",
  storageBucket: "echome-5d103.firebasestorage.app",
  messagingSenderId: "414849098332",
  appId: "1:414849098332:web:45a68d3af475f3c10f3c99",
  measurementId: "G-JNHRL9CCS5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google provider
export const provider = new GoogleAuthProvider();

// Apple provider
export const appleProvider = new OAuthProvider('apple.com');
