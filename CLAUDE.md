# CLAUDE.md

## Project

AtölyeKart — Luna Atelier için adım adım geliştirilen küçük bir atölye vitrini.

## Current Stage

Hafta 2 — Güvenli API katmanı, KVKK ve deploy. Formlar artık webhook'a doğrudan gitmez; `/api` arkasından çalışır. Stage 1.1 (HTML), 1.2 (React ve tasarım), 1.5 (Skill / MCP / QR / sub-agent) ve 1.6 (formlar) tamamlandı. Stage 1.3 (veri modeli) ve Stage 1.4 (hata yönetimi) henüz yapılmadı; istenmeden başlanmaz.

Hafta 2 kapsamında yapılanlar: e-posta doğrulama hatasının düzeltilmesi, worktree'de geliştirilen kategori filtresi, sunucu API'si (`/api/order`, `/api/stock-request`, `/api/admin/orders`), sunucu tarafı doğrulama ve stok kontrolü, IP bazlı rate limit, admin için JWT, sırların sunucuya taşınması, açık rıza kutusu, örnek gizlilik politikası (`/gizlilik.html`), `GUVENLIK-KONTROL-LISTESI.md` ve testler (`node:test`). Build gerektirmeyen statik sürüm (`cdn/`) kullanıcı isteğiyle kaldırıldı.

Önceki aşamalardan kalanlar: editoryal/atölye tasarım sistemi (`DESIGN.md`), gerçek ürün fotoğrafları, atölye fotoğraflı hero, proje Skill'i, katalog QR kodu ve alt ajanla yapılan tasarım incelemesi (öneriler `plan.md` içinde).

## Commands

- `npm install` — bağımlılıkları kurar
- `npm run dev` — geliştirme sunucusu; sayfayı ve `/api`'yi birlikte çalıştırır (`vercel dev` gerekmez)
- `npm run build` — üretim derlemesi
- `npm test` — `node:test` ile doğrulama ve API testleri
- `node --env-file=.env.local scripts/admin-token.mjs` — yerel/test amaçlı admin JWT üretir

## Project Purpose

Luna Atelier'yi ve ürünlerini tanıtan, butik ve editoryal bir tek sayfa oluşturmak; ziyaretçinin sipariş ve stok bildirimi taleplerini güvenli bir API üzerinden atölyeye iletmek.

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

