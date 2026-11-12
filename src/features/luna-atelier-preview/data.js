// Önizlemenin ürün dışı görselleri ve ortak biçimlendirme.
// Ürün verisi products/ klasöründedir: gerçek ürünler src/products.js'ten okunur,
// Stitch konsept ürünleri ayrı tutulur.
import atolyeCarkBasinda from './assets/images/atolye-cark-basinda.jpg'
import skulpturelAmfora from './assets/images/skulpturel-amfora.jpg'
import atolyeEller from './assets/images/atolye-eller.jpg'
import katalogAtolye from './assets/images/katalog-atolye.jpg'
import carkBasindaEller from './assets/images/cark-basinda-eller.jpg'

export const images = {
  atolyeCarkBasinda,
  skulpturelAmfora,
  atolyeEller,
  katalogAtolye,
  carkBasindaEller,
}

export function formatPrice(value) {
  return `₺${value.toLocaleString('tr-TR')}`
}
