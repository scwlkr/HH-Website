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

function readSupabaseUrl() {
  return normalizeAbsoluteUrl(
    readOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") ?? readOptionalEnv("SUPABASE_URL"),
  );
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
const supabaseUrl = readSupabaseUrl();
const supabaseAnonKey =
  readOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
  readOptionalEnv("SUPABASE_ANON_KEY");

export const env = {
  siteUrl: readSiteUrl(),
  contactEmailAddress,
  contactEmailHref: `mailto:${contactEmailAddress}`,
  contactPhoneHref,
  contactPhoneLabel: contactPhoneHref
    ? readOptionalEnv("HH_CONTACT_PHONE_LABEL") ??
      contactPhoneHref.replace(/^tel:/, "")
    : undefined,
  supabaseUrl,
  supabaseAnonKey,
  hasSupabasePublicEnv: Boolean(supabaseUrl && supabaseAnonKey),
} as const;
