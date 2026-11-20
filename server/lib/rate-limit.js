// IP başına sabit pencereli rate limit. Formlar için dakikada 10 istek; /api/chat kendi sayaçlarını kullanır
// (server/routes/chat.js). Aşılırsa 429 ve Retry-After döner.
//
// SINIRLAMA: Sayaç bu sürecin belleğinde durur. Vercel'de her fonksiyon instance'ının belleği ayrıdır;
// trafik birden çok instance'a dağılırsa ya da instance yeniden başlarsa (cold start) sayaç paylaşılmaz
// ve sıfırlanır. Yani sınır "instance başına"dır; gerçek üst sınır 10 × instance sayısı olabilir.
// Ödev kapsamı için bu yeterli. Kesin, paylaşımlı bir sınır gerekirse sayaç ortak bir depoya
// (ör. Upstash Redis) ya da Vercel Firewall'un rate limit kuralına taşınmalıdır.
export const LIMIT = 10
export const WINDOW_MS = 60_000

const MAX_KEYS = 5000
const limiters = new Set()

// Sabit pencereli sayaç üretir. Her sayaç kendi belleğini tutar; formlar ve sohbet ayrı sayaç kullanır,
// böylece sohbet trafiği sipariş formunu kilitlemez (ve tersi).
export function createRateLimiter({ limit, windowMs }) {
  const windows = new Map()
  limiters.add(windows)
  return {
    limit,
    windowMs,
    check(key, now = Date.now()) {
      let entry = windows.get(key)
      if (!entry || now >= entry.resetAt) {
        if (windows.size >= MAX_KEYS) {
          for (const [other, value] of windows) if (now >= value.resetAt) windows.delete(other)
          if (windows.size >= MAX_KEYS) windows.clear()
        }
        entry = { count: 0, resetAt: now + windowMs }
        windows.set(key, entry)
      }
      entry.count += 1
      return { allowed: entry.count <= limit, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
    },
  }
}

// Formlar ve admin uç noktası için ortak sayaç (dakikada 10).
const defaultLimiter = createRateLimiter({ limit: LIMIT, windowMs: WINDOW_MS })

export function rateLimit(key, now = Date.now()) {
  return defaultLimiter.check(key, now)
}

// Testler için: tüm sayaçları sıfırlar.
export function resetRateLimit() {
  for (const windows of limiters) windows.clear()
}
