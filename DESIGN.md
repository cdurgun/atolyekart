---
name: Luna Atelier
description: El yapımı dekorasyon ve yaşam ürünleri atölyesi için basılı katalog föyü dilinde, kompakt tek sayfa.
colors:
  stone: "#ddd6c9"
  stone-deep: "#d2c9b9"
  ink: "#2b211b"
  ink-soft: "#5a4a3f"
  umber: "#3a2a22"
  slip: "#ede6da"
  amber: "#d9a441"
  rule: "rgb(43 33 27 / 0.24)"
typography:
  display:
    fontFamily: "'Brygada 1918', 'Iowan Old Style', Georgia, serif"
    fontSize: "clamp(2.5rem, 6vw, 5.5rem)"
    fontWeight: 500
    lineHeight: 0.95
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "'Brygada 1918', 'Iowan Old Style', Georgia, serif"
    fontSize: "clamp(1.375rem, 2vw, 1.625rem)"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.005em"
  lead:
    fontFamily: "'Brygada 1918', 'Iowan Old Style', Georgia, serif"
    fontSize: "clamp(1.125rem, 1.6vw, 1.375rem)"
    fontWeight: 400
    lineHeight: 1.4
  title:
    fontFamily: "'Brygada 1918', 'Iowan Old Style', Georgia, serif"
    fontSize: "clamp(1.0625rem, 1.3vw, 1.1875rem)"
    fontWeight: 500
    lineHeight: 1.25
  tagline:
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif"
    fontSize: "clamp(1rem, 1.2vw, 1.125rem)"
    fontWeight: 400
    letterSpacing: "0.005em"
  body:
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif"
    fontSize: "clamp(1rem, 0.95rem + 0.2vw, 1.0625rem)"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  none: "0"
spacing:
  gutter: "clamp(1.25rem, 5vw, 4rem)"
  section: "clamp(2rem, 3vw, 3rem)"
  heading-gap: "clamp(1rem, 1.6vw, 1.5rem)"
  product-column: "clamp(1rem, 2vw, 1.75rem)"
  product-row: "clamp(2rem, 4vw, 2.75rem)"
components:
  site-header:
    backgroundColor: "{colors.umber}"
    textColor: "{colors.slip}"
    typography: "{typography.display}"
    padding: "clamp(2.5rem, 4vw, 4rem) {spacing.gutter} clamp(1.75rem, 3vw, 2.75rem)"
    height: "clamp(27.5rem, 31.25vw, 35rem)"
  site-footer:
    backgroundColor: "{colors.umber}"
    textColor: "{colors.slip}"
    typography: "{typography.label}"
    padding: "clamp(1.75rem, 3vw, 2.5rem) {spacing.gutter}"
  product-card:
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
  product-image:
    backgroundColor: "{colors.stone-deep}"
    rounded: "{rounded.none}"
  category-index:
    textColor: "{colors.ink}"
    typography: "{typography.lead}"
    rounded: "{rounded.none}"
---

# Design System: Luna Atelier

## Overview

**Creative North Star: "Atölye Föyü"**

Sayfa, bir seramik atölyesinin sergi için bastırdığı tek yapraklık ürün föyü gibi kurulur. Yapıyı kutular değil; serif başlıklar, ince çizgi ve ölçülü boşluk taşır. Renkler atölyenin malzemelerinden gelir: sırsız taş çamuru zemin, fırınlanmış koyu umber alan, bal mumu rengi tek vurgu.

Yoğunluk içerik miktarına göre ayarlıdır: fotoğraflı başlık alanı masaüstünde 500px'te kalır, içerik bölümleri arasında tek bir ritim (48px) vardır. Her bölüm içeriğine göre farklı bir düzen alır: atölye fotoğraflı bir giriş, üç alanlı bir tanıtım, tek satırlık bir kategori dizini, sütun çizgili bir katalog. Hareket yoktur.

**Key Characteristics:**
- Kart, gölge, gradient ve köşe yuvarlama yok
- Tek koyu renk alanı sayfayı açar ve kapatır (header + footer)
- Serif başlık, sans gövde; display ile diğer roller arasında belirgin fark, diğer roller arasında ölçülü adımlar
- Ayrım 1px çizgilerle yapılır
- Ürün görseli yokken yuva boş ve düz kalır; yerine ikon veya çizim konmaz

## Colors

Malzeme renkleri: nötr bir zemin, tek koyu alan, tek vurgu.

### Primary
- **Fırın Umberi** (`umber`): Header ve footer zemini. Sayfada başka hiçbir yerde kullanılmaz.

### Secondary
- **Bal Mumu** (`amber`): Yalnızca koyu alan üstündeki slogan ve metin seçimi rengi.

