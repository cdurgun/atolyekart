// Footer yalnızca gerçek içeriği olan sayfaya bağlantı verir (/gizlilik.html).
// Teslimat, iade ve bakım için ayrı sayfa olmadığından bağlantı yerine dürüst bir açıklama gösterilir.
// Adres, sosyal medya ve iletişim bilgisi doğrulanmadığı için yazılmaz.
export default function SiteFooter({ tagline = 'El yapımı dekorasyon ve yaşam ürünleri atölyesi.', signature = 'El emeğiyle, sana özel.' }) {
  return (
    <footer className="lp-footer">
      <div className="lp-container lp-footer-inner">
        <div className="lp-footer-top">
          <div>
            <p className="lp-logo lp-footer-logo">LUNA ATELIER</p>
            <p className="lp-footer-tagline">{tagline}</p>
          </div>
        </div>

        <ul className="lp-footer-links">
          <li><a href="/gizlilik.html" target="_blank" rel="noopener">Gizlilik Politikası</a></li>
        </ul>
        <p className="lp-footer-note">
          Teslimat, iade ve bakım bilgileri sipariş teyidi sırasında atölye tarafından telefonla paylaşılır.
        </p>

        <div className="lp-footer-bottom">
          <p>© {new Date().getFullYear()} Luna Atelier. Tüm hakları saklıdır.</p>
          <p className="lp-footer-signature">{signature}</p>
        </div>
      </div>
    </footer>
  )
}
