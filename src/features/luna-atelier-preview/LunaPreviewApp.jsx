import { useEffect, useRef, useState } from 'react'
import SiteHeader from './components/SiteHeader.jsx'
import CheckoutHeader from './components/CheckoutHeader.jsx'
import SiteFooter from './components/SiteFooter.jsx'
import ChatWidget from './components/ChatWidget.jsx'
import CartToast from './components/CartToast.jsx'
import { addLine } from './checkout/cart.js'
import HomePage from './pages/HomePage.jsx'
import CatalogPage from './pages/CatalogPage.jsx'
import ProductDetailPage from './pages/ProductDetailPage.jsx'
import CartCheckoutPage from './pages/CartCheckoutPage.jsx'
import CustomOrderPage from './pages/CustomOrderPage.jsx'
import OrderReceivedPage from './pages/OrderReceivedPage.jsx'
import { isReal } from './products/index.js'
import {
  currentRoute,
  homeSections,
  pageTitle,
  PRODUCT_PREFIX,
  productIdFrom,
  routes,
} from './routes.js'

// /luna-preview: Stitch Luna Atelier tasarımının bağımsız önizlemesi.
// Sepet yalnızca bu sayfanın belleğindedir (tarayıcıda saklanmaz), boş başlar ve yalnızca gerçek ürünleri
// (src/products.js) kabul eder. Sipariş talebi mevcut POST /api/order akışıyla, her satır için ayrı istek
// olarak gönderilir (checkout/submitOrder.js). Özel sipariş sayfası bu akışa bağlı değildir.
export default function LunaPreviewApp() {
  const [route, setRoute] = useState(currentRoute)
  const [cart, setCart] = useState([])
  // Bu ödemede gönderilmiş satırlar (kısmi başarıda birikir).
  const [sent, setSent] = useState([])
  // Talep tamamlandı mı: onay ekranı yalnızca bunu gösterir; ürün listesi ve tutar tutulmaz.
  const [received, setReceived] = useState(false)
  // Sepete her eklemede artar; CartToast bildirimi gösterir.
  const [toastSignal, setToastSignal] = useState(0)
  const previousRoute = useRef(route)

  useEffect(() => {
    const onHashChange = () => setRoute(currentRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Onay ekranından ayrılınca bayrak sıfırlanır; geri tuşuyla dönülürse boş durum görünür.
  useEffect(() => {
    if (previousRoute.current === routes.orderReceived && route !== routes.orderReceived) setReceived(false)
    previousRoute.current = route
  }, [route])

  useEffect(() => {
    document.title = pageTitle(route)
    const sectionId = homeSections[route]
    const target = sectionId && document.getElementById(sectionId)
    if (target) target.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [route])

  function addToCart(product, qty = 1) {
    // Konsept ürünler sepete giremez; arayüz düğme göstermese de burada da engellenir.
    if (!isReal(product)) return
    setCart((items) => addLine(items, product, qty))
    setToastSignal((n) => n + 1)
  }

  const setQty = (id, qty) => setCart((items) => items.map((item) => (item.id === id ? { ...item, qty } : item)))
  const remove = (id) => setCart((items) => items.filter((item) => item.id !== id))

  // Başarılı satırlar sepetten hemen düşer; yeniden gönderimde tekrar gönderilmezler.
  function markSent(lines) {
    const ids = new Set(lines.map((line) => line.id))
    setCart((items) => items.filter((item) => !ids.has(item.id)))
    setSent((items) => [...items, ...lines])
  }

  // Yalnızca tüm satırlar başarıyla iletildiğinde çağrılır: sepet ve gönderilenler listesi tamamen
  // temizlenir, onay ekranına geçilir. Form, sepet sayfası kapandığı için kendiliğinden sıfırlanır.
  // Hata durumunda bu fonksiyon çağrılmaz; sepet ve form olduğu gibi kalır.
  function completeOrder() {
    setCart([])
    setSent([])
    setReceived(true)
    window.location.hash = routes.orderReceived
  }
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0)

  const isCart = route === routes.cart
  const isCheckout = isCart || route === routes.orderReceived
  const isHome = route === routes.home || route in homeSections

  return (
    <div className="lp">
      {/* Hash rotayı bozmamak için atlama bağlantısı odağı JS ile taşır. */}
      <a
        className="lp-skip"
        href="#lp-content"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('lp-content').focus()
        }}
      >
        İçeriğe geç
      </a>
      {isCheckout ? <CheckoutHeader step={isCart ? 0 : 2} /> : <SiteHeader route={route} cartCount={cartCount} />}
      <div id="lp-content" tabIndex={-1}>
        {isHome && <HomePage onAdd={addToCart} />}
        {route === routes.catalog && <CatalogPage onAdd={addToCart} />}
        {route.startsWith(PRODUCT_PREFIX) && <ProductDetailPage productId={productIdFrom(route)} onAdd={addToCart} />}
        {isCart && (
          <CartCheckoutPage cart={cart} sent={sent} onQty={setQty} onRemove={remove} onSent={markSent} onComplete={completeOrder} />
        )}
        {route === routes.orderReceived && <OrderReceivedPage received={received} />}
        {route === routes.customOrder && <CustomOrderPage />}
      </div>
      <SiteFooter
        tagline={isCheckout ? 'Zanaat, toprak ve zamansız estetiğin buluşma noktası.' : undefined}
        signature={isCheckout ? 'El emeğiyle, sana özel.' : undefined}
      />
      <ChatWidget />
      <CartToast signal={toastSignal} />
    </div>
  )
}
