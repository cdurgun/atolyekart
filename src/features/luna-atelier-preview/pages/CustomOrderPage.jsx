import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import QuantityStepper from '../components/QuantityStepper.jsx'
import { images } from '../data.js'
import { routes } from '../routes.js'

// Özel sipariş ekranı: Stitch paketinde karşılığı olmadığı için Luna Atelier tasarım diliyle
// bu önizleme için çizildi. Yalnızca görseldir: form hiçbir yere gönderilmez, mevcut
// /api/order akışına ve AtölyeKart'ın sipariş formuna bağlı değildir. Seçilen referans
// görseller yalnızca tarayıcıda küçük resim olarak gösterilir, yüklenmez.

const productTypes = [
  { id: 'vazo', label: 'Vazo & Amfora' },
  { id: 'kupa', label: 'Kupa & Fincan' },
  { id: 'kase', label: 'Kase' },
  { id: 'tabak', label: 'Tabak & Servis' },
  { id: 'diger', label: 'Diğer' },
]

const sizes = [
  { id: 'kucuk', label: 'Küçük', hint: '10 cm’ye kadar' },
  { id: 'orta', label: 'Orta', hint: '10–25 cm' },
  { id: 'buyuk', label: 'Büyük', hint: '25 cm üzeri' },
  { id: 'ozel', label: 'Özel Ölçü', hint: 'Ölçüleri yazın' },
]

const glazes = [
  { id: 'krem', label: 'Mat Krem Kuvarz', swatch: '#efe8dc' },
  { id: 'kum', label: 'Doğal Kum', swatch: '#cdbba3' },
  { id: 'adacayi', label: 'Adaçayı', swatch: '#8fa287' },
  { id: 'terrakotta', label: 'Ham Terrakotta', swatch: '#c48b71' },
  { id: 'kul', label: 'Kül Sırı', swatch: '#6f6a62' },
]

const steps = [
  { title: 'Talebiniz', text: 'Form, ölçü ve sır tercihlerinizi paylaşırsınız.' },
  { title: 'Eskiz & Teklif', text: 'Atölye, formun eskizini ve fiyat önerisini size iletir.' },
  { title: 'Tornada Üretim', text: 'Onayınızın ardından parça elde şekillendirilip fırınlanır.' },
]

const MAX_REFERENCES = 3

