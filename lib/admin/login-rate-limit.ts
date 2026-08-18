const adminLoginWindowMs = 10 * 60 * 1000;
const adminLoginMaxAttempts = 10;

const adminLoginAttempts = new Map<string, number[]>();

export function checkAdminLoginRateLimit(key: string) {
  const now = Date.now();
  const recentAttempts = (adminLoginAttempts.get(key) ?? []).filter(
    (timestamp) => now - timestamp < adminLoginWindowMs,
  );

  if (recentAttempts.length >= adminLoginMaxAttempts) {
    adminLoginAttempts.set(key, recentAttempts);
    return { allowed: false, retryAfterMs: adminLoginWindowMs - (now - recentAttempts[0]) };
  }

  recentAttempts.push(now);
  adminLoginAttempts.set(key, recentAttempts);
  return { allowed: true, retryAfterMs: 0 };
}
