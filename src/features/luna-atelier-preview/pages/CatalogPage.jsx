import { useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import Newsletter from '../components/Newsletter.jsx'
import ProductTile from '../components/ProductTile.jsx'
import { images } from '../data.js'
import { allProducts, categories, CONCEPT_LABEL, isReal, realProducts } from '../products/index.js'
import { routes } from '../routes.js'

// Kategori düğmeleri gerçek ürünlerden türetilir; konsept ürünler (hepsi seramik) "Seramik" altında listelenir.
const categoryFilters = [{ id: 'all', label: 'Tümü' }, ...categories.map((c) => ({ id: c, label: c }))]

// Stitch'in "Doku & Kil" satırının yerini alır: gerçek ürünle konsepti ayırır.
const kindFilters = [
  { id: 'real', label: 'Satışta' },
  { id: 'concept', label: CONCEPT_LABEL },
]

const sorts = [
  { id: 'featured', label: 'Öne Çıkanlar' },
  { id: 'price-asc', label: 'Fiyat: Artan' },
  { id: 'price-desc', label: 'Fiyat: Azalan' },
]

// Fiyat sıralamasında fiyatı olmayan konseptler, sıradan bağımsız olarak sonda kalır.
function byPrice(direction) {
  return (a, b) => {
    if (isReal(a) !== isReal(b)) return isReal(a) ? -1 : 1
    if (!isReal(a)) return 0
    return direction * (a.price - b.price)
  }
}

export default function CatalogPage({ onAdd }) {
  const [category, setCategory] = useState('all')
  const [kind, setKind] = useState(null)
  const [sort, setSort] = useState('featured')

  const visible = useMemo(() => {
    const list = allProducts.filter(
      (p) => (category === 'all' || p.category === category) && (!kind || p.kind === kind),
    )
    if (sort === 'price-asc') return [...list].sort(byPrice(1))
    if (sort === 'price-desc') return [...list].sort(byPrice(-1))
    return list
  }, [category, kind, sort])

  const realCount = visible.filter(isReal).length

  return (
    <main className="lp-main">
      <div className="lp-container">
        <nav className="lp-breadcrumb lp-desktop-only" aria-label="Sayfa yolu">
          <a href={routes.home}>Ana Sayfa</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Koleksiyonlar</span>
        </nav>
      </div>

      <section className="lp-container lp-catalog-intro">
        <div className="lp-catalog-intro-copy">
          <p className="lp-pill-label"><span className="lp-dot" />Atölye Koleksiyonu</p>
          <h1 className="lp-heading-xl lp-catalog-title">Doğal mineraller, ham taşçömlek ve sakin formlar.</h1>
          <p className="lp-body-md lp-muted">
            Atölyemizde tek tek elde hazırlanan, yavaş üretim anlayışıyla şekillenen sade sofra ve yaşam objeleri.
          </p>
        </div>
        <figure className="lp-catalog-intro-media">
          <div className="lp-catalog-intro-blob" aria-hidden="true" />
          <img src={images.katalogAtolye} alt="Çömlekçi çarkında benekli stoneware vazoyu şekillendiren eller" width="1200" height="655" />
          <figcaption>
            <em>Atölyeden bir an</em>
            <span>Luna Atelier</span>
          </figcaption>
        </figure>
      </section>

      <section className="lp-container lp-section-flush" aria-labelledby="lp-catalog-list-title">
        <h2 id="lp-catalog-list-title" className="lp-visually-hidden">Ürünler</h2>
        <div className="lp-filters">
          <div className="lp-chips lp-chips-scroll" role="group" aria-label="Kategori">
            {categoryFilters.map((c) => (
              <button
                key={c.id}
                type="button"
                className="lp-chip"
                aria-pressed={category === c.id}
                onClick={() => setCategory(c.id)}
              >
                {c.id === 'all' ? `${c.label} (${allProducts.length})` : c.label}
              </button>
            ))}
          </div>
          <label className="lp-sort">
            <span className="lp-sort-label"><Icon name="tune" size={16} className="lp-mobile-only" />Sırala:</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              {sorts.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <Icon name="chevronDown" size={16} className="lp-sort-chevron" />
          </label>
        </div>
        <div className="lp-subfilters">
          <span className="lp-label">Durum:</span>
          <div className="lp-chips lp-chips-small" role="group" aria-label="Ürün durumu">
            {kindFilters.map((k) => (
              <button
                key={k.id}
                type="button"
                className="lp-chip lp-chip-outline"
                aria-pressed={kind === k.id}
                onClick={() => setKind(kind === k.id ? null : k.id)}
              >
                {k.label}
              </button>
            ))}
          </div>
          <p className="lp-result-count" role="status">
            {visible.length} parça · {realCount} satışta
          </p>
        </div>

        {visible.length > 0 ? (
          <ul className="lp-grid lp-grid-catalog">
            {visible.map((product) => (
              <li key={product.id}>
                <ProductTile product={product} variant="open" showNote onAdd={onAdd} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="lp-empty">Bu seçime uyan parça yok. Filtreleri değiştirerek tekrar deneyin.</p>
        )}

        <div className="lp-load-more">
          <p className="lp-body-sm lp-muted">
            {allProducts.length} parçanın {visible.length} tanesi görüntüleniyor · satıştaki {realProducts.length} ürün atölye kataloğundan gelir
          </p>
          <p className="lp-legend-note">
            <span className="lp-badge lp-badge-concept lp-badge-static">{CONCEPT_LABEL}</span>
            etiketli parçalar tasarım örnekleridir; fiyatları belirlenmemiştir ve sipariş verilemez.
          </p>
        </div>
      </section>

      <section className="lp-container lp-section-tight" aria-labelledby="lp-notes-title">
        <div className="lp-notes">
          <div className="lp-notes-blob" aria-hidden="true" />
          <div className="lp-notes-copy">
            <p className="lp-eyebrow">Atölye Notları</p>
            <h2 id="lp-notes-title" className="lp-heading-lg">Kusursuzluk yerine, elin ve ateşin bıraktığı izler.</h2>
            <p className="lp-body-md lp-muted">
              Her parçanın yüzeyindeki küçük kabarcıklar, fırın alevinin bıraktığı yanık tonlar ve asimetrik çizgiler birer hata değil; seramiğin eşsiz kimliğidir.
            </p>
            <p className="lp-body-sm lp-muted">Bakım ve kullanım önerilerini sipariş teyidi sırasında atölyeden alabilirsiniz.</p>
          </div>
          <div className="lp-notes-media">
            <img src={images.carkBasindaEller} alt="Çömlekçi çarkında kil şekillendiren atölye ustası" width="1200" height="655" loading="lazy" />
          </div>
        </div>
      </section>

      <Newsletter
        id="lp-katalog-bulten"
        layout="centered"
        title="Yeni fırın açılışlarından haberdar olun."
        text="Küçük partiler halinde üretilen yeni koleksiyonlar ve özel atölye davetleri için bültenimize katılın."
        button="Abone Ol"
      />
    </main>
  )
}