function OptionGroup({ legend, name, options, value, onChange, withSwatch = false, withHint = false }) {
  return (
    <fieldset className="lp-co-group">
      <legend className="lp-co-legend">{legend}</legend>
      <div className="lp-glaze-options">
        {options.map((option) => (
          <label key={option.id} className="lp-glaze">
            <input type="radio" name={name} value={option.id} checked={value === option.id} onChange={() => onChange(option.id)} />
            {withSwatch && <span className="lp-swatch" style={{ '--swatch': option.swatch }} />}
            <span className="lp-glaze-name">
              {option.label}
              {withHint && <small className="lp-co-hint">{option.hint}</small>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default function CustomOrderPage() {
  const [type, setType] = useState('vazo')
  const [size, setSize] = useState('orta')
  const [glaze, setGlaze] = useState('krem')
  const [qty, setQty] = useState(1)
  const [references, setReferences] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const referencesRef = useRef(references)

  referencesRef.current = references
  useEffect(() => () => referencesRef.current.forEach((r) => URL.revokeObjectURL(r.url)), [])

  function addReferences(fileList) {
    const files = [...fileList].filter((file) => file.type.startsWith('image/'))
    setReferences((current) => {
      const room = MAX_REFERENCES - current.length
      const added = files.slice(0, Math.max(room, 0)).map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        url: URL.createObjectURL(file),
      }))
      return [...current, ...added]
    })
  }

  function removeReference(id) {
    setReferences((current) => {
      const target = current.find((r) => r.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return current.filter((r) => r.id !== id)
    })
  }

  const glazeLabel = glazes.find((g) => g.id === glaze).label
  const typeLabel = productTypes.find((t) => t.id === type).label
  const sizeLabel = sizes.find((s) => s.id === size).label

  return (
    <main className="lp-main lp-custom-order">
      <div className="lp-container">
        <nav className="lp-breadcrumb lp-desktop-only" aria-label="Sayfa yolu">
          <a href={routes.home}>Ana Sayfa</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Özel Sipariş</span>
        </nav>
      </div>

      <section className="lp-container lp-catalog-intro lp-co-intro">
        <div className="lp-catalog-intro-copy">
          <p className="lp-pill-label"><span className="lp-dot" />Atölyeye Özel Üretim</p>
          <h1 className="lp-heading-xl lp-catalog-title">
            Size özel, <em>elde şekillenen</em> bir parça.
          </h1>
          <p className="lp-body-md lp-muted">
            Aklınızdaki formu, ölçüyü ve sırrı bize anlatın; atölyemizde yalnızca sizin için elde şekillendirelim. Hediye, sofra takımı ya da mekânınıza özel heykelsi bir obje olabilir.
          </p>
        </div>
        <figure className="lp-catalog-intro-media lp-co-media">
          <div className="lp-catalog-intro-blob" aria-hidden="true" />
          <img src={images.atolyeEller} alt="Dönen çömlekçi çarkında kili şekillendiren eller" width="1200" height="655" />
          <figcaption>
            <em>Tek parça, tek el</em>
            <span>Luna Atelier</span>
          </figcaption>
        </figure>
      </section>

      <ol className="lp-container lp-co-steps" aria-label="Özel sipariş süreci">
        {steps.map((step, index) => (
          <li key={step.title}>
            <span className="lp-step-number">{index + 1}</span>
            <div>
              <p className="lp-trust-title">{step.title}</p>
              <p className="lp-body-sm lp-muted">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <form
        className="lp-container lp-checkout-grid lp-co-grid"
        autoComplete="off"
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(true)
        }}
      >
        <div className="lp-checkout-main">
          <section className="lp-panel" aria-labelledby="lp-co-piece-title">
            <header className="lp-panel-head">
              <Icon name="pen" size={20} />
              <h2 id="lp-co-piece-title" className="lp-heading-sm">Parçanızı Tarif Edin</h2>
            </header>

            <OptionGroup legend="Ürün Türü" name="lp-co-type" options={productTypes} value={type} onChange={setType} />
            <OptionGroup legend="Boyut" name="lp-co-size" options={sizes} value={size} onChange={setSize} withHint />

            {size === 'ozel' && (
              <div className="lp-fields lp-co-dimensions">
                <label className="lp-field">
                  <span>Yükseklik (cm)</span>
                  <input type="text" inputMode="decimal" placeholder="Örn. 32" />
                </label>
                <label className="lp-field">
                  <span>Çap / Genişlik (cm)</span>
                  <input type="text" inputMode="decimal" placeholder="Örn. 18" />
                </label>
              </div>
            )}

            <OptionGroup legend="Renk & Sır" name="lp-co-glaze" options={glazes} value={glaze} onChange={setGlaze} withSwatch />

            <div className="lp-co-group lp-co-qty">
              <span className="lp-co-legend" id="lp-co-qty-label">Adet</span>
              <QuantityStepper value={qty} onChange={setQty} label="Adet" max={24} />
              <span className="lp-body-sm lp-muted">Takım siparişlerinde her parça yine tek tek tornada çekilir.</span>
            </div>

            <label className="lp-field lp-co-description">
              <span>Açıklama</span>
              <textarea
                rows="5"
                placeholder="Formu, kullanım amacını, hediye notunu ya da ilham aldığınız bir anıyı anlatın. Örn. Annem için, kuru çiçek koyacağı boyunlu, benekli krem bir amfora."
              />
            </label>
          </section>

          <section className="lp-panel" aria-labelledby="lp-co-ref-title">
            <header className="lp-panel-head lp-panel-head-stack">
              <Icon name="image" size={20} />
              <div>
                <h2 id="lp-co-ref-title" className="lp-heading-sm">Referans Görseller</h2>
                <p className="lp-body-sm lp-muted">İsteğe bağlı · en fazla {MAX_REFERENCES} görsel · JPG, PNG</p>
              </div>
            </header>

            <label
              className="lp-dropzone"
              data-full={references.length >= MAX_REFERENCES}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                addReferences(event.dataTransfer.files)
              }}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                className="lp-visually-hidden"
                disabled={references.length >= MAX_REFERENCES}
                onChange={(event) => {
                  addReferences(event.target.files)
                  event.target.value = ''
                }}
              />
              <span className="lp-dropzone-mark" aria-hidden="true"><Icon name="upload" size={22} /></span>
              <span className="lp-dropzone-title">
                {references.length >= MAX_REFERENCES ? 'Görsel sınırına ulaştınız' : 'Görselleri sürükleyin ya da seçin'}
              </span>
              <span className="lp-body-sm lp-muted">Eskiz, beğendiğiniz bir form ya da mekânınızın fotoğrafı olabilir.</span>
            </label>

            {references.length > 0 && (
              <ul className="lp-co-thumbs" aria-label="Seçilen referans görseller">
                {references.map((ref) => (
                  <li key={ref.id}>
                    <img src={ref.url} alt={ref.name} width="160" height="160" />
                    <button type="button" className="lp-co-thumb-remove" aria-label={`${ref.name} görselini kaldır`} onClick={() => removeReference(ref.id)}>
                      <Icon name="close" size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="lp-form-note lp-co-local-note">Görseller yalnızca bu tarayıcıda gösterilir; hiçbir yere yüklenmez.</p>
          </section>

          <section className="lp-panel" aria-labelledby="lp-co-contact-title">
            <header className="lp-panel-head">
              <Icon name="mail" size={20} />
              <h2 id="lp-co-contact-title" className="lp-heading-sm">Size Nasıl Ulaşalım?</h2>
            </header>
            <div className="lp-fields">
              <label className="lp-field">
                <span>İsim Soyisim *</span>
                <input type="text" placeholder="Defne Akıncı" />
              </label>
              <label className="lp-field">
                <span>E-posta Adresi *</span>
                <input type="email" placeholder="defne.akinci@example.com" />
              </label>
            </div>
          </section>
        </div>

        <aside className="lp-checkout-side">
          <section className="lp-panel lp-summary" aria-labelledby="lp-co-summary-title">
            <h2 id="lp-co-summary-title" className="lp-heading-sm">Talep Özeti</h2>
            <dl className="lp-summary-lines">
              <div><dt>Ürün Türü</dt><dd>{typeLabel}</dd></div>
              <div><dt>Boyut</dt><dd>{sizeLabel}</dd></div>
              <div><dt>Renk &amp; Sır</dt><dd className="lp-co-glaze-value"><span className="lp-swatch" style={{ '--swatch': glazes.find((g) => g.id === glaze).swatch }} />{glazeLabel}</dd></div>
              <div><dt>Adet</dt><dd>{qty}</dd></div>
              <div><dt>Referans Görsel</dt><dd>{references.length}</dd></div>
            </dl>
            <p className="lp-carrier"><span><Icon name="flame" size={14} />Fiyat</span><span>Eskiz onayından sonra atölye tarafından bildirilir</span></p>

            <button type="submit" className="lp-button lp-button-primary lp-button-block lp-button-large lp-co-submit">
              <Icon name="arrowRight" size={18} />
              <span>Talebi Atölyeye Gönder</span>
            </button>
            <p className="lp-form-note lp-preview-note" role="status">
              {submitted ? 'Bu bir tasarım önizlemesidir; talep oluşturulmadı ve hiçbir bilgi gönderilmedi.' : ''}
            </p>
          </section>

          <ul className="lp-panel lp-trust">
            <li>
              <Icon name="checkCircle" size={18} />
              <div>
                <p className="lp-trust-title">Size Özel Biçimlendirilir</p>
                <p className="lp-body-sm lp-muted">Parça, onayladığınız eskize göre atölyede elde şekillendirilir.</p>
              </div>
            </li>
            <li>
              <Icon name="leaf" size={18} />
              <div>
                <p className="lp-trust-title">Kullanıma Göre Sır Seçimi</p>
                <p className="lp-body-sm lp-muted">Sır ve malzeme, parçanın kullanım amacına göre eskiz aşamasında sizinle birlikte belirlenir.</p>
              </div>
            </li>
            <li>
              <Icon name="box" size={18} />
              <div>
                <p className="lp-trust-title">Gönderim Birlikte Planlanır</p>
                <p className="lp-body-sm lp-muted">Teslimat ve paketleme ayrıntıları, fiyat teklifiyle birlikte size bildirilir.</p>
              </div>
            </li>
          </ul>
        </aside>
      </form>
    </main>
  )
}
