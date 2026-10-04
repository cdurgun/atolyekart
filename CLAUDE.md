# CLAUDE.md

## Project

AtölyeKart — Luna Atelier için adım adım geliştirilen küçük bir atölye vitrini.

## Current Stage

Stage 1.6 — Webhook'a hazır formlar (tamamlandı; gerçek webhook/n8n bağlantısı yapılmadı, mock adapter çalışıyor). Stage 1.1 (HTML), Stage 1.2 (React'e geçiş ve görsel tasarım) ve Stage 1.5 (Skill / MCP / QR / sub-agent) da tamamlandı. Stage 1.3 (veri modeli) ve Stage 1.4 (hata yönetimi) henüz yapılmadı; istenmeden başlanmaz.

Stage 1.2 kapsamında yapılanlar: HTML'in React bileşenlerine taşınması, editoryal/atölye tasarım sistemi (`DESIGN.md`), kompaktlaştırma turları, gerçek ürün fotoğrafları, atölye fotoğraflı hero ve build gerektirmeyen ayrı bir statik sürüm (`cdn/`).

Stage 1.5 kapsamında yapılanlar: proje Skill'i (`.claude/skills/atolyekart-standartlari/`), GitHub deposu ve ilk commit (GitHub MCP ile), katalog QR kodu (`qrcode-generator`) ve bir alt ajanla art director tasarım incelemesi (öneriler `plan.md` içinde; onaysız uygulanmadı).

Stage 1.6 kapsamında yapılanlar: "Sipariş ve Bildirim" bölümü ("Sipariş Ver" ve "Stok Bildirimi İste" formları), form doğrulama, ödev sözleşmesiyle birebir aynı düz payload (`webhook-format.md`) ve UI'dan ayrı webhook adapter katmanı (mock + HTTP). İki form webhook.site'a gerçek POST ile denendi. n8n'e bağlanmak için yalnızca webhook adresi verilir.

## Commands

- `npm install` — bağımlılıkları kurar
- `npm run dev` — geliştirme sunucusu (React/Vite sürümü)
- `npm run build` — üretim derlemesi
- `cdn/index.html` — statik sürüm; tarayıcıda doğrudan açılır, npm veya build gerekmez

## Project Purpose

Luna Atelier'yi ve ürünlerini tanıtan, butik ve editoryal bir tek sayfa oluşturmak. Stage 1.1'deki HTML sayfası içeriği değiştirilmeden React bileşenlerine taşındı, ardından tasarlandı.

## Business / Domain

Luna Atelier, el yapımı dekorasyon ve yaşam ürünleri üreten küçük bir atölyedir. Slogan: "El emeğiyle, sana özel."

## Target Audience

- El yapımı ve özgün ürünleri sevenler
- Evine sade, doğal dokunuşlar katmak isteyenler
- Sevdiklerine özel hediye arayanlar

## Product Categories

- Seramik
- Doğal Mumlar
- El Yapımı Aksesuarlar

## Initial Products

| Ürün | Kategori | Fiyat | Görsel |
| --- | --- | --- | --- |
| Luna Seramik Kupa | Seramik | 420 TL | `/images/luna-seramik-kupa.jpg` (1200×900) |
| Amber Soya Mum | Doğal Mumlar | 350 TL | `/images/amber-soya-mum.jpg` (1188×891; sol kenardaki kolaj şeridi kırpıldı) |
| Terra Minimal Kolye | El Yapımı Aksesuarlar | 290 TL | `/images/terra-minimal-kolye.jpg` (1200×900) |

Fotoğraflar 4:3, sRGB JPEG ve aynı çekim serisinin parçasıdır (taş yüzey, keten, soldan yumuşak ışık). Bir fotoğraf değişirse aynı dosya adıyla `public/images/` altına konur; dosya diskte yokken `image` alanına yol yazılmaz (yoksa kartta kırık görsel görünür, `image: null` boş yuvayı gösterir). Çekim yönergesi: `DESIGN.md` → Components → Product Image Slot.

## Current Scope

