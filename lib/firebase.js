// lib/firebase.js

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";

// COMPAT IMPORT for OTP + Recaptcha
import firebase from "firebase/compat/app";
import "firebase/compat/auth";

// ------------------------------
// Firebase Config - using environment variables
// ------------------------------
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

function assertFirebaseConfig() {
  if (!firebaseConfig.apiKey) {
    throw new Error(
      "Firebase API key missing. Set NEXT_PUBLIC_FIREBASE_API_KEY in .env and restart the Next.js server."
    );
  }
}

// ------------------------------
// Initialize modular app
// ------------------------------
assertFirebaseConfig();
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Modular Auth
export const auth = getAuth(app);

// Ensure user stays logged in until sign out
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
}

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// ------------------------------
// Initialize COMPAT Firebase (required for RecaptchaVerifier + OTP)
// ------------------------------
if (typeof window !== "undefined") {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  window.firebase = firebase;
}

// ------------------------------
// Recaptcha Verifier Helper
// ------------------------------
export const getRecaptchaVerifier = () => {
  if (typeof window === "undefined") return null;

  const compat = window.firebase?.auth;
  if (!compat) return null;

  return new compat.RecaptchaVerifier(
    "recaptcha-container",
    { size: "invisible" },
    auth
  );
};

export default app;
