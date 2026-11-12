import Icon from './Icon.jsx'
import { formatPrice } from '../data.js'
import { CONCEPT_LABEL, isReal, productLabel } from '../products/index.js'
import { productRoute } from '../routes.js'

// Ana sayfa ve katalogdaki ürün kartı; her kart kendi detay sayfasına (#/urun/<kimlik>) gider.
// variant="framed": ana sayfa kartı · variant="open": katalog kartı
// Gerçek ürün: fiyat + "Sepete Ekle". Konsept ürün: "Konsept Tasarım" etiketi, "Yakında",
// sepete ekleme düğmesi yok.
export default function ProductTile({ product, variant = 'framed', showNote = false, onAdd }) {
  const real = isReal(product)
  const href = productRoute(product.id)

  return (
    <article className={`lp-tile lp-tile-${variant}`} data-kind={product.kind}>
      <a className="lp-tile-media" href={href}>
        <img src={product.image} alt={product.name} loading="lazy" width="600" height="600" />
        {!real && <span className="lp-badge lp-badge-concept">{CONCEPT_LABEL}</span>}
      </a>
      <div className="lp-tile-meta">
        <div>
          <p className="lp-label lp-tile-label">{productLabel(product)}</p>
          <h3 className="lp-tile-name">
            <a href={href}>{product.name}</a>
          </h3>
          {showNote && (real ? product.description : product.note) && (
            <p className="lp-tile-note">{real ? product.description : product.note}</p>
          )}
        </div>
        {real ? (
          <p className="lp-tile-price">{formatPrice(product.price)}</p>
        ) : (
          <p className="lp-tile-soon">Yakında</p>
        )}
      </div>
      {real ? (
        <>
          <button type="button" className="lp-tile-add" onClick={() => onAdd(product)}>
            <Icon name="plus" size={16} />
            <span>Sepete Ekle</span>
          </button>
          <button type="button" className="lp-tile-add-round" aria-label={`${product.name} sepete ekle`} onClick={() => onAdd(product)}>
            <Icon name="plus" size={16} />
          </button>
        </>
      ) : (
        <a className="lp-tile-add lp-tile-view" href={href}>
          <span>Tasarımı İncele</span>
          <Icon name="arrowRight" size={14} />
        </a>
      )}
    </article>
  )
}
