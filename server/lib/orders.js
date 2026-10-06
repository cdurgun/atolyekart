// Son siparişler: veritabanı yok, liste bu instance'ın belleğinde durur (en fazla 50 kayıt).
// Instance yeniden başlayınca boşalır ve instance'lar arasında paylaşılmaz; yalnızca /api/admin/orders gösterimi içindir.
const MAX_ORDERS = 50
const orders = []

export function recordOrder(event) {
  orders.unshift({ receivedAt: new Date().toISOString(), ...event })
  orders.length = Math.min(orders.length, MAX_ORDERS)
}

export function listOrders() {
  return [...orders]
}

export function clearOrders() {
  orders.length = 0
}
