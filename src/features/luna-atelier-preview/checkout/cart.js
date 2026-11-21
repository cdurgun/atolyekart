// Sepet satırı ekleme mantığı (saf fonksiyon; LunaPreviewApp kullanır, node:test ile sınanır).
// Aynı ürün yeniden eklenirse yeni satır açılmaz, adet artar; adet MAX_QTY ile sınırlıdır.
// Konsept ürün kontrolü (isReal) çağıran tarafta yapılır.

export const MAX_QTY = 12

export function addLine(items, product, qty = 1) {
  const existing = items.find((item) => item.id === product.id)
  if (existing) {
    return items.map((item) => (item.id === product.id ? { ...item, qty: Math.min(item.qty + qty, MAX_QTY) } : item))
  }
  return [
    ...items,
    {
      id: product.id,
      name: product.name,
      label: product.category,
      price: product.price,
      qty: Math.min(qty, MAX_QTY),
      image: product.image,
    },
  ]
}
