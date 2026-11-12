// Gerçek ürünler: tek kaynak mevcut AtölyeKart verisidir (src/products.js). Burada kopyalanmaz,
// yalnızca önizlemenin ihtiyaç duyduğu alanlarla okunur. Kimlik, sipariş formunun kullandığı
// productSlug() ile üretilir; böylece sunucu kataloğundaki kimliklerle aynıdır.
// Stok bilgisi bu kaynakta yoktur (sunucuya özeldir) ve önizlemede gösterilmez.
import { products } from '../../../products.js'
import { productSlug } from '../../../webhook/payload.js'

// "420 TL" → 420. Metin yalnızca sıralama ve sepet toplamı için sayıya çevrilir.
function parsePrice(text) {
  const digits = String(text).replace(/[^\d]/g, '')
  return digits ? Number(digits) : null
}

export const realProducts = products.map((product) => ({
  kind: 'real',
  id: productSlug(product),
  name: product.name,
  category: product.category,
  priceText: product.price,
  price: parsePrice(product.price),
  description: product.description,
  image: product.image,
}))
