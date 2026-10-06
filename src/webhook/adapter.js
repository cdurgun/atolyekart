// API adapter'ı: hazır istek gövdesini alır, /api uç noktasına gönderir, { ok, message, errors } döner.
// Webhook adresi ve gizli anahtar burada yoktur: ikisi de yalnızca sunucudadır (server/lib/webhook.js).
// VITE_API_URL boşsa istek sayfanın kendi alan adına gider; "mock:" ağ isteği yapmaz, "mock:fail" hatayı dener.

const TIMEOUT_MS = 8000

export function createMockAdapter({ fail = false, delay = 400 } = {}) {
  return {
    send(path, body) {
      console.info('[api:mock]', JSON.stringify({ path, body }))
      return new Promise((resolve) => setTimeout(() => resolve({ ok: !fail }), delay))
    },
  }
}

export function createHttpAdapter(base) {
  return {
    async send(path, body) {
      try {
        const response = await fetch(base + path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        })
        // Sunucunun Türkçe mesajı ve alan hataları varsa forma taşınır.
        const data = await response.json().catch(() => ({}))
        return { ok: response.ok, message: data.message, errors: data.errors }
      } catch {
        return { ok: false }
      }
    },
  }
}

export function createAdapter(url = '') {
  if (url.startsWith('mock:')) return createMockAdapter({ fail: url === 'mock:fail' })
  return createHttpAdapter(url.replace(/\/$/, ''))
}

const adapter = createAdapter(import.meta.env.VITE_API_URL)

export function sendRequest(path, body) {
  return adapter.send(path, body)
}
