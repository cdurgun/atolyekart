import CatalogQR from './components/CatalogQR.jsx'
import ProductList from './components/ProductList.jsx'

const products = [
  {
    name: 'Luna Seramik Kupa',
    category: 'Seramik',
    price: '420 TL',
    description: 'El yapımı, minimalist tasarımlı seramik kupa.',
    image: '/images/luna-seramik-kupa.jpg',
  },
  {
    name: 'Amber Soya Mum',
    category: 'Doğal Mumlar',
    price: '350 TL',
    description: 'Doğal soya mumundan, amber kokulu el yapımı mum.',
    image: '/images/amber-soya-mum.jpg',
  },
  {
    name: 'Terra Minimal Kolye',
    category: 'El Yapımı Aksesuarlar',
    price: '290 TL',
    description: 'Toprak tonlarında, sade tasarımlı el yapımı kolye.',
    image: '/images/terra-minimal-kolye.jpg',
  },
]

export default function App() {
  return (
    <>
      <header className="site-header">
        <h1>Luna Atelier</h1>
        <p>El emeğiyle, sana özel.</p>
      </header>

      <main>
        <section className="about">
          <h2>Atölye Hakkında</h2>
          <p>Luna Atelier, el yapımı dekorasyon ve yaşam ürünleri üreten küçük bir atölyedir. Her ürün tek tek, özenle ve küçük adetlerde hazırlanır.</p>
          <p>Sektör: El yapımı dekorasyon ve yaşam ürünleri</p>
          <h3>Hedef Kitle</h3>
          <ul>
            <li>El yapımı ve özgün ürünleri sevenler</li>
            <li>Evine sade, doğal dokunuşlar katmak isteyenler</li>
            <li>Sevdiklerine özel hediye arayanlar</li>
          </ul>
        </section>

        <section className="categories">
          <h2>Kategoriler</h2>
          <ul>
            <li>Seramik</li>
            <li>Doğal Mumlar</li>
            <li>El Yapımı Aksesuarlar</li>
          </ul>
        </section>

        <section className="catalog" id="urunler">
          <h2>Ürünler</h2>
          <ProductList products={products} />
          <CatalogQR />
        </section>
      </main>

      <footer className="site-footer">
        <p>&copy; 2026 Luna Atelier. Tüm ürünler el emeğiyle üretilir.</p>
      </footer>
    </>
  )
}
