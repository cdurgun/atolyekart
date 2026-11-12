import { useEffect, useState } from 'react'
import SiteHeader from './components/SiteHeader.jsx'
import CheckoutHeader from './components/CheckoutHeader.jsx'
import SiteFooter from './components/SiteFooter.jsx'
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
// Sepet yalnızca bu sayfanın belleğindedir, boş başlar ve yalnızca gerçek ürünleri (src/products.js) kabul eder.
// Sipariş talebi mevcut POST /api/order akışıyla, her satır için ayrı istek olarak gönderilir
// (checkout/submitOrder.js). Özel sipariş sayfası bu akışa bağlı değildir.
export default function LunaPreviewApp() {
  const [route, setRoute] = useState(currentRoute)
  const [cart, setCart] = useState([])
  // Bu ödemede gönderilmiş satırlar (kısmi başarıda birikir) ve son tamamlanan talebin özeti.
  const [sent, setSent] = useState([])
  const [received, setReceived] = useState([])

  useEffect(() => {
    const onHashChange = () => setRoute(currentRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

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
    setCart((items) => {
      const existing = items.find((item) => item.id === product.id)
      if (existing) {
        return items.map((item) => (item.id === product.id ? { ...item, qty: Math.min(item.qty + qty, 12) } : item))
      }
      return [
        ...items,
        {
          id: product.id,
          name: product.name,
          label: product.category,
          price: product.price,
          qty,
          image: product.image,
        },
      ]
    })
  }

  const setQty = (id, qty) => setCart((items) => items.map((item) => (item.id === id ? { ...item, qty } : item)))
  const remove = (id) => setCart((items) => items.filter((item) => item.id !== id))

  // Başarılı satırlar sepetten hemen düşer; yeniden gönderimde tekrar gönderilmezler.
  function markSent(lines) {
    const ids = new Set(lines.map((line) => line.id))
    setCart((items) => items.filter((item) => !ids.has(item.id)))
    setSent((items) => [...items, ...lines])
  }

  // Sepette gönderilmemiş satır kalmayınca onay ekranına geçilir.
  function completeOrder(lines) {
    setReceived([...sent, ...lines])
    setSent([])
    setCart((items) => items.filter((item) => !lines.some((line) => line.id === item.id)))
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
        {route === routes.orderReceived && <OrderReceivedPage lines={received} />}
        {route === routes.customOrder && <CustomOrderPage />}
      </div>
      <SiteFooter
        tagline={isCheckout ? 'Zanaat, toprak ve zamansız estetiğin buluşma noktası.' : undefined}
        signature={isCheckout ? 'El emeğiyle, sana özel.' : undefined}
      />
    </div>
  )
}
