import "server-only";

import {
  getFirebaseAdminFirestore,
  getFirebaseAdminStorage,
} from "@/lib/firebase/admin";

function readOptionalEnv(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

export function isFirebaseAdminConfigured() {
  return Boolean(
      readOptionalEnv("FIREBASE_PROJECT_ID") ??
      readOptionalEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID") ??
      readOptionalEnv("GCP_PROJECT_ID") ??
      readOptionalEnv("GOOGLE_APPLICATION_CREDENTIALS") ??
      readOptionalEnv("GOOGLE_CLOUD_PROJECT") ??
      readOptionalEnv("GCLOUD_PROJECT") ??
      readOptionalEnv("FIREBASE_CONFIG") ??
      readOptionalEnv("FIRESTORE_EMULATOR_HOST"),
  );
}

export function getFirebaseDatabase() {
  return getFirebaseAdminFirestore();
}

export function getFirebaseStorageBucket() {
  const bucketName =
    readOptionalEnv("FIREBASE_STORAGE_BUCKET") ??
    readOptionalEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");

  if (!bucketName) {
    throw new Error(
      "Firebase Storage is not configured. Add FIREBASE_STORAGE_BUCKET.",
    );
  }

  return getFirebaseAdminStorage().bucket(bucketName);
}