- Vite + React (JSX); bağımlılıklar yalnızca `react`, `react-dom`, `qrcode-generator`, `vite`, `@vitejs/plugin-react`
- `index.html`: Vite giriş dosyası (`#root` ve `src/main.jsx`)
- `src/App.jsx`: header, Atölye Hakkında, Kategoriler, Ürünler, Sipariş ve Bildirim, footer ve sabit `products` dizisi
- `src/components/`: `ProductList`, `ProductCard`, `ProductImage`, `CatalogQR`, `RequestForm`
- `src/webhook/`: `validation.js`, `payload.js`, `adapter.js` (UI'dan bağımsız; aşağıya bakın)
- `src/styles.css`: tek stil dosyası; `src/main.jsx` içinden import edilir. Tasarım sistemi `DESIGN.md` içinde belgelidir
- `public/images/`: üç ürün fotoğrafı ve hero fotoğrafları (`hero-atolye.jpg` masaüstü/tablet, `hero-atolye-mobil.jpg` mobil kırpım). Hero fotoğrafı JSX'te değil, `.site-header` için CSS arka planı olarak kullanılır
- `public/images/paylasim-gorseli.png`: bağlantı önizleme görseli (1200×630, yazı markası + slogan). `index.html` içindeki `og:` etiketleri tam adresle bunu gösterir (`https://atolyekart-tawny.vercel.app/…`); alan adı değişirse etiketler güncellenir. Statik `cdn/` sürümü yayınlanmadığı için orada `og:` etiketi yoktur
- `public/fonts/`: Brygada 1918 ve Hanken Grotesk (woff2, yerel; CDN yok) ve OFL lisans metinleri
- `cdn/`: React'siz statik sürüm; `script.js` QR kod, `forms.js` formlar için (aşağıya bakın)
- State yalnızca `RequestForm` içindeki form state'idir. Veri çekme ve routing yok; stok bilgisi gösterilmez (stok bildirimi her ürün için istenebilir)

Bileşenler Stage 1.1 işaretlemesini birebir üretir:

| Bileşen | Ürettiği HTML | Sorumluluk |
| --- | --- | --- |
| `ProductList` | `ul.product-list` ve `li` öğeleri | `products` dizisini alır, her ürün için bir `ProductCard` render eder |
| `ProductCard` | `article.product-card` | Tek ürünün görselini, adını, kategorisini, fiyatını ve açıklamasını gösterir |
| `ProductImage` | `img.product-image` (görsel yoksa boş `div.product-image`) | `src` ve `alt` alır; `src` varsa görseli, yoksa ekran okuyucudan gizli boş yuvayı render eder |
| `CatalogQR` | `div.catalog-qr` (SVG QR kod + açıklama) | Katalog adresini QR kod olarak çizer |
| `RequestForm` | `form.request-form` | `kind` (`order` / `stock-alert`), `title` ve `products` alır; doğrular, payload'u üretir, adapter'a verir |

### Katalog QR kodu

- Ürünler bölümünün (`section.catalog#urunler`) sonunda durur; 96px, `ink` modüller taş zeminde, yanında "Kataloğu telefonunuzda açın".
- Adres sabit yazılmaz: sayfanın kendi adresinden üretilir (`<sayfa adresi>#urunler`). Deploy edilince alan adını kendiliğinden kullanır; yerelde `localhost` ya da `file://` adresini kodlar.
- Adres sabitlenecekse: React'te `VITE_CATALOG_URL` ortam değişkeni, CDN'de `<meta name="atolyekart:catalog-url" content="…">`.
- QR'ın sessiz bölgesi SVG'de yoktur; çevresindeki açık zemin boşluğu bu işi görür. Etrafına koyu zemin ya da bitişik öğe konmaz.

### Formlar ve webhook katmanı

Akış: **form → validation → payload → adapter**. Bileşen yalnızca `sendEvent(payload)` çağırır.

- `section.requests#siparis` kataloğun altında, footer'ın üstündedir. Ürün kartlarına buton eklenmedi.
- "Sipariş Ver": ad, ürün, adet, telefon, e-posta (isteğe bağlı) → `order.requested`. "Stok Bildirimi İste": ad, ürün, e-posta → `stock_alert.requested`.
- **Gövde ödev sözleşmesiyle birebir aynıdır** ve yalnızca şu alanları taşır; başka alan eklenmez:
  - Sipariş: `event`, `name`, `productId`, `productName`, `phone`, `email`, `quantity`, `source`
  - Stok bildirimi: `event`, `name`, `productId`, `productName`, `email`, `source`
- `productId` ürünün slug'ıdır (ürün modelinde ayrı `id` yok); `quantity` sayıdır (1–99, varsayılan 1); siparişte e-posta boşsa `email: null` gider; `source` `react` ya da `cdn`'dir ve iki sürümün gövdesi arasındaki tek farktır.
- Sözleşme yalnızca payload katmanındadır (`requestKinds`, `buildRequestEvent`); adapter gövdeyi olduğu gibi gönderir.
- Talep başına tek ürün vardır. Çoklu ürün yalnızca bir planlama egzersiziydi; uygulanmadı.
- Doğrulama gönderimde yapılır; hatalar alan altında gösterilir. Telefon payload'a `+905XXXXXXXXX`, e-posta küçük harfle girer.
- **Webhook adresi koda yazılmaz.** React'te `VITE_WEBHOOK_URL` (`.env.local`; örnek `.env.example`), CDN'de `<meta name="atolyekart:webhook-url" content="…">`.
  - Boş: mock adapter. Ağ isteği yapılmaz; payload ve başlıklar konsola `[webhook:mock]` ile yazılır.
  - `mock:fail`: başarısız teslimatı dener.
  - Gerçek adres: HTTP adapter (`POST`, sözleşmedeki başlıklar, 5 sn zaman aşımı). n8n'e geçiş için yapılacak tek şey budur.
- Tarayıcı `X-Atolyekart-Signature` göndermez (gizli anahtar istemcide saklanamaz).
- Başarısız gönderimde form değerleri kalır ve ziyaretçi yeniden gönderebilir. Daha kapsamlı hata yönetimi Stage 1.4'tür.
- Gerçek adres bağlanırken alıcıda CORS (özel başlıklar ön kontrol isteği doğurur) ve canlıya çıkmadan önce KVKK aydınlatma metni gerekir; ikisi de yapılmadı.

### Statik sürüm (`cdn/`)

- `cdn/index.html`: React'in ürettiği HTML'in elle yazılmış kopyası
- `cdn/forms.js`: `src/webhook/` ve `RequestForm`'un sade JavaScript karşılığı. Ürün verisini sayfadaki kartlardan okur; QR kütüphanesine bağlı değildir
- `cdn/script.js`: `CatalogQR` bileşeninin sade JavaScript karşılığı. `qrcode-generator` 2.0.4 jsDelivr'den, sürümü sabit ve `integrity` (SRI) hash'li yüklenir; kütüphane yüklenemezse QR satırı gizli kalır, sayfanın geri kalanı etkilenmez
- `cdn/styles.css`: `src/styles.css`'ten üretilir; yalnızca varlık yolları farklı (`fonts/` ve `../public/images/`). Elle düzenlenmez; üretme komutu Skill'de yazılı
- `cdn/fonts/`: font kopyaları. `file://` ile açılan sayfalarda Firefox/Safari üst klasörden font yüklemediği için gerekli
- Görseller kopyalanmaz, `../public/images/` kullanılır. `cdn/` tek başına yayınlanacaksa `public/images/` içine kopyalanıp yollar `images/` yapılmalı
- `cdn/index.html` font preload satırı içermez (`file://` altında CORS hatası verir)
- `.impeccable/config.json` içinde `cdn/index.html` için `cramped-padding` yok sayma kaydı var: çizgilere yaslı metin onaylı katalog düzenidir

## Project Files

- `DESIGN.md` — uygulanan tasarım sistemi (token'lar, tipografi, düzen, bileşenler, fotoğraf yönergeleri). Stil değişikliğinden önce okunur ve değişiklikten sonra güncellenir
- `plan.md` — aşama planları ve uygulama raporları
- `.claude/skills/atolyekart-standartlari/` — proje Skill'i: bileşen, adlandırma, görsel, stil, responsive ve React↔CDN standartları (`SKILL.md`) ile webhook payload formatı (`webhook-format.md`)
  - `evals/evals.json` — Skill'i ölçen senaryolar ve beklentiler. `scripts/degerlendir_dorduncu_urun.py` ve `scripts/duzen_olc.mjs` 1. senaryoyu bir proje kopyasında otomatik notlar. İlk ölçüm (tek çalıştırma): Skill ile 12/12, Skill'siz 11/12; fark `DESIGN.md` güncellemesi ve tarayıcıda doğrulama. Ölçüm projenin kopyasında yapılır, bu depoda değil
- `.env.example` — ortam değişkenleri (`VITE_CATALOG_URL`, `VITE_WEBHOOK_URL`); gerçek değerler `.env.local` içinde tutulur ve depoya girmez
- `.impeccable/config.json` — tasarım dedektörünün yok sayma kayıtları

## Future Roadmap

Yalnızca yol haritasıdır; istenmeden uygulanmaz.

- Stage 1.3 — Veri modeli
- Stage 1.4 — Hata yönetimi
- Gerçek webhook bağlantısı (n8n): yalnızca adres ve alıcı tarafı

## Design Principles

Bu ilkeler `src/styles.css` ile uygulandı; uygulanan sistemin ayrıntısı `DESIGN.md` içindedir. Stil değişikliklerinde önce `DESIGN.md` okunur.

The final product should feel like a bespoke boutique atelier website,
not a generic AI-generated template.

Prefer:
- distinctive visual identity
- intentional typography
- natural and restrained color usage
- editorial/artisan aesthetics
- meaningful visual hierarchy
- purposeful whitespace
- consistent but not repetitive components

Avoid:
- generic AI-style layouts
- excessive gradients
- unnecessary glassmorphism
- excessive rounded cards
- decorative elements without purpose
- repetitive section patterns
- generic stock-template aesthetics

Design decisions should serve the Luna Atelier brand and its products.

## Important Rules

1. Yalnızca geçerli aşamanın (Current Stage) kapsamında çalış; sonraki aşamaları uygulama.
2. Açıkça istenmedikçe yeni bir bağımlılık veya CSS çatısı ekleme; stil yalnızca `src/styles.css` içinde ve `DESIGN.md` ile uyumlu yazılır.
3. Anlamsal HTML kullan: tek `h1`, sıralı `h2`/`h3`, `header` / `main` / `section` / `footer`.
4. Üç ürün kartının işaretlemesini birebir aynı tut; `product-*` sınıf adlarını değiştirme.
5. Sayfa içeriği Türkçe olsun; `lang="tr"` ve `meta charset="utf-8"` korunmalı. Mevcut metinleri yeniden yazma veya değiştirme.
6. Aşama değiştiğinde bu dosyadaki Current Stage ve Current Scope bölümlerini güncelle.
7. Açıkça istenmeyen hiçbir şeyi değiştirme. Kapsamlı işlerde önce kısa bir plan sun ve onay bekle.
8. Hero bitmiş kabul edildi (1600px'te 500px, `hero-atolye.jpg`, `75% 42%`). Açıkça istenmedikçe yüksekliğine, görseline, konumuna, tipografisine ve renklerine dokunma.
9. Overlay, gradient, gölge, yuvarlak köşeli kart, ikon, animasyon veya süs öğesi ekleme.
10. React sürümünde içerik, stil veya davranış değişirse `cdn/index.html`, `cdn/styles.css`, `cdn/script.js` ve `cdn/forms.js` aynı şekilde güncellenir; iki sürüm görsel olarak aynı kalmalı.
11. Ürün veya hero fotoğrafı yerine yapay placeholder, SVG veya ikon koyma.
12. Bileşen, stil, görsel, `cdn/` ya da webhook üzerinde çalışırken `atolyekart-standartlari` Skill'ini kullan.
