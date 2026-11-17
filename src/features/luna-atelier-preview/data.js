// Önizlemenin ürün dışı görselleri ve ortak biçimlendirme.
// Ürün verisi products/ klasöründedir: gerçek ürünler src/products.js'ten okunur,
// Stitch konsept ürünleri ayrı tutulur.
import atolyeCarkBasinda from './assets/images/atolye-cark-basinda.jpg'
import skulpturelAmfora from './assets/images/skulpturel-amfora.jpg'
import atolyeEller from './assets/images/atolye-eller.jpg'
import katalogAtolye from './assets/images/katalog-atolye.jpg'
import carkBasindaEller from './assets/images/cark-basinda-eller.jpg'
import atolyeTanitimVideo from './assets/video/atolye-tanitim.mp4'

export const images = {
  atolyeCarkBasinda,
  skulpturelAmfora,
  atolyeEller,
  katalogAtolye,
  carkBasindaEller,
}

// Sessiz, 720×1280 (9:16), 10 sn. Ses kanalı çıkarıldı; otomatik oynatma yalnızca sessiz videoda çalışır.
export const videos = { atolyeTanitim: atolyeTanitimVideo }

export function formatPrice(value) {
  return `₺${value.toLocaleString('tr-TR')}`
}
