const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const requestLog = new Map<string, number[]>();

export function checkInquiryRateLimit(key: string) {
  const now = Date.now();
  const recentAttempts = (requestLog.get(key) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );

  if (recentAttempts.length >= MAX_ATTEMPTS) {
    requestLog.set(key, recentAttempts);

    return {
      allowed: false,
      retryAfterMs: WINDOW_MS - (now - recentAttempts[0]),
    };
  }

  recentAttempts.push(now);
  requestLog.set(key, recentAttempts);

  return {
    allowed: true,
    retryAfterMs: 0,
  };
}
