// Önizleme içi gezinme, router bağımlılığı olmadan hash ile yapılır: /luna-preview/#/katalog
// Mevcut AtölyeKart sayfalarının routing'ine dokunmaz. Gerçek içeriği olmayan sayfalara
// (teslimat, iade, sosyal medya vb.) bağlantı verilmez; tek dış bağlantı gerçek /gizlilik.html'dir.
import { findProduct } from './products/index.js'

export const routes = {
  home: '#/',
  catalog: '#/katalog',
  cart: '#/sepet',
  orderReceived: '#/siparis-alindi',
  customOrder: '#/ozel-siparis',
  story: '#/atolye',
  journal: '#/gunluk',
}

// Ürün detayı: #/urun/<ürün kimliği>. Gerçek ürünlerde kimlik productSlug() ile üretilir.
export const PRODUCT_PREFIX = '#/urun/'
export const productRoute = (id) => `${PRODUCT_PREFIX}${id}`
export const productIdFrom = (route) => decodeURIComponent(route.slice(PRODUCT_PREFIX.length))

// Ana sayfadaki bir bölüme kaydırılan rotalar.
export const homeSections = {
  [routes.story]: 'lp-atolye',
  [routes.journal]: 'lp-gunluk',
}


// Bilinmeyen ürün kimliği de ürün rotası sayılır; detay sayfası "bulunamadı" durumunu gösterir.
export function currentRoute() {
  const hash = window.location.hash || routes.home
  if (Object.values(routes).includes(hash)) return hash
  if (hash.startsWith(PRODUCT_PREFIX) && hash.length > PRODUCT_PREFIX.length) return hash
  return routes.home
}

const previewTitle = 'Luna Atelier — Tasarım Önizlemesi'

export function pageTitle(route) {
  if (route.startsWith(PRODUCT_PREFIX)) {
    const product = findProduct(productIdFrom(route))
    return `${product ? product.name : 'Ürün bulunamadı'} — Luna Atelier Önizlemesi`
  }
  return {
    [routes.catalog]: 'Koleksiyonlar — Luna Atelier Önizlemesi',
    [routes.cart]: 'Sepet ve Sipariş Talebi — Luna Atelier Önizlemesi',
    [routes.orderReceived]: 'Talep Özeti — Luna Atelier Önizlemesi',
    [routes.customOrder]: 'Özel Sipariş — Luna Atelier Önizlemesi',
  }[route] ?? previewTitle
}
