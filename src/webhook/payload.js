// Webhook payload'u: .claude/skills/atolyekart-standartlari/webhook-format.md sözleşmesini üretir.
// cdn/forms.js içindeki karşılığıyla aynı kalmalı.

export const requestKinds = {
  order: { event: 'order.requested', contact: 'phone' },
  'stock-alert': { event: 'stock_alert.requested', contact: 'email' },
}

const turkishLetters = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }

// Slug görsel dosya adının uzantısız halidir; görsel yoksa ürün adından üretilir.
export function productSlug(product) {
  if (product.image) return product.image.split('/').pop().replace(/\.[^.]+$/, '')
  return product.name
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (letter) => turkishLetters[letter])
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function productObject(product, baseUrl) {
  return {
    slug: productSlug(product),
    name: product.name,
    category: product.category,
    // "1.250,50 TL" -> 1250.5
    price: { amount: Number(product.price.replace(/[^\d,]/g, '').replace(',', '.')), currency: 'TRY' },
    image_url: product.image ? new URL(product.image, baseUrl).href : null,
  }
}

function eventId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `evt_${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

// context: { source, pageUrl, baseUrl }
export function buildEvent(event, data, context) {
  return {
    id: eventId(),
    event,
    version: '1',
    occurred_at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    source: context.source,
    page_url: context.pageUrl,
    data,
  }
}

// values: validateRequest'ten gelen temiz değerler; product: seçilen ürün.
export function buildRequestEvent(kind, values, product, context) {
  const { event, contact } = requestKinds[kind]
  return buildEvent(
    event,
    {
      product: productObject(product, context.baseUrl),
      customer: { name: values.name, [contact]: values[contact] },
    },
    context,
  )
}
