import { useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import QuantityStepper from '../components/QuantityStepper.jsx'
import { orderMode } from '../checkout/environment.js'
import { canSubmit } from '../checkout/orderMode.js'
import { cartTotals, contactFields, submitOrder, validateContact } from '../checkout/submitOrder.js'
import { formatPrice } from '../data.js'
import { productRoute, routes } from '../routes.js'
import { sendRequest } from '../../../webhook/adapter.js'

// Sepet ve sipariş talebi: mevcut POST /api/order akışına bağlıdır (checkout/submitOrder.js).
// - Her sepet satırı ayrı bir istektir; başarılı satırlar sepetten düşer, başarısızlar mesajıyla kalır.
// - API'de adres, not ve fiyat alanı yoktur: teslimat bilgisi ve kesin tutar atölye tarafından
//   telefonla teyit edilir. Bu sayfada ödeme alınmaz; kart, kupon ve indirim alanı yoktur.
// - Stok ve doğrulama kararını sunucu verir; istemcideki doğrulama yalnızca erken uyarıdır.
// - Ortam güvenliği (checkout/orderMode.js): Preview deploy'unda ya da ortam bilinmiyorsa gönderim
//   kapalıdır; test modunda (mock/yerel) gönderim yapılır ama sonuç gerçek sipariş gibi sunulmaz.

const modeNotices = {
  test: 'Test modu: bu ortamdan gönderilen talepler gerçek sipariş sayılmaz; atölyeye ulaştığı varsayılmamalıdır.',
  preview: 'Bu sayfa bir önizleme ortamında açıldı. Buradan sipariş gönderilemez; talepler atölyeye ulaşmaz.',
  unknown: 'Sipariş gönderimi bu adreste etkin değil; talep gönderilemez.',
}

// Yalnızca gerçekten sunulan şeyler yazılır: el yapımı üretim ve atölyenin telefonla teyidi.
// Kargo garantisi, iade süresi ya da sertifika gibi doğrulanmamış vaatler eklenmez.
const trust = [
  { icon: 'pen', title: 'Atölyede El Emeğiyle', text: 'Parçalar Luna Atelier atölyesinde elde hazırlanır; her birinde el işçiliğinin küçük farkları görülür.' },
  { icon: 'checkCircle', title: 'Atölye Teyidiyle Sipariş', text: 'Talebiniz kesinleşmeden önce atölye sizi arar; ürünü, adedi ve tutarı birlikte teyit edersiniz.' },
  { icon: 'box', title: 'Gönderimi Birlikte Planlıyoruz', text: 'Teslimat ve paketleme ayrıntılarını telefon görüşmesinde birlikte netleştirir, sorularınızı yanıtlarız.' },
]

const emptyContact = { name: '', phone: '', email: '', consent: false }

const inputs = {
  name: { type: 'text', autoComplete: 'name', placeholder: 'Defne Akıncı' },
  phone: { type: 'tel', autoComplete: 'tel', inputMode: 'tel', placeholder: '0532 123 45 67' },
  email: { type: 'email', autoComplete: 'email', inputMode: 'email', placeholder: 'defne@ornek.com' },
}

const labels = {
  name: 'İsim Soyisim *',
  phone: 'Telefon Numarası *',
  email: <>E-posta Adresi <small>(İsteğe Bağlı)</small></>,
}

export default function CartCheckoutPage({ cart, sent, onQty, onRemove, onSent, onComplete }) {
  const [raw, setRaw] = useState(emptyContact)
  const [errors, setErrors] = useState({})
  const [lineErrors, setLineErrors] = useState({})
  const [status, setStatus] = useState('')
  const [sending, setSending] = useState(false)
  // Durum güncellemesi render'ı beklerken ikinci tıklamayı da engeller (çift gönderim olmaz).
  const busy = useRef(false)

  const { count, total } = cartTotals(cart)
  const enabled = canSubmit(orderMode)

  function field(name) {
    const checkbox = name === 'consent'
    return {
      id: `lp-order-${name}`,
      name,
      [checkbox ? 'checked' : 'value']: raw[name],
      'aria-invalid': errors[name] ? 'true' : undefined,
      'aria-describedby': errors[name] ? `lp-order-${name}-error` : undefined,
      onChange: (event) => {
        setRaw({ ...raw, [name]: checkbox ? event.target.checked : event.target.value })
        setErrors({ ...errors, [name]: undefined })
      },
    }
  }

  const fieldError = (name) => (
    <span className="lp-field-error" id={`lp-order-${name}-error`} hidden={!errors[name]}>
      {errors[name]}
    </span>
  )

  async function handleSubmit(event) {
    event.preventDefault()
    if (busy.current || cart.length === 0 || !enabled) return
    const form = event.currentTarget

    const { values, errors: found } = validateContact(raw)
    setErrors(found)
    const invalid = contactFields.find((name) => found[name])
    if (invalid) {
      setStatus('Lütfen işaretli alanları düzeltin.')
      form.elements[invalid].focus()
      return
    }

    busy.current = true
    setSending(true)
    setStatus('')
    setLineErrors({})
    const lines = cart.map((item) => ({ ...item }))
    const results = await submitOrder(lines, values, sendRequest)
    busy.current = false
    setSending(false)

    const okIds = new Set(results.filter((r) => r.ok).map((r) => r.id))
    const okLines = lines.filter((line) => okIds.has(line.id))
    const failed = results.filter((r) => !r.ok)

    if (failed.length === 0) {
      onComplete(okLines)
      return
    }
    if (okLines.length) onSent(okLines)

    // Sunucu iletişim alanlarından birini reddettiyse hata ilgili alanın altında gösterilir.
    const serverErrors = failed.find((r) => r.errors)?.errors
    if (serverErrors) {
      setErrors(Object.fromEntries(contactFields.filter((name) => serverErrors[name]).map((name) => [name, serverErrors[name]])))
    }
    setLineErrors(Object.fromEntries(failed.map((r) => [r.id, r.message])))
    setStatus(
      okLines.length
        ? `${okLines.length} parça atölyeye iletildi, ${failed.length} parça gönderilemedi. Gönderilemeyen parçalar sepette kaldı; nedenini satırında görebilir ve yeniden deneyebilirsiniz.`
        : 'Talebiniz gönderilemedi. Parçalar sepette duruyor; nedenini satırında görebilir ve yeniden deneyebilirsiniz.',
    )
  }

  return (
    <main className="lp-main lp-checkout">
      <section className="lp-container lp-checkout-intro">
        <p className="lp-pill-label"><Icon name="leaf" size={14} />Yavaş Üretim • El Yapımı</p>
        <h1 className="lp-heading-xl">Sepetiniz &amp; Sipariş Talebi</h1>
        <p className="lp-body-md lp-muted">
          Talebiniz atölyeye iletilir; sizi telefonla arayıp teslimat bilgilerinizi ve kesin tutarı birlikte teyit ederiz. Bu sayfada ödeme alınmaz.
        </p>
        {modeNotices[orderMode] && (
          <p className="lp-env-notice" role="note" data-mode={orderMode}>
            <Icon name="help" size={18} />
            <span>{modeNotices[orderMode]}</span>
          </p>
        )}
      </section>

      <form className="lp-container lp-checkout-grid" noValidate onSubmit={handleSubmit}>
        <fieldset className="lp-checkout-main" disabled={sending}>
          {sent.length > 0 && (
            <section className="lp-panel lp-sent" aria-labelledby="lp-sent-title">
              <header className="lp-panel-head">
                <Icon name="checkCircle" size={20} />
                <h2 id="lp-sent-title" className="lp-heading-sm">Atölyeye İletilenler</h2>
              </header>
              <ul className="lp-sent-list">
                {sent.map((item) => (
                  <li key={item.id}>
                    <span>{item.name}</span>
                    <span className="lp-muted">{item.qty} adet</span>
                  </li>
                ))}
              </ul>
              <p className="lp-body-sm lp-muted">Bu parçalar yeniden gönderilmez. Sepette kalanları gönderdiğinizde tüm talebin özetini göreceksiniz.</p>
              {cart.length === 0 && (
                <button type="button" className="lp-button lp-button-ghost lp-button-medium" onClick={() => onComplete([])}>
                  <span>Talep Özetini Gör</span>
                  <Icon name="arrowRight" size={16} />
                </button>
              )}
            </section>
          )}

          <section className="lp-panel" aria-labelledby="lp-cart-title">
            <header className="lp-panel-head">
              <h2 id="lp-cart-title" className="lp-heading-sm">Seçilen Parçalar</h2>
              <span className="lp-count-pill">{count} Parça</span>
            </header>
            {cart.length === 0 ? (
              <p className="lp-empty">
                {sent.length > 0 ? 'Sepette gönderilecek parça kalmadı.' : 'Sepetiniz boş.'} <a href={routes.catalog}>Koleksiyona göz atın.</a>
              </p>
            ) : (
              <ul className="lp-cart-list">
                {cart.map((item) => (
                  <li key={item.id} className="lp-cart-item">
                    <img src={item.image} alt={item.name} width="96" height="96" />
                    <div className="lp-cart-info">
                      <p className="lp-label lp-accent">{item.label}</p>
                      <h3 className="lp-cart-name"><a href={productRoute(item.id)}>{item.name}</a></h3>
                      <p className="lp-body-sm lp-muted">{item.qty} Adet • {formatPrice(item.price)} / adet</p>
                    </div>
                    <div className="lp-cart-controls">
                      <QuantityStepper value={item.qty} onChange={(qty) => onQty(item.id, qty)} label={`${item.name} adedi`} />
                      <span className="lp-cart-price">{formatPrice(item.price * item.qty)}</span>
                      <button type="button" className="lp-icon-button" aria-label={`${item.name} sepetten çıkar`} onClick={() => onRemove(item.id)}>
                        <Icon name="trash" size={18} />
                      </button>
                    </div>
                    {lineErrors[item.id] && <p className="lp-line-error">{lineErrors[item.id]}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="lp-panel" aria-labelledby="lp-contact-title">
            <header className="lp-panel-head">
              <Icon name="truck" size={20} />
              <h2 id="lp-contact-title" className="lp-heading-sm">İletişim Bilgileri</h2>
            </header>
            <div className="lp-fields">
              {['name', 'phone', 'email'].map((name) => (
                <div className={name === 'email' ? 'lp-field lp-field-wide' : 'lp-field'} key={name}>
                  <label htmlFor={`lp-order-${name}`}>{labels[name]}</label>
                  <input {...inputs[name]} {...field(name)} />
                  {fieldError(name)}
                </div>
              ))}
            </div>
            <p className="lp-delivery-note">
              <Icon name="box" size={18} />
              <span>
                Teslimat adresinizi ve varsa özel notunuzu (hediye paketi, el yazısı kart vb.) bu formda istemiyoruz. Talebiniz ulaştıktan sonra atölye sizi arayarak bu bilgileri telefonda alır ve teyit eder.
              </span>
            </p>
            <div className="lp-consent">
              <input type="checkbox" {...field('consent')} />
              <label htmlFor="lp-order-consent">
                Kişisel verilerimin, talebimin karşılanması amacıyla <a href="/gizlilik.html" target="_blank" rel="noopener">Gizlilik Politikası</a>'nda açıklandığı şekilde işlenmesine açık rıza veriyorum.
              </label>
              {fieldError('consent')}
            </div>
          </section>
        </fieldset>

        <aside className="lp-checkout-side">
          <section className="lp-panel lp-summary" aria-labelledby="lp-summary-title">
            <h2 id="lp-summary-title" className="lp-heading-sm">Sipariş Özeti</h2>
            <dl className="lp-summary-lines">
              <div><dt>Ara Toplam</dt><dd>{formatPrice(total)}</dd></div>
              <div><dt>Kargo &amp; Teslimat</dt><dd className="lp-muted">Telefonda teyit edilir</dd></div>
            </dl>

            <div className="lp-grand-total">
              <div>
                <p className="lp-heading-sm">Tahmini Toplam</p>
                <p className="lp-body-sm lp-muted">Kesin tutar atölye tarafından telefonla teyit edilir</p>
              </div>
              <p className="lp-grand-amount">{formatPrice(total)}</p>
            </div>

            <button type="submit" className="lp-button lp-button-primary lp-button-block lp-button-large" disabled={cart.length === 0 || sending || !enabled}>
              <Icon name="check" size={18} />
              <span>{!enabled ? 'Sipariş Gönderimi Kapalı' : sending ? 'Gönderiliyor…' : orderMode === 'test' ? 'Test Talebi Gönder' : 'Sipariş Talebini Gönder'}</span>
            </button>
            <p className="lp-fineprint">Ödeme bu sayfada alınmaz; atölye sizi arayarak talebinizi teyit eder.</p>
            <p className="lp-checkout-status" role="status">{status}</p>
          </section>

          <ul className="lp-panel lp-trust">
            {trust.map((t) => (
              <li key={t.title}>
                <Icon name={t.icon} size={18} />
                <div>
                  <p className="lp-trust-title">{t.title}</p>
                  <p className="lp-body-sm lp-muted">{t.text}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="lp-panel lp-help">
            <Icon name="help" size={18} />
            <div>
              <p className="lp-trust-title">Sorularınız mı var?</p>
              <p className="lp-body-sm lp-muted">Talebinizi gönderdikten sonra atölye sizi arar; sorularınızı bu görüşmede yanıtlarız.</p>
            </div>
          </div>
        </aside>
      </form>
    </main>
  )
}