### Neutral
- **Taş Çamuru** (`stone`): Sayfa zemini. Grimsi bej; krem değil.
- **Pişmiş Taş** (`stone-deep`): Ürün görsel yuvasının zemini; fotoğraf yokken ya da yüklenirken görünür. Metin taşımaz.
- **Demir Sırı** (`ink`): Açık zemindeki tüm başlık ve gövde metni.
- **Soluk Sır** (`ink-soft`): İkincil bilgiler (ürün kategorisi, "Sektör" satırı).
- **Astar** (`slip`): Koyu alan üstündeki metin.
- **Çizgi** (`rule`): Tüm ayırıcı çizgiler; `ink` renginin %24 opaklığı.

### Named Rules
**Tek Alan Kuralı.** Koyu umber yalnızca sayfanın ilk ve son bandında bulunur; içerik bölümlerine renkli zemin verilmez.

**Vurgu Koyuda Kalır Kuralı.** Bal mumu rengi açık zeminde metin olarak kullanılmaz; kontrastı yetmez.

Ölçülen kontrastlar (WCAG): `ink`/`stone` 10,88 · `ink-soft`/`stone` 5,85 · `slip`/`umber` 11,04 · `amber`/`umber` 6,09 · seçim (`ink`/`amber`) 6,99.

## Typography

**Display Font:** Brygada 1918 (yedek: Iowan Old Style, Georgia, serif)
**Body Font:** Hanken Grotesk (yedek: system-ui, sans-serif)

**Character:** Kesme harf karakterli, sıcak bir serif ile sade bir grotesk. Serif başlık, giriş ve ad taşır; sans okuma metnini ve küçük bilgileri taşır.

İki font da değişken ağırlıklıdır (400–700) ve `public/fonts/` altında woff2 olarak projeden sunulur (latin + latin-ext alt kümeleri, SIL OFL 1.1; lisans metinleri aynı klasörde). CDN kullanılmaz. Boyutlar `src/styles.css` içinde `--type-*` değişkenleridir.

### Hierarchy

1600px masaüstü / 390px mobil değerleriyle:

- **Display** (500, 88 / 40px, 0.95): Yalnızca header'daki "Luna Atelier".
- **Headline** (500, 26 / 22px, 1.15): Bölüm başlıkları (`h2`).
- **Lead** (400, 22 / 18px, 1.4): Hakkında giriş paragrafı (en çok 30em) ve kategori adları.
- **Title** (500, 19 / 17px, 1.25): Ürün adı ve fiyat.
- **Tagline** (400, 18 / 16px): Header'daki slogan.
- **Body** (400, 17 / 16px, 1.6): Gövde metni ve listeler; ürün açıklaması en çok 34ch.
- **Label** (400, 15px): Kategori etiketi, "Sektör" satırı, "Hedef Kitle" etiketi (500) ve listesi, footer.

### Named Rules
**Etiket Sade Kalır Kuralı.** Küçük bilgiler büyük harfe çevrilmez ve harf aralığı açılmaz; yalnızca boyut ve renk ile ayrışır.

**Tek Büyük Ses Kuralı.** Display boyutu yalnızca atölye adına aittir; başka hiçbir öğe headline'dan büyük yazılmaz.

## Layout

