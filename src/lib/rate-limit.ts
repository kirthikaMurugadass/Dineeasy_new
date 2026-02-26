type RateLimitEntry = {
  count: number;
  firstRequestAt: number;
};

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5;

const store = new Map<string, RateLimitEntry>();

export function getClientIdentifier(request: Request) {
  const forwardedFor =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "";

  const ip = forwardedFor.split(",")[0].trim() || "unknown";
  const ua = request.headers.get("user-agent") || "unknown";

  return `${ip}:${ua}`;
}

export function isRateLimited(key: string) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { count: 1, firstRequestAt: now });
    return false;
  }

  // Reset window if expired
  if (now - entry.firstRequestAt > WINDOW_MS) {
    store.set(key, { count: 1, firstRequestAt: now });
    return false;
  }

  entry.count += 1;
  store.set(key, entry);

  return entry.count > MAX_REQUESTS;
}

