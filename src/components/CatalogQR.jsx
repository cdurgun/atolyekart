import qrcode from 'qrcode-generator'

// VITE_CATALOG_URL ile sabitlenebilir; yoksa sayfanın kendi adresinden üretilir.
function catalogUrl() {
  const configured = import.meta.env.VITE_CATALOG_URL
  if (configured) return configured
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = 'urunler'
  return url.href
}

export default function CatalogQR() {
  const qr = qrcode(0, 'M')
  qr.addData(catalogUrl())
  qr.make()

  // Sessiz bölge SVG'ye eklenmez; çevresindeki açık zemin boşluğu bu işi görür.
  const count = qr.getModuleCount()
  let path = ''
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) path += `M${col} ${row}h1v1h-1z`
    }
  }

  return (
    <div className="catalog-qr">
      <svg className="catalog-qr-code" viewBox={`0 0 ${count} ${count}`} role="img" aria-label="Katalog sayfasının QR kodu" shapeRendering="crispEdges">
        <path d={path} />
      </svg>
      <p className="catalog-qr-text">Kataloğu telefonunuzda açın</p>
    </div>
  )
}
