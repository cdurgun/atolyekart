import Icon from '../components/Icon.jsx'
import { orderMode } from '../checkout/environment.js'
import { cartTotals } from '../checkout/submitOrder.js'
import { formatPrice } from '../data.js'
import { routes } from '../routes.js'

// Sipariş talebi /api/order üzerinden atölyeye iletildikten sonra gösterilir.
// Bu bir ödeme onayı değildir: kesin tutar, teslimat adresi ve notlar atölye tarafından telefonla teyit edilir.
// Sayfa doğrudan açılırsa (gönderilmiş satır yoksa) koleksiyona yönlendiren boş durum görünür.
export default function OrderReceivedPage({ lines }) {
  if (lines.length === 0) {
    return (
      <main className="lp-main">
        <section className="lp-container lp-section">
          <div className="lp-pending">
            <div className="lp-pending-blob" aria-hidden="true" />
            <h1 className="lp-heading-lg">Gösterilecek bir sipariş talebi yok</h1>
            <p className="lp-body-md lp-muted">Bu sayfa, sepetinizdeki parçalar atölyeye iletildikten sonra talebinizin özetini gösterir.</p>
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

  const { count, total } = cartTotals(lines)
  // Test modunda (mock/yerel) sonuç gerçek sipariş gibi sunulmaz.
  const test = orderMode !== 'live'

  return (
    <main className="lp-main">
      <section className="lp-container lp-section">
        <div className="lp-pending lp-received">
          <div className="lp-pending-blob" aria-hidden="true" />
          {test ? (
            <>
              <p className="lp-pill-label"><Icon name="help" size={14} />Test modu</p>
              <h1 className="lp-heading-lg">Test talebi tamamlandı</h1>
              <p className="lp-body-md lp-muted">
                Bu bir test gönderimiydi; gerçek sipariş olarak değerlendirilmez ve atölye sizi aramaz. Ödeme alınmadı, gösterilen tutar tahminidir.
              </p>
            </>
          ) : (
            <>
              <p className="lp-pill-label"><Icon name="checkCircle" size={14} />Talep iletildi</p>
              <h1 className="lp-heading-lg">Sipariş talebiniz alındı</h1>
              <p className="lp-body-md lp-muted">
                Sizi telefonla arayacağız. Teslimat adresinizi, varsa özel notunuzu ve kesin tutarı bu görüşmede birlikte teyit edeceğiz. Bu sayfada ödeme alınmadı.
              </p>
            </>
          )}

          <ul className="lp-received-list" aria-label="İletilen parçalar">
            {lines.map((line) => (
              <li key={line.id}>
                <img src={line.image} alt="" width="56" height="56" />
                <span className="lp-received-name">{line.name}</span>
                <span className="lp-muted">{line.qty} adet</span>
                <span className="lp-received-price">{formatPrice(line.price * line.qty)}</span>
              </li>
            ))}
          </ul>
          <p className="lp-received-total">
            <span>Tahmini toplam · {count} parça</span>
            <strong>{formatPrice(total)}</strong>
          </p>

          <div className="lp-pending-actions">
            <a className="lp-button lp-button-primary" href={routes.catalog}>
              <span>Koleksiyona Dön</span>
              <Icon name="arrowRight" size={18} />
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
