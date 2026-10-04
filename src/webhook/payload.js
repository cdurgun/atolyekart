// Webhook payload'u: .claude/skills/atolyekart-standartlari/webhook-format.md sözleşmesini üretir.
// Gövde yalnızca sözleşmedeki alanları taşır. cdn/forms.js içindeki karşılığıyla aynı kalmalı.

// fields: formdaki alanlar (sırayla). optional: boş bırakılabilenler. body: gövdedeki alanlar (sırayla).
export const requestKinds = {
  order: {
    event: 'order.requested',
    fields: ['name', 'product', 'quantity', 'phone', 'email'],
    optional: ['email'],
    body: ['event', 'name', 'productId', 'productName', 'phone', 'email', 'quantity', 'source'],
  },
  'stock-alert': {
    event: 'stock_alert.requested',
    fields: ['name', 'product', 'email'],
    optional: [],
    body: ['event', 'name', 'productId', 'productName', 'email', 'source'],
  },
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

// values: validateRequest'ten gelen temiz değerler; product: seçilen ürün; source: 'react' ya da 'cdn'.
export function buildRequestEvent(kind, values, product, source) {
  const { event, body } = requestKinds[kind]
  const all = { ...values, event, productId: productSlug(product), productName: product.name, source }
  return Object.fromEntries(body.map((key) => [key, all[key]]))
}
