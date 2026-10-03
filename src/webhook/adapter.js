// Webhook adapter'ı: payload'u alır, teslim eder, { ok } döner. UI yalnızca sendEvent'i bilir.
// VITE_WEBHOOK_URL boşsa mock adapter çalışır; adres yazılınca HTTP adapter devreye girer.
// "mock:fail" değeri başarısız teslimatı denemek içindir.
// cdn/forms.js içindeki karşılığıyla aynı kalmalı.

const TIMEOUT_MS = 5000

// Tarayıcı X-Atolyekart-Signature göndermez: gizli anahtar istemci kodunda saklanamaz.
export function webhookHeaders(payload) {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Atolyekart-Event': payload.event,
    'X-Atolyekart-Delivery': payload.id,
  }
}

export function createMockAdapter({ fail = false, delay = 400 } = {}) {
  return {
    send(payload) {
      console.info('[webhook:mock]', JSON.stringify({ headers: webhookHeaders(payload), body: payload }))
      return new Promise((resolve) => setTimeout(() => resolve({ ok: !fail }), delay))
    },
  }
}

export function createHttpAdapter(url) {
  return {
    async send(payload) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: webhookHeaders(payload),
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        })
        return { ok: response.ok }
      } catch {
        return { ok: false }
      }
    },
  }
}

export function createAdapter(url) {
  if (!url || url.startsWith('mock:')) return createMockAdapter({ fail: url === 'mock:fail' })
  return createHttpAdapter(url)
}

const adapter = createAdapter(import.meta.env.VITE_WEBHOOK_URL)

export function sendEvent(payload) {
  return adapter.send(payload)
}
