import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import Newsletter from '../components/Newsletter.jsx'
import ProductTile from '../components/ProductTile.jsx'
import { images } from '../data.js'
import { AMFORA_ID, categories, featuredProducts } from '../products/index.js'
import { productRoute, routes } from '../routes.js'

// Filtre düğmeleri gerçek kategorilerden gelir (src/products.js).
const homeFilters = [{ id: 'all', label: 'Tümü' }, ...categories.map((c) => ({ id: c, label: c }))]

// Yalnızca işletmenin gerçekten sunduğu özellikler yazılır (el yapımı, atölye teyidi).
// Fırın sıcaklığı, sır bileşimi, seri numarası ya da adres gibi doğrulanmamış bilgiler eklenmez.
const metrics = [
  { value: 'El Yapımı', label: 'Üretim' },
  { value: 'Tek Tek', label: 'Hazırlanan Parçalar' },
  { value: 'Telefonla', label: 'Sipariş Teyidi' },
]

const values = [
  { icon: 'pen', label: 'Elde Şekillendirme' },
  { icon: 'leaf', label: 'Sade, Doğal Dokular' },
  { icon: 'checkCircle', label: 'Atölye Teyidiyle Sipariş' },
]

export default function HomePage({ onAdd }) {
  const [filter, setFilter] = useState('all')
  const visible = filter === 'all' ? featuredProducts : featuredProducts.filter((p) => p.category === filter)

  return (
    <main className="lp-main">
      <section className="lp-container lp-hero-wrap">
        <div className="lp-hero">
          <div className="lp-hero-blob lp-hero-blob-a" aria-hidden="true" />
          <div className="lp-hero-blob lp-hero-blob-b" aria-hidden="true" />
          <div className="lp-hero-grid">
            <div className="lp-hero-media">
              <div className="lp-hero-underlay" aria-hidden="true" />
              <img
                className="lp-hero-image"
                src={images.atolyeCarkBasinda}
                alt="Güneşli atölyede çömlekçi çarkında kil şekillendiren seramik sanatçısı"
                width="1200"
                height="655"
              />
              <span className="lp-hero-tag lp-mobile-only"><span className="lp-dot" />El Yapımı</span>
            </div>
            <div className="lp-hero-copy">
              <p className="lp-pill-label lp-desktop-only"><span className="lp-dot" />El Yapımı Zanaat Atölyesi</p>
              <p className="lp-eyebrow lp-mobile-only">El Yapımı &amp; Zanaat</p>
              <h1 className="lp-heading-xl">
                Toprağın ve Suyun <br className="lp-desktop-only" />
                <em>Zamansız Uyumu</em>
              </h1>
              <p className="lp-body-lg lp-muted lp-hero-text">
                Küçük atölyemizde sabırla, elde hazırlanan; doğanın sade dokusunu evinize taşıyan seramik ve yaşam objeleri.
              </p>
              <div className="lp-hero-actions">
                <a className="lp-button lp-button-primary" href={routes.catalog}>
                  <span>Koleksiyonu Keşfet</span>
                  <Icon name="arrowRight" size={18} />
                </a>
                <a className="lp-button lp-button-ghost lp-desktop-only" href={routes.story}>Atölye Hikayemiz</a>
              </div>
              <dl className="lp-metrics lp-desktop-only">
                {metrics.map((m) => (
                  <div key={m.label}>
                    <dt>{m.label}</dt>
                    <dd>{m.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-container lp-section-tight">
        <div className="lp-spotlight">
          <div className="lp-spotlight-media">
            <div className="lp-spotlight-underlay" aria-hidden="true" />
            <img src={images.skulpturelAmfora} alt="Keten fon önünde benekli el yapımı seramik vazo" width="600" height="600" loading="lazy" />
          </div>
          <div className="lp-spotlight-copy">
            <p className="lp-eyebrow">Özel Seçki · Konsept Koleksiyon</p>
            <h2 className="lp-heading-lg">Vazolar &amp; Skulptürel Amforalar</h2>
            <p className="lp-body-md lp-muted lp-spotlight-text">
              "Kusursuzluk doğada var olmayan bir yanılsamadır; her fırın açılışında beliren minik kül lekeleri ve akışkan sırlar, toprağın kendi iradesini masanıza taşır." Bu seri, Luna Atelier için hazırlanan konsept tasarımlardan oluşur; henüz satışta değildir.
            </p>
            <a className="lp-button lp-button-primary lp-button-medium lp-desktop-inline" href={productRoute(AMFORA_ID)}>
              <span>Şimdi İncele</span>
              <Icon name="arrowUpRight" size={16} />
            </a>
            <a className="lp-text-link lp-mobile-only" href={productRoute(AMFORA_ID)}>
              İncele <Icon name="arrowRight" size={14} />
            </a>
          </div>
        </div>
      </section>

      <p className="lp-container lp-mobile-only">
        <span className="lp-feature-pill"><Icon name="pen" size={16} />Elde şekillendirme &amp; sade dokular</span>
      </p>

      <section className="lp-container lp-section" aria-labelledby="lp-featured-title">
        <div className="lp-section-head">
          <div>
            <p className="lp-eyebrow">Stüdyo Koleksiyonu</p>
            <h2 id="lp-featured-title" className="lp-heading-lg">Öne Çıkan Eserler</h2>
          </div>
          <div className="lp-chips" role="group" aria-label="Kategori filtresi">
            {homeFilters.map((f) => (
              <button
                key={f.id}
                type="button"
                className="lp-chip"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {visible.length > 0 ? (
          <ul className="lp-grid lp-grid-featured">
            {visible.map((product) => (
              <li key={product.id}>
                <ProductTile product={product} onAdd={onAdd} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="lp-empty">Bu kategoride henüz öne çıkan parça yok.</p>
        )}
        <p className="lp-legend-note">
          <span className="lp-badge lp-badge-concept lp-badge-static">Konsept Tasarım</span>
          etiketli parçalar Luna Atelier koleksiyonu için hazırlanan tasarım örnekleridir; henüz satışta değildir.
        </p>
      </section>

      <section id="lp-atolye" className="lp-container lp-section-tight" aria-labelledby="lp-story-title">
        <div className="lp-story">
          <div className="lp-story-copy">
            <p id="lp-story-title" className="lp-eyebrow">Atölye Felsefesi</p>
            <blockquote className="lp-heading-md lp-story-quote">
              “Her parça elde şekillendirilmiş, kendine özgü bir hikayedir. Biz toprağa şekil vermiyoruz; toprağın parmaklarımız arasından akıp gitmesine izin veriyoruz.”
            </blockquote>
            <p className="lp-body-md lp-muted">
              Kili, sırrı ve malzemeyi her parçanın kullanım amacına göre seçiyoruz. Sipariş teyidi sırasında parçanızın kullanımı ve bakımıyla ilgili sorularınızı atölye olarak doğrudan yanıtlıyoruz.
            </p>
            <ul className="lp-value-pills">
              {values.map((v) => (
                <li key={v.label}><Icon name={v.icon} size={18} />{v.label}</li>
              ))}
            </ul>
          </div>
          <div className="lp-story-media">
            <img src={images.atolyeEller} alt="Dönen çömlekçi çarkında ıslak kili şekillendiren eller" width="448" height="576" loading="lazy" />
          </div>
        </div>
      </section>

      <Newsletter
        id="lp-gunluk"
        title="Atölye Günlüğüne Katılın"
        text="Yeni parçalardan ve atölye haberlerinden ilk siz haberdar olun."
      />
    </main>
  )
}
