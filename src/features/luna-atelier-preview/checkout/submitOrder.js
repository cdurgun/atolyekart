// Önizleme sepetini mevcut sipariş akışına bağlar: iletişim doğrulaması → her satır için
// buildRequestBody('order') → send('/api/order'). Sunucu ve webhook sözleşmesi değişmez.
//
// - API talep başına tek ürün kabul eder; sepetin her satırı ayrı bir POST /api/order isteğidir.
// - İstekler sırayla gönderilir. Sonuç satır bazındadır; arayüz başarılı satırları sepetten
//   düşürür, böylece yeniden gönderim aynı satırı ikinci kez göndermez.
// - Fiyat gönderilmez (sunucu kataloğunda fiyat yoktur); stok kararını sunucu verir (409).
// - send dışarıdan verilir: tarayıcıda adapter.js'teki sendRequest, testlerde sahte fonksiyon.
//   (adapter.js import.meta.env kullandığı için Node testlerinde doğrudan içe aktarılmaz.)
import { products } from '../../../products.js'
import { buildRequestBody, productSlug, requestKinds } from '../../../webhook/payload.js'
import { validateRequest } from '../../../webhook/validation.js'

// Ürün ve adet satırdan gelir; formda yalnızca iletişim alanları ve açık rıza vardır.
export const contactFields = ['name', 'phone', 'email', 'consent']
const contactSpec = { fields: contactFields, optional: ['email'] }

export const FAILURE_TEXT = 'Gönderilemedi. Bağlantınızı kontrol edip yeniden deneyin.'
export const NOT_ORDERABLE_TEXT = 'Bu parça siparişe açık değil.'
export const SKIPPED_TEXT = 'Gönderilmedi. Bilgileri düzeltip yeniden deneyin.'
export const OUT_OF_STOCK_TEXT = 'Bu ürün şu anda stokta olmadığı için siparişe açılamıyor.'

// Sunucunun 409 out_of_stock mesajı stok bildirimi önerir; önizlemede bu özellik yoktur.
// Adapter hata kodunu iletmediği için mesaj metninden tanınır. Sunucu metni değişirse
// submitOrder.test.js'teki gerçek sunucu testi bunu yakalar.
function previewMessage(message) {
  return typeof message === 'string' && /stokta yok/i.test(message) ? OUT_OF_STOCK_TEXT : message
}

// Yalnızca src/products.js'teki gerçek ürünler siparişe gidebilir; konsept kimlikleri burada yoktur.
const catalog = new Map(products.map((product) => [productSlug(product), product]))

export const isOrderable = (id) => catalog.has(id)

export function validateContact(raw) {
  return validateRequest(raw, contactSpec, [])
}

// Tahmini toplam: fiyat src/products.js'ten gelir, yalnızca bilgi amaçlıdır.
export function cartTotals(lines) {
  return lines.reduce(
    (totals, line) => ({ count: totals.count + line.qty, total: totals.total + line.price * line.qty }),
    { count: 0, total: 0 },
  )
}

// lines: sepet satırları ({ id, qty, ... }). values: validateContact'tan gelen temiz değerler.
// Döner: her satır için { id, ok, message?, errors? }. Sunucu alan hatası dönerse (ör. telefon)
// diğer satırlar da aynı nedenle reddedileceği için kalanlar gönderilmez ve "skipped" işaretlenir.
export async function submitOrder(lines, values, send) {
  const results = []
  let stop = false
  for (const line of lines) {
    if (stop) {
      results.push({ id: line.id, ok: false, skipped: true, message: SKIPPED_TEXT })
      continue
    }
    const product = catalog.get(line.id)
    if (!product) {
      results.push({ id: line.id, ok: false, message: NOT_ORDERABLE_TEXT })
      continue
    }
    const body = buildRequestBody('order', { ...values, quantity: line.qty }, product, 'react')
    let response
    try {
      response = await send(requestKinds.order.path, body)
    } catch {
      response = { ok: false }
    }
    if (response?.ok === true) {
      results.push({ id: line.id, ok: true })
    } else {
      results.push({ id: line.id, ok: false, message: previewMessage(response?.message) ?? FAILURE_TEXT, errors: response?.errors })
      if (response?.errors) stop = true
    }
  }
  return results
}
