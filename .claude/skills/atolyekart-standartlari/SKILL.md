---
name: atolyekart-standartlari
description: AtölyeKart (Luna Atelier) bileşen, bölüm, görsel, stil ve webhook standartları. AtölyeKart'ta bileşen veya bölüm eklerken ya da değiştirirken, stil veya görsel eklerken, cdn/ sürümünü güncellerken ve webhook payload'u üretirken ya da tüketirken kullan.
---

# AtölyeKart Standartları

AtölyeKart'ta kod, stil, görsel veya webhook üzerinde çalışırken bu standartları uygula. Değerlerin kaynağı başka dosyalardır; bu skill onları tekrar etmez, yalnızca hiçbir dosyada yazmayan kuralları taşır:

- **Renk, tipografi, boşluk değerleri ve bileşen görünümü:** `DESIGN.md`. Stil değişikliğinden önce oku, sonra güncelle.
- **Kapsam, aşama ve proje kuralları:** `CLAUDE.md`.
- **Webhook payload formatı:** bu klasördeki [`webhook-format.md`](webhook-format.md). Webhook üretirken ya da tüketirken oku.

## Bölüm ve bileşen yapısı

Sayfa sırası sabittir:

```
header.site-header
main
  section.about
  section.categories
  section.catalog#urunler
  section.requests#siparis
footer.site-footer
```

- Bir bölüm `src/App.jsx` içinde düz JSX olarak yaşar. Bileşen, yalnızca tekrar eden ya da kendi mantığı olan parça için açılır: `ProductList → ProductCard → ProductImage`, `CatalogQR`, `RequestForm`.
- Bileşen başına bir dosya, `src/components/` altında, `export default function`. Dosya adı = bileşen adı (PascalCase).
- Bileşenin kök öğesi, bileşen adının kebab-case sınıfını taşır: `ProductCard` → `.product-card`, `CatalogQR` → `.catalog-qr`.
- Bileşen anlamsal HTML üretir. Başlık sırası sayfa genelinde `h1 → h2 → h3` kalır; sayfada tek `h1` vardır.
- Bileşen veriyi prop olarak alır, kendisi veri tutmaz. Tek istisna `RequestForm`'un form state'idir (alan değerleri, hatalar, gönderim durumu). Ürün verisi `App.jsx` içindeki `products` dizisidir: `name`, `category`, `price` (metin, ör. `"420 TL"`), `description`, `image` (yol ya da `null`).
- Üç ürün kartının işaretlemesi birebir aynıdır; fark yalnızca veriden gelir.

## Adlandırma

| Ne | Kural | Örnek |
| --- | --- | --- |
| Bileşen ve dosyası | PascalCase, İngilizce | `ProductImage.jsx` |
| CSS sınıfı | kebab-case, İngilizce, rol adı | `.site-header`, `.catalog` |
| Kart parçaları | `product-` öneki | `.product-name`, `.product-price` |
| Renk değişkeni | malzeme adı | `--stone`, `--ink`, `--umber`, `--amber` |
| Tipografi değişkeni | `--type-<rol>` | `--type-display`, `--type-label` |
| Ürün görseli | ürün adının Türkçe karaktersiz kebab-case hali | `luna-seramik-kupa.jpg` |
| Ürün `slug`'ı | görsel dosya adının uzantısız hali | `luna-seramik-kupa` |

Durum ve varyasyon, ek sınıf yerine yapısal seçiciyle ifade edilir (ör. `li:last-child:nth-child(odd)`). Görünen metinler Türkçe, kod tanımlayıcıları İngilizcedir.

## Görseller

- **Ürün fotoğrafı:** 4:3, sRGB JPEG, en az 1200×900, `public/images/<slug>.jpg`. Veride `/images/<slug>.jpg` olarak geçer. Fotoğraf yoksa `image: null`; kartta boş yuva görünür.
- **Hero:** `hero-atolye.jpg` (≥600px) ve `hero-atolye-mobil.jpg` (<600px); yalnızca `.site-header` CSS arka planı olarak kullanılır.
- `alt` metni ürün adıdır. Dekoratif görsel CSS arka planı ya da `aria-hidden` öğedir.
- Yeni gelen her görselde üç şeyi ölç: oran, renk profili ve **kenarlar**. Üretim araçlarından gelen dosyalarda kenarda kolaj şeridi olabilir; kenar sütunlarının parlaklığı düz olmalı.
- Metnin üzerine bineceği görselde, metnin düştüğü kutunun kontrastını ölç (en az 4,5:1). Okunabilirlik görselin kendi koyu alanından gelir.

## Stil

- Tek stil dosyası: `src/styles.css`. Mobil öncelikli; kırılımlar `min-width: 600px` ve `min-width: 1000px`.
- Boyut, renk ve boşluk `:root` içindeki değişkenlerden gelir. Yeni bir değer gerekiyorsa önce değişken olarak tanımla, sonra `DESIGN.md`'ye yaz.
- Ayrım 1px `var(--rule)` çizgisiyle yapılır; köşeler keskindir; derinlik ton farkıyla verilir.
- Liste imi `list-style-type: ''` ile kaldırılır (liste anlamı korunur).

## Responsive

