// Stitch konsept ürünleri: Luna Atelier koleksiyonunu görsel olarak zenginleştiren tasarım örnekleri.
// Gerçek ürün DEĞİLDİR: fiyat, stok ve sipariş bilgisi taşımaz, sepete eklenemez.
// Ad ve metinler Stitch tasarım dosyalarından alındı (design-reference/stitch-luna-atelier/).
// Hepsi seramik olduğu için mevcut "Seramik" kategorisinde listelenir; "type" yalnızca alt etikettir.
import fincanlar from '../assets/images/fincanlar.jpg'
import stonewareKaseler from '../assets/images/stoneware-kaseler.jpg'
import benekliVazo from '../assets/images/benekli-vazo-no-04.jpg'
import matchaKasesi from '../assets/images/matcha-kasesi.jpg'
import seramikSurahi from '../assets/images/seramik-surahi.jpg'
import ayIsigiBuhurdanlik from '../assets/images/ay-isigi-buhurdanlik.jpg'
import okyanusVazo from '../assets/images/okyanus-vazo.jpg'
import lodosKahveKupasi from '../assets/images/lodos-kahve-kupasi.jpg'
import zeytinDaliServisTabagi from '../assets/images/zeytin-dali-servis-tabagi.jpg'
import kulComlekCiceklik from '../assets/images/kul-comlek-ciceklik.jpg'
import gundogumuKupa from '../assets/images/gundogumu-kupa.jpg'
import toprakMatchaSeti from '../assets/images/toprak-matcha-seti.jpg'
import sarmalVazo from '../assets/images/sarmal-vazo.jpg'
import benekliStonewareAmfora from '../assets/images/benekli-stoneware-amfora.jpg'
import amforaSirDoku from '../assets/images/amfora-sir-doku.jpg'
import amforaKaideImzasi from '../assets/images/amfora-kaide-imzasi.jpg'
import amforaYasamAlani from '../assets/images/amfora-yasam-alani.jpg'
import benekliKahveKupasi from '../assets/images/benekli-kahve-kupasi.jpg'
import ayakliMeyveKasesi from '../assets/images/ayakli-meyve-kasesi.jpg'
import konikSoliterVazo from '../assets/images/konik-soliter-vazo.jpg'
import ikiliYunomiSeti from '../assets/images/ikili-yunomi-seti.jpg'

const concept = (fields) => ({ kind: 'concept', category: 'Seramik', ...fields })

export const AMFORA_ID = 'benekli-stoneware-amfora'

