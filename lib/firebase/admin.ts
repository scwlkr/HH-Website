import "server-only";

import { Firestore as GoogleCloudFirestore } from "@google-cloud/firestore";
import {
  Storage as GoogleCloudStorage,
  type StorageOptions,
} from "@google-cloud/storage";
import {
  applicationDefault,
  getApps,
  initializeApp,
  type App,
  type AppOptions,
  type Credential,
  type GoogleOAuthAccessToken,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import type { BaseExternalAccountClient } from "google-auth-library";
import { ExternalAccountClient } from "google-auth-library";
import { getVercelOidcToken } from "@vercel/oidc";

let vercelOidcClient: BaseExternalAccountClient | null | undefined;
let vercelOidcFirestore: GoogleCloudFirestore | undefined;
let vercelOidcStorage: GoogleCloudStorage | undefined;

function readOptionalEnv(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function getVercelOidcClient(): BaseExternalAccountClient | null {
  if (vercelOidcClient !== undefined) {
    return vercelOidcClient;
  }

  const isVercelRuntime =
    readOptionalEnv("VERCEL") === "1" ||
    Boolean(readOptionalEnv("VERCEL_ENV")) ||
    Boolean(readOptionalEnv("VERCEL_TARGET_ENV"));

  if (!isVercelRuntime) {
    vercelOidcClient = null;
    return vercelOidcClient;
  }

  const config = {
    projectId: readOptionalEnv("GCP_PROJECT_ID"),
    projectNumber: readOptionalEnv("GCP_PROJECT_NUMBER"),
    serviceAccountEmail: readOptionalEnv("GCP_SERVICE_ACCOUNT_EMAIL"),
    workloadIdentityPoolId: readOptionalEnv("GCP_WORKLOAD_IDENTITY_POOL_ID"),
    workloadIdentityPoolProviderId: readOptionalEnv(
      "GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID",
    ),
  };
  if (Object.values(config).some((value) => !value)) {
    throw new Error(
      "Vercel OIDC requires GCP_PROJECT_ID, GCP_PROJECT_NUMBER, GCP_SERVICE_ACCOUNT_EMAIL, GCP_WORKLOAD_IDENTITY_POOL_ID, and GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID.",
    );
  }

  const providerResource = `//iam.googleapis.com/projects/${config.projectNumber}/locations/global/workloadIdentityPools/${config.workloadIdentityPoolId}/providers/${config.workloadIdentityPoolProviderId}`;
  vercelOidcClient = ExternalAccountClient.fromJSON({
    type: "external_account",
    audience: providerResource,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${config.serviceAccountEmail}:generateAccessToken`,
    subject_token_supplier: {
      getSubjectToken: () => getVercelOidcToken(),
    },
  });

  if (!vercelOidcClient) {
    throw new Error("Vercel OIDC credentials could not be initialized.");
  }

  return vercelOidcClient;
}

function getVercelOidcCredential(): Credential | null {
  const externalAccountClient = getVercelOidcClient();

  if (!externalAccountClient) {
    return null;
  }

  return {
    async getAccessToken(): Promise<GoogleOAuthAccessToken> {
      const { token } = await externalAccountClient.getAccessToken();

      if (!token) {
        throw new Error("Vercel OIDC did not return a Google access token.");
      }

      const expiryDate = externalAccountClient.credentials.expiry_date;
      const expiresIn = expiryDate
        ? Math.max(1, Math.floor((expiryDate - Date.now()) / 1000))
        : 300;

      return {
        access_token: token,
        expires_in: expiresIn,
      };
    },
  };
}

function getAdminCredential(): Credential {
  return getVercelOidcCredential() ?? applicationDefault();
}

function getActiveVercelOidcClient() {
  return getVercelOidcClient();
}

function getAdminAppOptions(): AppOptions {
  const projectId =
    readOptionalEnv("FIREBASE_PROJECT_ID") ??
    readOptionalEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID") ??
    readOptionalEnv("GCP_PROJECT_ID");
  const storageBucket =
    readOptionalEnv("FIREBASE_STORAGE_BUCKET") ??
    readOptionalEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");

  return {
    credential: getAdminCredential(),
    ...(projectId ? { projectId } : {}),
    ...(storageBucket ? { storageBucket } : {}),
  };
}

export function getFirebaseAdminApp(): App {
  return getApps()[0] ?? initializeApp(getAdminAppOptions());
}

export function getFirebaseAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminFirestore(): GoogleCloudFirestore {
  const oidcClient = getActiveVercelOidcClient();

  if (oidcClient) {
    vercelOidcFirestore ??= new GoogleCloudFirestore({
      projectId:
        readOptionalEnv("GCP_PROJECT_ID") ??
        readOptionalEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
      authClient: oidcClient,
    });
    return vercelOidcFirestore;
  }

  return getFirestore(getFirebaseAdminApp());
}

export function getFirebaseAdminStorage() {
  const oidcClient = getActiveVercelOidcClient();

  if (oidcClient) {
    // Storage 7 wraps this v10 client with google-auth-library 9, which expects
    // enumerable header properties rather than a WHATWG Headers instance.
    const storageAuthClient = {
      async getRequestHeaders() {
        const headers = await oidcClient.getRequestHeaders();
        return Object.fromEntries(headers.entries());
      },
    } as unknown as StorageOptions["authClient"];

    vercelOidcStorage ??= new GoogleCloudStorage({
      projectId:
        readOptionalEnv("GCP_PROJECT_ID") ??
        readOptionalEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
      authClient: storageAuthClient,
    });
    return vercelOidcStorage;
  }

  return getStorage(getFirebaseAdminApp());
}
