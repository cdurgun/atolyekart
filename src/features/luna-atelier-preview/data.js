// Önizlemenin ürün dışı görselleri ve ortak biçimlendirme.
// Ürün verisi products/ klasöründedir: gerçek ürünler src/products.js'ten okunur,
// Stitch konsept ürünleri ayrı tutulur.
import atolyeCarkPoster from './assets/images/atolye-cark-poster.jpg'
import atolyeCarkVideo from './assets/video/atolye-cark.mp4'
import skulpturelAmfora from './assets/images/skulpturel-amfora.jpg'
import atolyeEller from './assets/images/atolye-eller.jpg'
import katalogAtolye from './assets/images/katalog-atolye.jpg'
import carkBasindaEller from './assets/images/cark-basinda-eller.jpg'
import atolyeTanitimVideo from './assets/video/atolye-tanitim.mp4'

export const images = {
  atolyeCarkPoster,
  skulpturelAmfora,
  atolyeEller,
  katalogAtolye,
  carkBasindaEller,
}

// Sessiz, 720×1280 (9:16), 10 sn. Ses kanalı çıkarıldı; otomatik oynatma yalnızca sessiz videoda çalışır.
// atolyeCark: ana sayfa hero'su. Sessiz, 1600×900 (16:9), 11,9 sn: 6 sn ileri, sonra geri sarılır (döngü). Poster ilk karesidir.
export const videos = { atolyeTanitim: atolyeTanitimVideo, atolyeCark: atolyeCarkVideo }

export function formatPrice(value) {
  return `₺${value.toLocaleString('tr-TR')}`
}
