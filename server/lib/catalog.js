// Sunucu kataloğu: ürün adı ve stok durumu için tek doğru kaynak. İstemciden yalnızca productId alınır;
// productName ve stok bilgisi buradan gelir. Kimlikler src/products.js içindeki ürünlerin slug'ıdır
// (catalog.test.js ikisinin eşleştiğini denetler).
const catalog = [
  { id: 'luna-seramik-kupa', name: 'Luna Seramik Kupa', inStock: true },
  { id: 'amber-soya-mum', name: 'Amber Soya Mum', inStock: true },
  { id: 'terra-minimal-kolye', name: 'Terra Minimal Kolye', inStock: false },
]

export const productIds = catalog.map((product) => product.id)

export function findProduct(id) {
  return catalog.find((product) => product.id === id)
}
