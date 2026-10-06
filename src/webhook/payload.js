// İstek gövdesi: formun /api uç noktasına gönderdiği düz gövdeyi üretir.
// Webhook olayını (event, productName, imza) sunucu üretir: server/lib/webhook.js.
// cdn/forms.js içindeki karşılığıyla aynı kalmalı.

// path: uç nokta. event: sunucunun webhook'a yazdığı olay adı. fields: formdaki alanlar (sırayla).
// optional: boş bırakılabilenler. body: istek gövdesindeki alanlar (sırayla).
export const requestKinds = {
  order: {
    path: '/api/order',
    event: 'order.requested',
    fields: ['name', 'product', 'quantity', 'phone', 'email', 'consent'],
    optional: ['email'],
    body: ['name', 'productId', 'phone', 'email', 'quantity', 'consent', 'source'],
  },
  'stock-alert': {
    path: '/api/stock-request',
    event: 'stock_alert.requested',
    fields: ['name', 'product', 'email', 'consent'],
    optional: [],
    body: ['name', 'productId', 'email', 'consent', 'source'],
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

// values: validateRequest'ten gelen temiz değerler; product: seçilen ürün; source: 'react', 'cdn' ya da 'mobile'.
// productName gönderilmez: sunucu adı kendi kataloğundan yazar.
export function buildRequestBody(kind, values, product, source) {
  const all = { ...values, productId: productSlug(product), source }
  return Object.fromEntries(requestKinds[kind].body.map((key) => [key, all[key]]))
}
