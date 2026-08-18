function normalizeFirebaseAuthEmulatorOrigin(host) {
  if (!host || typeof host !== "string") return null;
  const trimmedHost = host.trim();
  if (!trimmedHost) return null;
  return trimmedHost.startsWith("http://") || trimmedHost.startsWith("https://")
    ? trimmedHost
    : `http://${trimmedHost}`;
}

export function buildContentSecurityPolicy({ firebaseAuthEmulatorHost } = {}) {
  const firebaseAuthEmulatorOrigin = normalizeFirebaseAuthEmulatorOrigin(
    firebaseAuthEmulatorHost,
  );
  const connectSources = [
    "'self'",
    "https://identitytoolkit.googleapis.com",
    "https://securetoken.googleapis.com",
    "https://www.google-analytics.com",
    "https://region1.google-analytics.com",
    ...(firebaseAuthEmulatorOrigin ? [firebaseAuthEmulatorOrigin] : []),
  ];

  return [
    "default-src 'self'",
    "base-uri 'self'",
    `connect-src ${connectSources.join(" ")}`,
    "font-src 'self' data:",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "img-src 'self' blob: data: https://firebasestorage.googleapis.com",
    "manifest-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "worker-src 'self' blob:",
  ].join("; ");
}

export const publicResponseHeaders = [
  {
    key: "Content-Security-Policy",
    value: buildContentSecurityPolicy({
      firebaseAuthEmulatorHost:
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST,
    }),
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
];

export const adminResponseHeaders = [
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];