- Vite + React (JSX); bağımlılıklar yalnızca `react`, `react-dom`, `qrcode-generator`, `vite`, `@vitejs/plugin-react`. Sunucu kodu bağımlılık kullanmaz (`node:crypto`, `fetch`)
- `index.html`: Vite giriş dosyası (`#root` ve `src/main.jsx`). `gizlilik.html`: ikinci Vite girişi, React'siz statik sayfa
- `src/App.jsx`: header, Atölye Hakkında, Kategoriler, Ürünler, Sipariş ve Bildirim, footer
- `src/products.js`: sabit `products` dizisi (web ve mobil ortak). Stok durumu burada tutulmaz
- `src/components/`: `ProductList`, `ProductCard`, `ProductImage`, `CatalogQR`, `CategoryFilter`, `RequestForm`
- `src/webhook/`: `validation.js`, `payload.js`, `adapter.js` (UI'dan bağımsız; aşağıya bakın)
- `api/index.js`: tek Vercel Function; `vercel.json` içindeki rewrite tüm `/api/*` isteklerini buraya verir
- `server/`: `router.js`, `routes/` (`order`, `stock-request`, `admin-orders`), `lib/` (`catalog`, `validate`, `rate-limit`, `jwt`, `webhook`, `orders`, `http`) ve `api.test.js`
- `scripts/admin-token.mjs`: yerel admin JWT üretici
- `src/styles.css`: tek stil dosyası; `src/main.jsx` ve `gizlilik.html` kullanır. Tasarım sistemi `DESIGN.md` içinde belgelidir
- `public/images/`: üç ürün fotoğrafı ve hero fotoğrafları (`hero-atolye.jpg` masaüstü/tablet, `hero-atolye-mobil.jpg` mobil kırpım). Hero fotoğrafı JSX'te değil, `.site-header` için CSS arka planı olarak kullanılır
- `public/images/paylasim-gorseli.png`: bağlantı önizleme görseli (1200×630, yazı markası + slogan). `index.html` içindeki `og:` etiketleri tam adresle bunu gösterir (`https://atolyekart-tawny.vercel.app/…`); alan adı değişirse etiketler güncellenir
- `public/favicon.png`: sekme simgesi (umber zeminde "L" harfi). Kural 9'daki ikon yasağının bilinçli tek istisnasıdır; sayfa içine ikon eklenmez
- `public/fonts/`: Brygada 1918 ve Hanken Grotesk (woff2, yerel; CDN yok) ve OFL lisans metinleri
- State yalnızca `RequestForm` içindeki form state'i ve `App` içindeki seçili kategoridir. Routing yok. Stok bilgisi sayfada gösterilmez; kartlara stok etiketi eklenmez. Stok kuralını sunucu uygular ve reddederse mesajı form durum satırında görünür

Bileşenler:

| Bileşen | Ürettiği HTML | Sorumluluk |
| --- | --- | --- |
| `ProductList` | `ul.product-list` ve `li` öğeleri | `products` dizisini alır, her ürün için bir `ProductCard` render eder |
| `ProductCard` | `article.product-card` | Tek ürünün görselini, adını, kategorisini, fiyatını ve açıklamasını gösterir |
| `ProductImage` | `img.product-image` (görsel yoksa boş `div.product-image`) | `src` ve `alt` alır; `src` varsa görseli, yoksa ekran okuyucudan gizli boş yuvayı render eder |
| `CatalogQR` | `div.catalog-qr` (SVG QR kod + açıklama) | Katalog adresini QR kod olarak çizer |
| `CategoryFilter` | `div.category-filter` (`role="group"`, `button[aria-pressed]`) | `categories`, `selected`, `onSelect` alır; "Tümü" ve kategori düğmelerini çizer. Filtreleme `App` içinde yapılır |
| `RequestForm` | `form.request-form` | `kind` (`order` / `stock-alert`), `title` ve `products` alır; doğrular, istek gövdesini üretir, adapter'a verir |

### Katalog QR kodu

- Ürünler bölümünün (`section.catalog#urunler`) sonunda durur; 96px, `ink` modüller taş zeminde, yanında "Kataloğu telefonunuzda açın".
- Adres sabit yazılmaz: sayfanın kendi adresinden üretilir (`<sayfa adresi>#urunler`). Sabitlenecekse `VITE_CATALOG_URL` kullanılır.
- QR'ın sessiz bölgesi SVG'de yoktur; çevresindeki açık zemin boşluğu bu işi görür. Etrafına koyu zemin ya da bitişik öğe konmaz.

### Formlar, API ve webhook

Akış: **form → validation → istek gövdesi → API adapter → `/api` (sunucu) → webhook**. Bileşen yalnızca `sendRequest(path, body)` çağırır.

- `section.requests#siparis` kataloğun altında, footer'ın üstündedir. Ürün kartlarına buton eklenmedi.
- "Sipariş Ver": ad, ürün, adet, telefon, e-posta (isteğe bağlı), açık rıza → `POST /api/order`. "Stok Bildirimi İste": ad, ürün, e-posta, açık rıza → `POST /api/stock-request`.
- İstemci gövdesi: sipariş `name`, `productId`, `phone`, `email`, `quantity`, `consent`, `source`; stok bildirimi `name`, `productId`, `email`, `consent`, `source`. `productName` ve `event` gönderilmez.
- **Sunucu istemciye güvenmez:** aynı doğrulama kuralları (`src/webhook/validation.js`) sunucuda yeniden uygulanır, türler denetlenir, `productName` ve stok `server/lib/catalog.js`'ten gelir, `consent: true` zorunludur.
- **Stok:** Terra Minimal Kolye stokta yok, diğer ikisi stokta. Sipariş yalnızca stoktaki ürüne (`409 out_of_stock`), stok bildirimi yalnızca tükenmiş ürüne (`409 in_stock`) kabul edilir.
- **Webhook'u sunucu gönderir** ve `X-Atolyekart-Signature` (HMAC-SHA256) ile imzalar. Olay gövdesi `webhook-format.md` içindedir.
- **Sırlar yalnızca sunucudadır:** `WEBHOOK_URL`, `WEBHOOK_SECRET`, `JWT_SECRET`. Hiçbirine `VITE_` öneki verilmez; koda, depoya, terminal çıktısına ya da rapora yazılmaz. Canlı değerleri kullanıcı Vercel panelinden girer; Claude üretmez ve eklemez. Yerelde `.env.local`.
  - Yerelde `WEBHOOK_URL` boşsa olay sunucu günlüğüne `[webhook:mock]` ile yazılır. Canlıda adres ya da anahtar eksikse talep `502` ile reddedilir.
  - `VITE_API_URL` gizli değildir: boşsa aynı alan adı, `mock:` ağ isteği yapmaz, `mock:fail` hatayı dener.
- **Rate limit:** IP başına dakikada 10 istek, tüm `/api` yolları için ortak; aşılırsa `429` ve `Retry-After`. Sayaç bellek içidir ve Vercel'de instance başınadır (`server/lib/rate-limit.js` içindeki nota bakın). Redis/Upstash eklenmedi.
- **JWT yalnızca admin içindir:** `GET /api/admin/orders`, `Authorization: Bearer <HS256 JWT>`, `role: "admin"` ve geçerli `exp` ister (401 / 403). Ziyaretçi formları JWT ile korunmaz.
- Son siparişler veritabanında değil, instance belleğinde tutulur (en fazla 50); yalnızca admin uç noktasının gösterimi içindir.
- API yanıtlarında teknik ayrıntı ya da stack trace bulunmaz; ayrıntı yalnızca sunucu günlüğüne yazılır.
- API CORS başlığı göndermez: web aynı alan adından, mobil yerel `fetch` ile çağırır.
- Talep başına tek ürün vardır. Doğrulama gönderimde yapılır; hatalar alan altında gösterilir. Telefon `+905XXXXXXXXX`, e-posta küçük harfle ve yalnızca ASCII olarak girer.
- Başarısız gönderimde form değerleri kalır ve ziyaretçi yeniden gönderebilir. Daha kapsamlı hata yönetimi Stage 1.4'tür.

### KVKK

- İki formda da açık rıza kutusu vardır; işaretlenmeden form gönderilmez ve sunucu da reddeder.
- `/gizlilik.html` örnek bir taslaktır: hukuki danışmanlık değildir, şirket bilgileri köşeli parantezli yer tutucudur. Gerçek bilgiler yayından önce yazılmalıdır.

## Project Files

- `DESIGN.md` — uygulanan tasarım sistemi (token'lar, tipografi, düzen, bileşenler, fotoğraf yönergeleri). Stil değişikliğinden önce okunur ve değişiklikten sonra güncellenir
- `plan.md` — aşama planları ve uygulama raporları
- `.claude/skills/atolyekart-standartlari/` — proje Skill'i: bileşen, adlandırma, görsel, stil, responsive ve form/API standartları (`SKILL.md`) ile webhook ve API gövde formatı (`webhook-format.md`)
  - `evals/evals.json` — Skill'i ölçen senaryolar ve beklentiler. `scripts/degerlendir_dorduncu_urun.py` ve `scripts/duzen_olc.mjs` 1. senaryoyu bir proje kopyasında otomatik notlar. İlk ölçüm (tek çalıştırma, `cdn/` sürümü varken): Skill ile 12/12, Skill'siz 11/12; fark `DESIGN.md` güncellemesi ve tarayıcıda doğrulama. `cdn/` kaldırılınca beklentiler 10'a indi ve yeniden ölçülmedi. Ölçüm projenin kopyasında yapılır, bu depoda değil
- `GUVENLIK-KONTROL-LISTESI.md` — Hafta 2 güvenlik kontrol listesi ve her maddenin kanıtı
- `.env.example` — ortam değişkenlerinin adları ve biçimi (`VITE_CATALOG_URL`, `VITE_API_URL`, `WEBHOOK_URL`, `WEBHOOK_SECRET`, `JWT_SECRET`); gerçek değerler `.env.local` ve Vercel'de tutulur, depoya girmez
- `.impeccable/config.json` — tasarım dedektörünün yok sayma kayıtları

## Future Roadmap

Yalnızca yol haritasıdır; istenmeden uygulanmaz.

- Stage 1.3 — Veri modeli
- Stage 1.4 — Hata yönetimi
- n8n bağlantısı: `WEBHOOK_URL` değişir, alıcıda imza doğrulanır
- Paylaşımlı rate limit ve kalıcı sipariş kaydı (ortak depo gerektirir)

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
10. Sırları (`WEBHOOK_URL`, `WEBHOOK_SECRET`, `JWT_SECRET`, tokenlar) koda, depoya, terminal çıktısına ya da rapora yazma; `VITE_` önekiyle tarayıcıya açma. Canlı sır değerlerini üretme ya da Vercel'e ekleme; eksikse dur ve bildir.
11. Ürün veya hero fotoğrafı yerine yapay placeholder, SVG veya ikon koyma.
12. Bileşen, stil, görsel, form/API ya da webhook üzerinde çalışırken `atolyekart-standartlari` Skill'ini kullan.
13. Ziyaretçi formlarını (`/api/order`, `/api/stock-request`) JWT ile koruma. Açıkça istenmeden `git push` yapma.
