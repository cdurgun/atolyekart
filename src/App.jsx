import { useState } from 'react'
import CatalogQR from './components/CatalogQR.jsx'
import CategoryFilter from './components/CategoryFilter.jsx'
import ProductList from './components/ProductList.jsx'
import RequestForm from './components/RequestForm.jsx'
import { products } from './products.js'


const categories = [...new Set(products.map((product) => product.category))]

export default function App() {
  const [category, setCategory] = useState('')
  const visibleProducts = category ? products.filter((product) => product.category === category) : products

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
          <CategoryFilter categories={categories} selected={category} onSelect={setCategory} />
          <ProductList products={visibleProducts} />
          <CatalogQR />
        </section>

        <section className="requests" id="siparis">
          <h2>Sipariş ve Bildirim</h2>
          <RequestForm kind="order" title="Sipariş Ver" products={products} />
          <RequestForm kind="stock-alert" title="Stok Bildirimi İste" products={products} />
        </section>
      </main>

      <footer className="site-footer">
        <p>&copy; 2026 Luna Atelier. Tüm ürünler el emeğiyle üretilir.</p>
        <p>
          <a href="/gizlilik.html">Gizlilik Politikası</a>
        </p>
      </footer>
    </>
  )
}
