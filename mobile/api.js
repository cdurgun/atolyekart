// Mobil API istemcisi: web'deki src/webhook/adapter.js'in karşılığı. Aynı /api uç noktalarını çağırır.
// Uygulamada sır yoktur; webhook adresi ve anahtarlar yalnızca sunucudadır.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://atolyekart-tawny.vercel.app').replace(/\/$/, '')

const TIMEOUT_MS = 8000

export async function sendRequest(path, body) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(API_URL + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const data = await response.json().catch(() => ({}))
    return { ok: response.ok, message: data.message, errors: data.errors }
  } catch {
    return { ok: false }
  } finally {
    clearTimeout(timer)
  }
}
