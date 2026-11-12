// Önizlemenin ürün katmanı: gerçek ürünler + Stitch konsept ürünleri.
// İki tür birbirine karıştırılmaz: her kayıt "kind" alanı taşır ('real' | 'concept').
import { realProducts } from './realProducts.js'
import { conceptProducts, AMFORA_ID } from './conceptProducts.js'

export { realProducts, conceptProducts, AMFORA_ID }

export const CONCEPT_LABEL = 'Konsept Tasarım'

export const isReal = (product) => product.kind === 'real'

// Gerçek ürünler önce, konseptler sonra.
export const allProducts = [...realProducts, ...conceptProducts]

// Kategoriler mevcut uygulamadaki gibi gerçek ürünlerden türetilir (src/App.jsx ile aynı yöntem).
export const categories = [...new Set(realProducts.map((product) => product.category))]

export function findProduct(id) {
  return allProducts.find((product) => product.id === id)
}

// Ana sayfa: tüm gerçek ürünler + koleksiyonu tamamlayan üç konsept.
const featuredConceptIds = [AMFORA_ID, 'matcha-kasesi', 'ay-isigi-buhurdanlik']
export const featuredProducts = [
  ...realProducts,
  ...featuredConceptIds.map((id) => conceptProducts.find((p) => p.id === id)),
]

// Detay sayfası: önce diğer gerçek ürünler, kalan yer konseptlerle dolar.
export function relatedTo(product, count = 4) {
  const others = allProducts.filter((p) => p.id !== product.id)
  const real = others.filter(isReal)
  const sameCategoryConcepts = others.filter((p) => !isReal(p) && p.category === product.category)
  const rest = others.filter((p) => !isReal(p) && p.category !== product.category)
  return [...real, ...sameCategoryConcepts, ...rest].slice(0, count)
}

// Ürün kartı ve detay için alt etiket: gerçek üründe kategori, konseptte Stitch tür etiketi.
export const productLabel = (product) => (isReal(product) ? product.category : product.type)
