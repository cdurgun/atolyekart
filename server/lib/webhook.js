// Webhook teslimatı: olay gövdesini üretir, imzalar ve WEBHOOK_URL adresine gönderir.
// Adres ve gizli anahtar yalnızca sunucu ortam değişkenlerindedir; istemciye hiçbir biçimde gitmez.
import { createHmac } from 'node:crypto'
import { requestKinds } from '../../src/webhook/payload.js'

const TIMEOUT_MS = 5000

// Gövde sözleşmesi: .claude/skills/atolyekart-standartlari/webhook-format.md
const eventBody = {
  order: ['event', 'name', 'productId', 'productName', 'phone', 'email', 'quantity', 'consent', 'source'],
  'stock-alert': ['event', 'name', 'productId', 'productName', 'email', 'consent', 'source'],
}

// productName istemciden değil, sunucu kataloğundaki üründen gelir.
export function buildEvent(kind, values, product) {
  const all = { ...values, event: requestKinds[kind].event, productId: product.id, productName: product.name }
  return Object.fromEntries(eventBody[kind].map((key) => [key, all[key]]))
}

export function sign(body, secret) {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`
}

export async function deliverEvent(event) {
  const url = process.env.WEBHOOK_URL
  const secret = process.env.WEBHOOK_SECRET
  const production = process.env.VERCEL_ENV === 'production'
  const body = JSON.stringify(event)

  // Canlıda eksik yapılandırma sessizce geçilmez; geliştirmede adres yoksa olay günlüğe yazılır (mock).
  if (production && (!url || !secret)) {
    console.error('[webhook] WEBHOOK_URL ya da WEBHOOK_SECRET tanımlı değil')
    return { ok: false }
  }
  if (!url) {
    console.info('[webhook:mock]', body)
    return { ok: true }
  }

  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'X-Atolyekart-Event': event.event }
  if (secret) headers['X-Atolyekart-Signature'] = sign(body, secret)

  try {
    const response = await fetch(url, { method: 'POST', headers, body, signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!response.ok) console.error('[webhook] teslim edilemedi, durum:', response.status)
    return { ok: response.ok }
  } catch (error) {
    console.error('[webhook] teslim edilemedi:', error.name)
    return { ok: false }
  }
}
