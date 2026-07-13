const fallbackSiteUrl = "http://localhost:3000";
const fallbackContactEmail = "hello@howethandharp.com";

function readOptionalEnv(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function normalizeAbsoluteUrl(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);
    return url.toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

function readSiteUrl() {
  const siteUrl = normalizeAbsoluteUrl(readOptionalEnv("NEXT_PUBLIC_SITE_URL"));

  if (siteUrl) {
    return siteUrl;
  }

  return fallbackSiteUrl;
}

function normalizePhoneHref(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  return value.startsWith("tel:") ? value : undefined;
}

function normalizeEmailAddress(value: string | undefined) {
  if (!value) {
    return fallbackContactEmail;
  }

  return value.replace(/^mailto:/i, "");
}

const contactPhoneHref = normalizePhoneHref(
  readOptionalEnv("HH_CONTACT_PHONE_HREF"),
);
const contactEmailAddress = normalizeEmailAddress(
  readOptionalEnv("HH_CONTACT_EMAIL"),
);
const firebaseApiKey = readOptionalEnv("NEXT_PUBLIC_FIREBASE_API_KEY");
const firebaseAuthDomain = readOptionalEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
const firebaseProjectId = readOptionalEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
const firebaseStorageBucket = readOptionalEnv(
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
);
const firebaseMessagingSenderId = readOptionalEnv(
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
);
const firebaseAppId = readOptionalEnv("NEXT_PUBLIC_FIREBASE_APP_ID");

export const env = {
  siteUrl: readSiteUrl(),
  contactEmailAddress,
  contactEmailHref: `mailto:${contactEmailAddress}`,
  contactPhoneHref,
  contactPhoneLabel: contactPhoneHref
    ? readOptionalEnv("HH_CONTACT_PHONE_LABEL") ??
      contactPhoneHref.replace(/^tel:/, "")
    : undefined,
  firebaseApiKey,
  firebaseAuthDomain,
  firebaseProjectId,
  firebaseStorageBucket,
  firebaseMessagingSenderId,
  firebaseAppId,
  hasFirebasePublicEnv: Boolean(
    firebaseApiKey &&
      firebaseAuthDomain &&
      firebaseProjectId &&
      firebaseStorageBucket &&
      firebaseMessagingSenderId &&
      firebaseAppId,
  ),
} as const;