- İçerik en çok 80rem genişliğinde; kenar boşluğu `gutter`, geniş ekranda içerik ortalanır.
- Bölümler arası dikey boşluk `section` (32–48px); hero → Hakkında, Hakkında → Kategoriler ve Kategoriler → Ürünler aynı aralıktadır. Başlık ile içeriği arası `heading-gap` (16–24px).
- **Header (atölye fotoğraflı hero):** ekran genişliğine bağlı, ekran yüksekliğine bağlı değil.
  - 1000px ve üstü: `clamp(27.5rem, 31.25vw, 35rem)` (1600px'te 500px, 1920px'te 560px). `hero-atolye.jpg` arka planda, `cover`, konum `75% 42%`; fotoğrafın üstündeki boş alan kırpılır, zanaatkârın başı, yüzü, elleri ve kupası kadrajda kalır.
  - 600–999px: `clamp(20rem, 40vw, 23.75rem)` (800px'te 320px); aynı fotoğraf ve konum `75% 42%`, sahne neredeyse tamamen görünür.
  - Her iki düzende metin sol üstte, fotoğraftaki gölgeli duvarın üzerinde durur.
  - 600px altı: önce `hero-atolye-mobil.jpg` bandı (`clamp(13.75rem, 58vw, 16.25rem)`, 390px'te 226px), altında umber zeminde başlık ve slogan. Metin fotoğrafın üzerine binmez.
- **Atölye Hakkında:**
  - 1000px ve üstü: üç alan, `0.75fr / 1.75fr / 1.3fr`, kolon aralığı `clamp(2rem, 3.5vw, 3.5rem)` (başlık | giriş + "Sektör" | "Hedef Kitle" listesi). Dar başlık kolonu, giriş ile listeyi tek bir grup olarak öne çıkarır. Bölümün sesi giriş paragrafıdır; "Sektör" ve "Hedef Kitle" aynı sakin `label` / `ink-soft` tonunda kalır.
  - Altında: tek sütun.
- **Kategoriler:** 600px ve üstünde üç eşit sütunlu tek satır; altında alt alta satırlar.
- **Ürünler:**
  - 1000px ve üstü: üç sütun.
  - 600–999px: iki sütun; tek kalan son ürün iki sütuna yayılır (görsel solda, metin sağda).
  - 600px altı: tek sütun; ürünler yatay çizgiyle ayrılır.
- Ürün kartında ad ve fiyat aynı satırda (ad solda, fiyat sağda), altında kategori, sonra açıklama. Görsel sıra CSS ile kurulur; DOM sırası değişmez.
- Ölçülen sayfa yüksekliği: 1600px'te 1696px, 800px'te 1783px, 390px'te 2557px.

## Elevation & Depth

Gölge yoktur. Derinlik yalnızca ton farkıyla verilir: koyu umber bantlar, taş zemin ve bir ton koyu görsel yuvaları.

## Shapes

Tüm köşeler keskindir (radius 0). Ayrım 1px `rule` çizgileriyle yapılır: listelerde yatay, kategori ve ürün sütunları arasında dikey. Ürün görsel yuvası sütun genişliğindedir; oranı `--product-image-ratio` değişkeniyle belirlenir (varsayılan 4:3).

## Components

### Site Header
Atölye fotoğrafı üzerinde serif başlık ve bal mumu renkli slogan. Fotoğraf CSS arka planıdır (dekoratif, `alt` yok); yüklenene kadar umber zemin görünür. Buton, overlay, gradient veya yazı gölgesi yoktur. Okunabilirliği fotoğrafın sol üstteki koyu duvarı sağlar: başlık kontrastı en kötü noktada ≥5,8:1 (masaüstünde ≥7,3:1), sloganın arkasındaki piksellerin %99,9'u ≥4,5:1. Duvarın alt yarısındaki ışık lekelerinde kontrast 2,2:1'e düşer; bu yüzden metin bloğu aşağı taşınmaz.

**Hero fotoğrafı:** `public/images/hero-atolye.jpg` (1918×820, kaynak: "Sunlit Ceramics Studio Crafting") ve `hero-atolye-mobil.jpg` (1000×578, kaynağın x 880–1918, y 100–700 bölgesi; baş, yüz, eller ve kupa kadrajda). Yeni bir hero fotoğrafı gelirse sol ~%40 sakin ve koyu kalmalı, kişi sağ yarıda olmalı.

### Quiet List
"Hedef Kitle": sans etiket (`label`, 500, `ink-soft`), altında tek bir 1px çizgi ve madde imsiz, `label` boyutunda `ink-soft` satırlar. Satırlar arasında çizgi yok; tablo değil, bir künye notu gibi okunur.

### Category Index
Üstte ve altta tam genişlikte çizgi olan dizin satırı; kategori adları serif, aralarında dikey çizgi.

### Product Card
- **Corner Style:** keskin (0)
- **Background:** yok; kart sayfa zemininde durur
- **Shadow Strategy:** yok
- **Border:** kartın kendisinde yok; sütunlar arasında 1px dikey çizgi
- **Internal Padding:** görsel ile ad arası 1rem; sütun iç boşluğu `product-column`

### Product Image Slot
- **Fotoğraf varken:** `<img>`, yuvayı `object-fit: cover` ile doldurur; `alt` ürün adıdır.
- **Fotoğraf yokken:** aynı sınıfta boş, düz `stone-deep` alan; ekran okuyucudan gizlidir. İkon, çizim, yazı veya yapay görsel konmaz.
- **Fotoğraf ekleme:** dosya `public/images/` altına konur ve ürünün `image` alanına yolu yazılır. Bileşen değişmez. Dosya diskte yokken yol yazılmaz; yoksa boş yuva yerine kırık görsel görünür.
- **Hedef dosyalar:** `luna-seramik-kupa.jpg`, `amber-soya-mum.jpg`, `terra-minimal-kolye.jpg`.

#### Ürün fotoğrafı görsel dili

Üç fotoğraf aynı serinin parçası gibi görünmelidir: aynı ışık, aynı yüzey ailesi, aynı kamera açısı ve aynı ürün ölçeği.

- **Işık:** doğal ve yumuşak, tek yönlü (yandan pencere ışığı gibi). Sert gölge, flaş parlaması, renkli ışık yok.
- **Kompozisyon:** minimalist; kadrajda yalnızca ürün ve yüzey. Aksesuar ya da dekor gerekirse en fazla bir doğal öğe, ürünün önüne geçmeden.
- **Yüzeyler:** taş, keten, sırsız seramik, ham ahşap gibi doğal malzemeler. Üç çekimde aynı yüzey ailesi kullanılır.
- **Ton:** sıcak ama abartısız. Arka plan sitenin taş/bej zeminine (`stone`) yakın; tamamen beyaz ya da tamamen siyah değil. Renk sertleştirilmez, filtre eklenmez.
- **Odak:** ürün net ve açıkça ana öğe; arka plan hafif yumuşak olabilir.
- **His:** katalog / editoryal ürün fotoğrafı; yaşam tarzı sahnesi değil.

#### 4:3 teknik yönergeleri

Yuva `aspect-ratio: 4 / 3` ve `object-fit: cover` ile çalışır. Farklı oranlı fotoğraflar kenarlardan kırpılır.

- **Kadraj:** yatay 4:3 çekilir veya 4:3'e kırpılarak teslim edilir (ör. 1800×1350px).
- **Çözünürlük:** en az 1200×900px. Masaüstünde yuva ~380px genişlikte; yüksek yoğunluklu ekranlar için 2 katı gerekir.
- **Konum:** ürün kadrajın ortasında ve her kenardan en az %10 boşlukla durur; böylece `cover` kırpması ürünü kesmez.
- **Ölçek:** ürün üç fotoğrafta da kadraj yüksekliğinin yaklaşık %55–65'ini kaplar; seri içinde biri diğerlerinden belirgin büyük görünmez.
- **Kamera açısı:** üçünde aynı; hafif yukarıdan (yaklaşık 15–30°) ya da tam önden.
- **Dosya:** JPEG, sRGB, kalite ~80; dosya başına ideal olarak 300 KB'ın altında.
- **Dikey çekim:** seri dikey çekilirse yalnızca `--product-image-ratio` değeri `4 / 5` yapılır; üç fotoğraf aynı oranda olmalıdır.

### Catalog QR
Ürünler bölümünün sonunda, üstünde tam genişlikte 1px `rule` çizgisi olan sakin bir satır: solda 96px (6rem) QR kod, yanında `label` boyutunda ve `ink-soft` renkte tek satır açıklama. Çizgi ile ürünler arası `section`, çizgi ile QR arası `heading-gap`.

- **QR:** satır içi SVG; modüller `ink`, zemin sayfanın `stone` rengi (kontrast 10,88:1). Kutu, çerçeve, gölge veya köşe yuvarlama yok.
- **Sessiz bölge:** SVG'de yoktur; QR sol içerik hizasına oturur ve çevresindeki açık zemin boşluğu sessiz bölge görevini görür. QR'ın dört yanında en az ~12px açık zemin kalmalı.
- **Kodlanan adres:** sayfanın kendi adresi + `#urunler`.

### Site Footer
Header ile aynı koyu alan; tek satır, `label` boyutunda.

## Do's and Don'ts

### Do:
- **Do** ayırmak için 1px `rule` çizgisi kullan.
- **Do** başlık ve adlarda Brygada 1918, gövde ve etiketlerde Hanken Grotesk kullan.
- **Do** boyutları `--type-*` ve boşlukları `--section` / `--heading-gap` değişkenlerinden al.
- **Do** koyu umber alanı yalnızca header ve footer'da tut.
- **Do** yeni metin renklerinde en az 4,5:1 kontrastı ölç.
- **Do** liste imlerini `list-style-type: ''` ile kaldır; liste anlamı korunur.

### Don't:
- **Don't** kart kutusu, gölge, köşe yuvarlama, gradient veya cam efekti ekleme.
- **Don't** ürün görseli yokken yuvaya ikon, çizim veya yapay placeholder koyma.
- **Don't** bal mumu rengini açık zeminde metin için kullanma.
- **Don't** küçük etiketleri büyük harfe çevirip harf aralığı açma; başlık üstüne etiket koyma.
- **Don't** bölüm boşluklarını `section` ritminin dışına çıkarma; hero'yu ekran yüksekliğine (`vh`/`svh`) bağlama.
- **Don't** animasyon veya süs öğesi ekleme.
- **Don't** fontları CDN'den yükleme.
