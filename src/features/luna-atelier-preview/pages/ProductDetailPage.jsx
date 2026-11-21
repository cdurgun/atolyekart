import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import Newsletter from '../components/Newsletter.jsx'
import QuantityStepper from '../components/QuantityStepper.jsx'
import { formatPrice } from '../data.js'
import { CONCEPT_LABEL, findProduct, isReal, productLabel, relatedTo } from '../products/index.js'
import { productRoute, routes } from '../routes.js'

// Ürün detayı: kimliğe göre gerçek ürün (src/products.js) ya da Stitch konsepti gösterilir.
// Gerçek ürün: görsel, ad, kategori, fiyat, açıklama, adet + sepete ekle. Kaynakta varyant ve
// stok bilgisi olmadığı için gösterilmez.
// Konsept: "Konsept Tasarım · Yakında"; fiyat, adet ve sepete ekleme yoktur.

function NotFound() {
  return (
    <main className="lp-main">
      <section className="lp-container lp-section">
        <div className="lp-pending">
          <div className="lp-pending-blob" aria-hidden="true" />
          <p className="lp-pill-label"><span className="lp-dot" />Koleksiyon</p>
          <h1 className="lp-heading-lg">Ürün bulunamadı</h1>
          <p className="lp-body-md lp-muted">Aradığınız parça koleksiyonda yer almıyor ya da adresi değişmiş olabilir.</p>
          <div className="lp-pending-actions">
            <a className="lp-button lp-button-primary" href={routes.catalog}>
              <Icon name="arrowLeft" size={18} />
              <span>Koleksiyona Dön</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

function Gallery({ product }) {
  const gallery = product.gallery ?? [{ id: 'ana', image: product.image, alt: product.name }]
  const [active, setActive] = useState(gallery[0].id)
  const activeImage = gallery.find((g) => g.id === active) ?? gallery[0]

  return (
    <>
      <div className="lp-gallery-stage" data-kind={product.kind}>
        <div className="lp-gallery-underlay" aria-hidden="true" />
        <img src={activeImage.image} alt={activeImage.alt} width="1200" height="900" />
        {isReal(product) ? null : <span className="lp-badge lp-badge-concept lp-gallery-badge">{CONCEPT_LABEL}</span>}
      </div>
      {gallery.length > 1 && (
        <ul className="lp-thumbs" aria-label="Ürün görselleri">
          {gallery.slice(1).map((g) => (
            <li key={g.id}>
              <button
                type="button"
                className="lp-thumb"
                aria-pressed={active === g.id}
                onClick={() => setActive(active === g.id ? gallery[0].id : g.id)}
              >
                <img src={g.image} alt="" width="300" height="200" loading="lazy" />
                <span>{g.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function RealBuyBox({ product, onAdd }) {
  const [qty, setQty] = useState(1)
  const total = formatPrice(product.price * qty)

  // Geri bildirim ortak CartToast bildirimidir (LunaPreviewApp).
  const addToCart = () => onAdd(product, qty)

  return (
    <>
      <div className="lp-price-row">
        <p className="lp-detail-price">{formatPrice(product.price)}</p>
      </div>
      <p className="lp-body-md lp-muted lp-detail-description">{product.description}</p>

      <div className="lp-buy-row">
        <QuantityStepper value={qty} onChange={setQty} label="Adet" />
        <button type="button" className="lp-button lp-button-primary lp-button-block" onClick={addToCart}>
          <Icon name="bag" size={18} />
          <span>Sepete Ekle • {total}</span>
        </button>
      </div>
      <div className="lp-sticky-buy" aria-label="Hızlı satın alma">
        <QuantityStepper value={qty} onChange={setQty} label="Adet" />
        <button type="button" className="lp-button lp-button-primary lp-button-block" onClick={addToCart}>
          <Icon name="bag" size={18} />
          <span>Sepete Ekle • {total}</span>
        </button>
      </div>
    </>
  )
}

function ConceptBox({ product }) {
  return (
    <>
      <div className="lp-price-row">
        <p className="lp-detail-soon">Yakında</p>
        <p className="lp-concept-flag"><Icon name="pen" size={16} />Fiyat ve sipariş bilgisi henüz yok</p>
      </div>
      <p className="lp-body-md lp-muted lp-detail-description">{product.description ?? product.note}</p>
      <div className="lp-concept-panel">
        <p className="lp-trust-title">Bu parça bir konsept tasarımdır</p>
        <p className="lp-body-sm lp-muted">
          Luna Atelier koleksiyonu için hazırlanan bir tasarım örneğidir; henüz üretimde değildir ve sepete eklenemez. Benzer bir parçayı atölyeye tarif edebilirsiniz.
        </p>
        <a className="lp-button lp-button-ghost lp-button-medium" href={routes.customOrder}>
          <span>Özel Sipariş Sayfasına Git</span>
          <Icon name="arrowRight" size={16} />
        </a>
      </div>
    </>
  )
}

export default function ProductDetailPage({ productId, onAdd }) {
  const product = findProduct(productId)
  if (!product) return <NotFound />

  const real = isReal(product)
  const related = relatedTo(product)

  return (
    <main className={real ? 'lp-main lp-detail-main' : 'lp-main'}>
      <section className="lp-container lp-detail">
        <div className="lp-gallery">
          <Gallery key={product.id} product={product} />
          {product.potterNote && (
            <aside className="lp-potter-note lp-desktop-only">
              <Icon name="pen" size={20} />
              <div>
                <h2 className="lp-heading-xs">Çömlekçinin Notu</h2>
                <p className="lp-body-sm lp-muted">"{product.potterNote}"</p>
              </div>
            </aside>
          )}
        </div>

        <div className="lp-buy">
          <nav className="lp-breadcrumb lp-desktop-only" aria-label="Sayfa yolu">
            <a href={routes.home}>Ana Sayfa</a>
            <span aria-hidden="true">/</span>
            <a href={routes.catalog}>{product.category}</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{product.name}</span>
          </nav>
          {!real && <p className="lp-badge lp-badge-concept lp-badge-static">{CONCEPT_LABEL} · Yakında</p>}
          <p className="lp-label">{productLabel(product)}</p>
          <h1 className="lp-heading-lg lp-detail-title">{product.name}</h1>

          {real ? <RealBuyBox key={product.id} product={product} onAdd={onAdd} /> : <ConceptBox product={product} />}

          {product.details && (
            <div className="lp-accordions">
              {product.details.map((d) => (
                <details key={d.title} className="lp-accordion" open={d.open}>
                  <summary>
                    <span>{d.title}</span>
                    <Icon name="chevronDown" size={18} />
                  </summary>
                  {d.items && (
                    <ul>
                      {d.items.map(([k, v]) => (
                        <li key={k}><strong>{k}</strong> {v}</li>
                      ))}
                    </ul>
                  )}
                  {d.text && <p>{d.text}</p>}
                  {d.note && <p className="lp-accordion-note">{d.note}</p>}
                </details>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="lp-container lp-section" aria-labelledby="lp-related-title">
        <div className="lp-section-head lp-section-head-rule">
          <div>
            <p className="lp-eyebrow">Küratörün Seçimi</p>
            <h2 id="lp-related-title" className="lp-heading-lg">Birlikte Uyum Sağlayan Parçalar</h2>
          </div>
          <a className="lp-text-link lp-text-link-primary" href={routes.catalog}>
            Tüm Koleksiyonu İncele <Icon name="arrowRight" size={14} />
          </a>
        </div>
        <ul className="lp-grid lp-grid-related">
          {related.map((p) => (
            <li key={p.id}>
              <article className="lp-related" data-kind={p.kind}>
                <a className="lp-related-media" href={productRoute(p.id)}>
                  <img src={p.image} alt={p.name} width="600" height="600" loading="lazy" />
                  <span className={isReal(p) ? 'lp-badge' : 'lp-badge lp-badge-concept'}>
                    {isReal(p) ? p.category : CONCEPT_LABEL}
                  </span>
                </a>
                <h3 className="lp-related-name"><a href={productRoute(p.id)}>{p.name}</a></h3>
                <p className="lp-label lp-muted">{productLabel(p)}</p>
                <div className="lp-related-foot">
                  {isReal(p) ? (
                    <>
                      <span className="lp-related-price">{formatPrice(p.price)}</span>
                      <button type="button" className="lp-round-add" aria-label={`${p.name} sepete ekle`} onClick={() => onAdd(p)}>
                        <Icon name="plus" size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="lp-tile-soon">Yakında</span>
                      <a className="lp-round-add" href={productRoute(p.id)} aria-label={`${p.name} tasarımını incele`}>
                        <Icon name="arrowRight" size={16} />
                      </a>
                    </>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      </section>

      <Newsletter
        id="lp-detay-bulten"
        title="Atölye Güncesi ve Fırın Açılışları"
        text="Yeni pişirim serilerinden, kısıtlı adetli özel koleksiyonlardan ve stüdyo atölyelerinden öncelikli haberdar olun."
        button="Abone Ol"
      />
    </main>
  )
}