export const conceptProducts = [
  concept({
    id: AMFORA_ID,
    name: 'Benekli Stoneware Amfora Vazo No. 04',
    type: 'Stoneware Vazo',
    note: 'Benekli dokulu heykelsi amfora tasarımı',
    description:
      'Benekli yüzeyli, heykelsi bir amfora silüeti için hazırlanmış konsept tasarım. Görseller tasarım önerisini gösterir; parça henüz üretimde değildir.',
    image: benekliStonewareAmfora,
    gallery: [
      { id: 'ana', label: 'Tasarım Görseli', image: benekliStonewareAmfora, alt: 'Ahşap altlık üzerinde krem renkli benekli stoneware amfora vazo' },
      { id: 'doku', label: 'Sır & Doku', image: amforaSirDoku, alt: 'Amforanın benekli sır yüzeyinin yakın çekimi' },
      { id: 'imza', label: 'Kaide Detayı', image: amforaKaideImzasi, alt: 'Konsept vazonun kaidesindeki mühür detayı' },
      { id: 'yasam', label: 'Yaşam Alanı', image: amforaYasamAlani, alt: 'Kuru çiçeklerle oturma odasında duran vazo' },
    ],
    potterNote:
      'Bu konsept amfora, antik Akdeniz su testilerinin yalın formlarından ilham alan bir tasarım taslağıdır. Üretime alınırsa kil, sır ve pişirim ayrıntıları atölye tarafından netleştirilecek.',
    details: [
      {
        title: 'Tasarım Notları',
        open: true,
        items: [
          ['Form:', 'Akdeniz su testilerinden ilham alan yalın amfora silüeti.'],
          ['Yüzey:', 'Benekli, mat sır görünümü hedeflenir; sır ve malzeme üretim aşamasında belirlenir.'],
          ['Kullanım:', 'Taze ve kuru çiçek aranjmanları için tasarlandı; kullanım önerileri üretimle birlikte netleşecek.'],
        ],
      },
      {
        title: 'Tasarım Ölçüleri',
        items: [
          ['Yükseklik:', '24 cm'],
          ['Gövde Çapı:', '14 cm'],
          ['Yaklaşık Ağırlık:', '~1.100 gr'],
        ],
        note: '*Ölçüler tasarım önerisidir; üretimde değişebilir.',
      },
      {
        title: 'Bakım & Temizlik',
        text: 'Bakım önerileri, parça üretime alındığında kullanılan malzemeye göre atölye tarafından paylaşılacak.',
      },
    ],
  }),
  concept({ id: 'benekli-vazo-no-04', name: 'Benekli Vazo No. 04', type: 'Heykelsi Vazo', note: 'Koyu demir benekli, krem sırlı tornada vazo', image: benekliVazo }),
  concept({ id: 'matcha-kasesi', name: 'Matcha Kasesi', type: 'Çay Seremonisi', note: 'Parmak izi dokulu, yosun yeşili sırlı chawan', image: matchaKasesi }),
  concept({ id: 'ay-isigi-buhurdanlik', name: 'Ay Işığı Buhurdanlık', type: 'Ev Ritüelleri', note: 'Çay mumuyla ısınan iki parçalı aroma kasesi', image: ayIsigiBuhurdanlik }),
  concept({ id: 'fincanlar', name: 'Fincanlar', type: 'Mug & Fincan', note: 'Mat bej, koyu benekli stoneware fincan çifti', image: fincanlar }),
  concept({ id: 'stoneware-kaseler', name: 'Stoneware Kaseler', type: 'Sofralık Eserler', note: 'Sırsız ağızlı, saten krem iç sırlı geniş kase', image: stonewareKaseler }),
  concept({ id: 'seramik-surahi', name: 'Seramik Sürahi', type: 'Mutfak & Masa', note: 'Elde sıkıştırılmış ağızlı, yulaf tonlu sürahi', image: seramikSurahi }),
  concept({ id: 'okyanus-vazo', name: 'Okyanus Vazo', type: 'Vazolar & Objeler', note: 'Benekli stoneware, 22 cm yükseklik', image: okyanusVazo }),
  concept({ id: 'lodos-kahve-kupasi', name: 'Lodos Kahve Kupası', type: 'Fincan & Kupa', note: '280 ml, el yapımı kıvrık kulp', image: lodosKahveKupasi }),
  concept({ id: 'zeytin-dali-servis-tabagi', name: 'Zeytin Dalı Servis Tabağı', type: 'Tabaklar & Kaseler', note: '32 cm, organik kıvrımlı stoneware', image: zeytinDaliServisTabagi }),
  concept({ id: 'kul-comlek-ciceklik', name: 'Kül Çömlek Çiçeklik', type: 'Vazolar & Objeler', note: 'Kül tonlu, küresel çiçeklik tasarımı', image: kulComlekCiceklik }),
  concept({ id: 'gundogumu-kupa', name: 'Gündoğumu Kupa', type: 'Fincan & Kupa', note: 'Ham terrakotta & süt beyaz sır', image: gundogumuKupa }),
  concept({ id: 'toprak-matcha-seti', name: 'Toprak Matcha Seti', type: 'Çay & Kahve Ritüeli', note: 'Kase & çırpıcı standı ile ikili set', image: toprakMatchaSeti }),
  concept({ id: 'sarmal-vazo', name: 'Sarmal Vazo', type: 'Vazolar & Objeler', note: '26 cm, heykelsi burgulu form', image: sarmalVazo }),
  concept({ id: 'benekli-kahve-kupasi-no-02', name: 'Benekli Kahve Kupası No. 02', type: 'Kupa', note: 'Yulaf tonlu benekli stoneware kupa', image: benekliKahveKupasi }),
  concept({ id: 'ayakli-meyve-kasesi-no-01', name: 'Ayaklı Meyve Kasesi No. 01', type: 'Kase', note: 'Kum dokulu, ayaklı heykelsi kase', image: ayakliMeyveKasesi }),
  concept({ id: 'konik-soliter-vazo-no-03', name: 'Konik Soliter Vazo No. 03', type: 'Vazo', note: 'Kil tabanlı, adaçayı sırlı konik vazo', image: konikSoliterVazo }),
  concept({ id: 'ikili-yunomi-bardagi-seti', name: 'İkili Yunomi Bardağı Seti', type: 'Set', note: 'Kulpsuz, mat sır görünümlü çay bardakları', image: ikiliYunomiSeti }),
]
