import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import {
  getAuth,
  inMemoryPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
} from "firebase/auth";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseClientConfigured() {
  return Object.values(firebaseConfig).every(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
}

export function getFirebaseClientAuth(): Auth {
  if (!isFirebaseClientConfigured()) {
    throw new Error("Firebase client credentials are not configured.");
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return getAuth(app);
}

export async function signInForAdminSession(email: string, password: string) {
  const auth = getFirebaseClientAuth();
  await setPersistence(auth, inMemoryPersistence);

  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user.getIdToken();
}

export async function clearFirebaseClientAuth() {
  if (getApps().length === 0) {
    return;
  }

  await signOut(getAuth(getApp()));
}