Her değişiklik üç genişlikte doğrulanır: **1600px, 800px, 390px**.

| Bölüm | ≥1000px | 600–999px | <600px |
| --- | --- | --- | --- |
| Hero | fotoğraf arka planda, metin sol üstte | aynı | fotoğraf bandı üstte, metin altında umber zeminde |
| Hakkında | üç alan | tek sütun | tek sütun |
| Kategoriler | üç sütunlu satır | üç sütunlu satır | alt alta |
| Ürünler | üç sütun | iki sütun, tek kalan ürün yayılır | tek sütun |

Hero ekran genişliğine bağlıdır (`vw` + `clamp`), ekran yüksekliğine bağlanmaz.

## React ve CDN sürümlerini eşit tutma

İki sürüm görsel olarak aynıdır. React'te bir değişiklik yaptıktan sonra sırayla:

1. **İşaretleme:** `cdn/index.html` içindeki elle yazılmış HTML'i React çıktısıyla aynı hale getir.
2. **Stil:** `cdn/styles.css`'i yeniden üret; elle düzenleme. Yalnızca varlık yolları farklıdır:
   ```sh
   { sed -n '1,8p' cdn/styles.css; sed -e "s#url('/fonts/#url('fonts/#g" -e "s#url('/images/#url('../public/images/#g" src/styles.css; } > cdn/styles.tmp && mv cdn/styles.tmp cdn/styles.css
   ```
3. **Davranış:** React bileşenindeki mantığın karşılığı sade JavaScript olarak yazılır: QR kod `cdn/script.js`, formlar ve webhook `cdn/forms.js` içinde. Harici kütüphane yalnızca jsDelivr'den, sürümü sabitlenmiş ve `integrity` (SRI) hash'li `<script>` ile yüklenir.
4. **Karşılaştırma:** iki sürümü üç genişlikte ölç; bölüm yükseklikleri ve sayfa yüksekliği eşit olmalı.

`cdn/` hiçbir zaman `src/`, Vite ya da npm'e bağlanmaz.

## Formlar ve webhook

Akış dört katmandır ve her katman yalnızca bir sonrakini bilir: **form → validation → payload → adapter**.

| Katman | React | CDN (`cdn/forms.js` içinde aynı adlı bölüm) |
| --- | --- | --- |
| Form | `src/components/RequestForm.jsx` | Forms |
| Validation | `src/webhook/validation.js` | Validation |
| Payload | `src/webhook/payload.js` | Payload |
| Adapter | `src/webhook/adapter.js` | Webhook adapter |

- İki form tek `RequestForm` bileşenidir; fark `kind` (`order` / `stock-alert`) ve `title` prop'larından gelir. Yeni bir form türü `requestKinds` tablosuna eklenir, bileşen kopyalanmaz.
- UI yalnızca `sendEvent(payload)` çağırır; `fetch`, başlık ya da adres bileşene yazılmaz.
- Webhook adresi koda yazılmaz: React'te `VITE_WEBHOOK_URL`, CDN'de `<meta name="atolyekart:webhook-url">`. Boşsa mock adapter çalışır (payload konsola `[webhook:mock]` ile yazılır), `mock:fail` başarısız teslimatı dener, gerçek adres HTTP adapter'ı açar.
- Gerçek adres depoya girmez; `.env.local` içinde tutulur.
- Hata durumu ek sınıfla değil `aria-invalid="true"` ile işaretlenir; hata metni `ink` rengindedir, yeni renk eklenmez.
- `src/webhook/` içindeki bir değişiklik `cdn/forms.js` içindeki karşılığına aynen taşınır; iki sürüm aynı girdiyle aynı payload'u üretmelidir (`source`, `id`, `occurred_at` ve adresler dışında).

## Bitti sayılması için

Bir değişiklik şu koşulların **hepsi** sağlandığında biter:

- `npm run build` hatasız.
- 1600 / 800 / 390px'te yatay taşma yok; tüm görseller yükleniyor.
- React ve CDN sürümlerinde hero, Hakkında ve toplam sayfa yüksekliği eşit.
- Yeni ya da değişen her metin rengi için kontrast ölçüldü (≥4,5:1).
- `DESIGN.md` ve `CLAUDE.md` yeni durumu anlatıyor.

## Örnek

**Girdi:** "Ürünler bölümünün altına katalog adresini gösteren bir QR kod ekle."

**Çıktı (yapılacaklar):**

1. `src/components/CatalogQR.jsx`: kök öğesi `.catalog-qr`, adresi prop olarak alır, SVG üretir.
2. `App.jsx`: `section.catalog` içinde `ProductList`'in altına `<CatalogQR />`.
3. `src/styles.css`: `.catalog-qr` kuralları; üstte 1px `var(--rule)`, metin `--type-label` ve `--ink-soft`, QR modülleri `--ink`.
4. `cdn/index.html` + `cdn/script.js`: aynı işaretleme, aynı kütüphane sabit sürüm ve SRI ile; `cdn/styles.css` yeniden üretilir.
5. Üç genişlikte ölçüm, QR'ın çözümlenip doğru adresi verdiğinin kontrolü, `DESIGN.md` ve `CLAUDE.md` güncellemesi.
