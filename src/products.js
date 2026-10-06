// Vitrindeki ürünler. Web (App.jsx) ve mobil (mobile/) aynı diziyi kullanır.
// Stok durumu burada tutulmaz; ürün adı ve stok için doğru kaynak sunucu kataloğudur (server/lib/catalog.js).
export const products = [
  {
    name: 'Luna Seramik Kupa',
    category: 'Seramik',
    price: '420 TL',
    description: 'El yapımı, minimalist tasarımlı seramik kupa.',
    image: '/images/luna-seramik-kupa.jpg',
  },
  {
    name: 'Amber Soya Mum',
    category: 'Doğal Mumlar',
    price: '350 TL',
    description: 'Doğal soya mumundan, amber kokulu el yapımı mum.',
    image: '/images/amber-soya-mum.jpg',
  },
  {
    name: 'Terra Minimal Kolye',
    category: 'El Yapımı Aksesuarlar',
    price: '290 TL',
    description: 'Toprak tonlarında, sade tasarımlı el yapımı kolye.',
    image: '/images/terra-minimal-kolye.jpg',
  },
]
