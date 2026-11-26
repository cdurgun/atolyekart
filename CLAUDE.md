# CLAUDE.md

## Project

AtölyeKart — Luna Atelier için adım adım geliştirilen küçük bir atölye vitrini.

## Current Stage

Hafta 2 — Güvenli API katmanı, KVKK ve deploy. Formlar artık webhook'a doğrudan gitmez; `/api` arkasından çalışır. Stage 1.1 (HTML), 1.2 (React ve tasarım), 1.5 (Skill / MCP / QR / sub-agent) ve 1.6 (formlar) tamamlandı. Stage 1.3 (veri modeli) ve Stage 1.4 (hata yönetimi) henüz yapılmadı; istenmeden başlanmaz.

Hafta 2 kapsamında yapılanlar: e-posta doğrulama hatasının düzeltilmesi, worktree'de geliştirilen kategori filtresi, sunucu API'si (`/api/order`, `/api/stock-request`, `/api/admin/orders`), sunucu tarafı doğrulama ve stok kontrolü, IP bazlı rate limit, admin için JWT, sırların sunucuya taşınması, açık rıza kutusu, örnek gizlilik politikası (`/gizlilik.html`), `GUVENLIK-KONTROL-LISTESI.md`, testler (`node:test`) ve Expo mobil uygulaması (`mobile/`). Build gerektirmeyen statik sürüm (`cdn/`) kullanıcı isteğiyle kaldırıldı.

Hafta 6 kapsamında yapılanlar: AtölyeKart Asistan için sunucu tarafı sohbet proxy'si (`/api/chat`), n8n tarafında Redis sohbet geçmişi ve Qdrant vektör deposu (21.11.2026'dan beri canlı RAG'de; Chat Trigger Basic Auth ile korunur), n8n MCP ile workflow yönetimi. Geçiş hazırlığı ve hukuki inceleme listesi `docs/hafta6/` içindedir. Ödevin zorunlu teknik maddeleri (Redis Chat History, n8n API ile haftalık sipariş sorgusu, CLAUDE.md güncellemesi) tamamlandı; kanıtlar `docs/hafta6/teslim.md`. n8n canlı geçişi tamamlandı ve yerelde `/api/chat` üzerinden uçtan uca doğrulandı. 21.11.2026'da Vercel Production değişkenleri (`N8N_CHAT_*`) girildi, `855a533` push edildi ve GitHub entegrasyonunun başlattığı Production deploy testleri geçti; asistan production'da yayında. Vercel WAF kuralı `/api/chat` POST için IP başına dakikada 30 istek sınırını production ve Preview'da uygular (host koşulu yok; uygulamanın kendi sayaçlarına ek). Ayrıntı: `docs/hafta6/uretim-hazirlik.md` bölüm 3 ve 6.

Final ödevi, X2 (26.11.2026): sitedeki sohbetin final asistan workflow'una bağlanması. `/api/chat`'in n8n hedefi `N8N_CHAT_BACKEND` ile seçilir. P1: kod PR #2 ile `main`'e squash merge edildi (`27028a1`). P2: Vercel Production'a `N8N_FINAL_*` ve `N8N_CHAT_BACKEND=final` girildi ve redeploy yapıldı; production sohbeti 26.11.2026'dan beri final asistana gider. Smoke testinde stok sorusu başarısız oldu (asistan Prim Hesapla aracını çağırıp kesin stok durumu ve istenmeyen teklif üretti); düzeltilene kadar demoda stok sorusu sorulmaz. Production, Vercel Authentication arkasındadır; demo erişimi tek bir Shareable Link iledir. Ayrıntı: `docs/x2/x2-site-sohbeti.md`.

Önceki aşamalardan kalanlar: editoryal/atölye tasarım sistemi (`DESIGN.md`), gerçek ürün fotoğrafları, atölye fotoğraflı hero, proje Skill'i, katalog QR kodu ve alt ajanla yapılan tasarım incelemesi (öneriler `plan.md` içinde).

## Commands

- `npm install` — bağımlılıkları kurar
- `npm run dev` — geliştirme sunucusu; sayfayı ve `/api`'yi birlikte çalıştırır (`vercel dev` gerekmez)
- `npm run build` — üretim derlemesi
- `npm test` — `node:test` ile doğrulama ve API testleri
- `cd mobile && npx expo start` — mobil uygulama (Expo Go)
- `node --env-file=.env.local scripts/admin-token.mjs` — yerel/test amaçlı admin JWT üretir
- `node --env-file=.env.local scripts/haftalik-siparis-api.mjs` — n8n REST API'den (yalnızca GET) 16–22 Kasım 2026 (Europe/Istanbul) haftasının başarılı `atolyekart-siparis` çalışmalarını listeler (tarih aralığı script içinde sabittir); `.env.local` içinde `N8N_API_URL` ve `N8N_API_KEY` ister, anahtarı ve adresi yazdırmaz

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
- `server/`: `router.js`, `routes/` (`order`, `stock-request`, `admin-orders`, `chat`), `lib/` (`catalog`, `validate`, `rate-limit`, `jwt`, `webhook`, `orders`, `http`), `api.test.js` ve `chat.test.js`
- `scripts/admin-token.mjs`: yerel admin JWT üretici
- `mobile/`: ayrı Expo projesi (SDK 58, kendi `package.json`'ı). `App.js`, `RequestForm.js`, `api.js`, `theme.js`. Ürün verisini, doğrulamayı ve istek gövdesini `../src`'ten içe aktarır (`metro.config.js` → `watchFolders`); `source: "mobile"` ile aynı `/api`'yi çağırır. Bu yüzden `src/products.js`, `src/webhook/validation.js` ve `src/webhook/payload.js` tarayıcıya ya da Vite'a özgü API (`import.meta`, `document`) kullanmaz ve npm paketi içe aktarmaz. `.vercelignore` ile deploy dışındadır
- `src/styles.css`: tek stil dosyası; `src/main.jsx` ve `gizlilik.html` kullanır. Tasarım sistemi `DESIGN.md` içinde belgelidir
- `public/images/`: üç ürün fotoğrafı ve hero fotoğrafları (`hero-atolye.jpg` masaüstü/tablet, `hero-atolye-mobil.jpg` mobil kırpım). Hero fotoğrafı JSX'te değil, `.site-header` için CSS arka planı olarak kullanılır
- `public/images/paylasim-gorseli.png`: bağlantı önizleme görseli (1200×630, yazı markası + slogan). `index.html` içindeki `og:` etiketleri tam adresle bunu gösterir (`https://atolyekart-tawny.vercel.app/…`); alan adı değişirse etiketler güncellenir
- **AtölyeKart Asistan (sohbet):** yalnızca ana sayfadaki yeni Luna tasarımında (`src/features/luna-atelier-preview/`). `components/ChatWidget.jsx` sağ altta sabit düğme ve pencere; `chat/chatClient.js` aynı alan adındaki `POST /api/chat`'e n8n Chat Trigger protokolüyle yazar (`sendMessage` → `{ output }`, `loadPreviousSession` → `{ data: [{ type: 'human'|'ai', data: { content } }] }`). Tarayıcı n8n adresini bilmez; `VITE_N8N_CHAT_URL` kullanılmaz (`@n8n/chat` paketi Vue getirdiği için kullanılmadı; yeni bağımlılık yok)
  - Oturum kimliği `localStorage['atolyekart-chat-session']` içindedir (`/^[A-Za-z0-9-]{8,64}$/`). Pencere ilk açıldığında kayıtlı kimlik varsa geçmiş yüklenir (en fazla 50 mesaj; yalnızca boş olmayan human/ai mesajları; final hedefinde geçmiş boş döner, aşağıya bakın). Başlıktaki "Yeni sohbet" düğmesi (`startNewSession`) kimliği yalnızca tarayıcıdan siler, yenisini üretir ve ağ isteği yapmaz; sunucudaki eski kayıt silinmez. Pencere, önceki konuşmanın bu cihazdaki sohbet görünümünden kaldırıldığını ve sunucuda işlenmiş kayıtların ayrıca tutulabileceğini yazar (`NEW_CHAT_NOTICE`); saklama süresi ya da otomatik silinme iddiası içermez. Yanıt beklenirken düğme devre dışıdır. Sunucu tarafı silme yoktur (ek n8n uç noktası bilinçli olarak yazılmadı)
  - `server/routes/chat.js` proxy'dir: aynı origin (`Origin` / `Sec-Fetch-Site`) dışındaki istekleri 403, JSON olmayanları 415, geçersiz gövdeyi 400 ile reddeder; gövdeyi yalnızca izinli alanlarla (`action`, `sessionId`, `chatInput`) yeniden kurar, IP'yi n8n'e iletmez; n8n'e Basic Auth ile gider (`redirect: 'error'`, zaman aşımı 85 sn / geçmiş 15 sn). n8n adresi `https` olmalıdır (yalnızca yerel `localhost` / `127.0.0.1` için `http`). Yanıtta araç çağrısı, araç sonucu ve sistem mesajı süzülür. Streaming yoktur
  - Hedef seçimi (`N8N_CHAT_BACKEND`): tanımsızsa ya da tam olarak `final` (küçük harf) dışında bir değerdeyse canlı RAG Chat Trigger'a `N8N_CHAT_*` ile gidilir; önceki davranış aynen korunur. `final` ise final asistan webhook'una `N8N_FINAL_URL`, `N8N_FINAL_USER`, `N8N_FINAL_PASSWORD` ile gidilir: gövde yalnızca `{ sessionId, chatInput }` (`action` yok), `{ ok: true, output }` yanıtı `{ output }` olarak döner, n8n 400/503 → 502. Final asistanda geçmiş uç noktası yoktur: `loadPreviousSession` n8n'e gitmeden `{ data: [] }` döner; pencere karşılamayla açılır, bağlam n8n hafızasında sürer. Final değişkenleri eksik ya da geçersizse 503 döner; RAG'e sessiz geri dönüş yoktur. Yerelde `vite.config.js` bu dört değişkeni `.env.local`'dan `/api` sürecine aktarır. Ayrıntı: `docs/x2/x2-site-sohbeti.md`
  - Hatalar: 429 `Retry-After`, 503 yapılandırma eksik, 502 n8n hatası/404, 504 zaman aşımı. Ayrıntı yalnızca sunucu günlüğüne yazılır; günlükte mesaj içeriği bulunmaz
  - Sohbet sınırları kendi sayaçlarıdır (`ownRateLimit`): IP başına dakikada 20 istek, dakikada 6 ve saatte 60 mesaj. Sayaç bellek içidir ve instance başınadır
  - n8n tarafı, RAG hedefi (canlı RAG `mYsRTCYniOggXfSJ`, sürüm `7126796b`, 21.11.2026'dan beri; geçiş kaydı `docs/hafta6/uretim-hazirlik.md` bölüm 6): Chat Trigger Basic Auth ile korunur; konuşmalar Redis Chat Memory'de (`<sessionId>__Redis_Chat_Memory`, 30 gün kayan TTL) ve n8n çalışma kayıtlarında tutulur; ürün dokümanları Qdrant `atolyekart_product_knowledge` koleksiyonundan "Product Documents" aracıyla gelir (`topK` 6). Model `gpt-4.1-mini`, temperature varsayılan. Node adı "Redis Chat Memory" değiştirilmez (anahtar adını belirler)
  - n8n tarafı, final hedefi (final asistan workflow'u): Webhook Basic Auth ile korunur. AI Agent ürün dokümanları için aynı Qdrant koleksiyonunu ("Product Documents"), sigorta şartları ve prim hesabı için iki alt workflow'u araç olarak kullanır. Redis hafıza anahtarı `atolyekart-final:<sessionId>`, TTL 7 gün (workflow ayarı). Mesajlar n8n çalışma kayıtlarında da tutulur; bu kayıtların saklanması n8n ayarlarına bağlıdır ve Redis TTL'inden ayrıdır. Workflow'un hata workflow'u final hata yakalayıcıdır
  - Bilinen sınırlama: model bazen dokümandaki öneri/olasılık ifadesini cevabın sonuna eklediği bir hükümle kesinleştirir (ör. "artırabilir" → "kaçınılmalıdır"; 14 soruluk testte T14). Ek AI ya da kod kontrolü bilinçli olarak eklenmedi; ayrıntı `docs/hafta6/uretim-hazirlik.md`
  - Testler `chat/chatClient.test.js`, `server/chat.test.js`
- **Luna sepeti ve sipariş talebi:** yalnızca yeni Luna tasarımında (`src/features/luna-atelier-preview/`). Sepet `LunaPreviewApp` belleğindedir (tarayıcıda saklanmaz), boş başlar ve yalnızca `src/products.js`'teki gerçek ürünleri kabul eder; konsept ürünler sepete giremez
  - `checkout/cart.js` (`addLine`): aynı ürün yeniden eklenince adet artar, en fazla `MAX_QTY` (12). Her eklemede `components/CartToast.jsx` sabit konumlu "Ürün sepetinize eklendi." bildirimini 2,5 sn gösterir (`role="status"`); art arda eklemede süre baştan başlar, bildirimler birikmez
  - `pages/CartCheckoutPage.jsx` + `checkout/submitOrder.js`: iletişim alanları ad, telefon, e-posta (isteğe bağlı) ve açık rızadır; doğrulama `src/webhook/validation.js` ile aynıdır. Gönder düğmesinin yanındaki özet eksik alanı adıyla yazar (`contactErrorSummary`: tek hatada alan adı ve kendi mesajı, birden fazlada alan adları form sırasıyla); ilk hatalı alana odaklanılır
  - Her sepet satırı ayrı bir `POST /api/order` isteğidir. Başarılı satırlar "iletildi" listesine geçer ve yeniden gönderilmez; başarısızlar mesajıyla sepette kalır. Sepet ve form yalnızca tüm satırlar başarılı olunca temizlenir ve onay ekranına (`#/siparis-alindi`) geçilir; onay ekranı ürün listesi ya da tutar tutmaz, oradan ayrılıp geri dönülünce boş durum görünür
  - Ortam (`checkout/orderMode.js`): Vercel Production `live`; mock adapter ya da yerel geliştirme `test` (gönderim yapılır ama sonuç gerçek sipariş gibi sunulmaz); Preview ve ortamı anlaşılamayan adres gönderim kapalı
  - Testler `checkout/cart.test.js`, `checkout/submitOrder.test.js`, `checkout/orderMode.test.js`
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
- **Sırlar yalnızca sunucudadır:** `WEBHOOK_URL`, `WEBHOOK_SECRET`, `JWT_SECRET` ve sohbet proxy'sinin `N8N_CHAT_URL`, `N8N_CHAT_USER`, `N8N_CHAT_PASSWORD` ile `N8N_FINAL_URL`, `N8N_FINAL_USER`, `N8N_FINAL_PASSWORD` değişkenleri (seçili hedefinkiler eksik ya da geçersizse `/api/chat` 503 döner). `N8N_CHAT_BACKEND` sır değildir, ama o da yalnızca sunucuda tanımlanır. Hiçbirine `VITE_` öneki verilmez; koda, depoya, terminal çıktısına ya da rapora yazılmaz. Canlı değerleri kullanıcı Vercel panelinden girer; Claude üretmez ve eklemez. Yerelde `.env.local`.
  - Yerelde `WEBHOOK_URL` boşsa olay sunucu günlüğüne `[webhook:mock]` ile yazılır. Canlıda adres ya da anahtar eksikse talep `502` ile reddedilir.
  - `VITE_API_URL` gizli değildir: boşsa aynı alan adı, `mock:` ağ isteği yapmaz, `mock:fail` hatayı dener.
- **Rate limit:** formlar ve admin uç noktası için IP başına dakikada 10 istek, ortak sayaç (`/api/chat` kendi sayaçlarını kullanır, yukarıya bakın); aşılırsa `429` ve `Retry-After`. Sayaç bellek içidir ve Vercel'de instance başınadır (`server/lib/rate-limit.js` içindeki nota bakın). Redis/Upstash eklenmedi.
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
- `.env.example` — ortam değişkenlerinin adları ve biçimi (`VITE_CATALOG_URL`, `VITE_API_URL`, `WEBHOOK_URL`, `WEBHOOK_SECRET`, `JWT_SECRET`, `N8N_CHAT_URL`, `N8N_CHAT_USER`, `N8N_CHAT_PASSWORD`, `N8N_CHAT_BACKEND`, `N8N_FINAL_URL`, `N8N_FINAL_USER`, `N8N_FINAL_PASSWORD`); gerçek değerler `.env.local` ve Vercel'de tutulur, depoya girmez
- `.impeccable/config.json` — tasarım dedektörünün yok sayma kayıtları
- `docs/final/` — final ödevi (n8n + Claude; son teslim 3.12.2026, ≤ 5 dk video: Demo → Mimari → Kararlar, geliştirme süreci de anlatılır). Final projesi AtölyeKart'tır: final asistan workflow'u AtölyeKart sitesindeki sohbete bağlanır (X2; ayrıntılı belge `docs/x2/x2-site-sohbeti.md`). Kapsam ve plan: `kapsam-ve-plan.md`; aşama sonuçları: `asama-*-plan.md`. Ödev metni (`Final_Gorevi_BizCard.pdf`) yalnızca yerel kopyadadır, depoya girmez
  - Zorunlu parçalar: Webhook, AI adımı, RAG, Hafıza, Hata ağı (hata yakalama, bildirim, yeniden deneme). Serbest bölge: sektöre özel bir özellik
  - BizCard: ödev metni ayrıca BizCard dijital kartvizitinden söz eder. Botun BizCard'a bağlanması PDF'in parça tablosunda "Önerilen ek"tir (zorunlu değil); puanlamanın 4. sorusu ("BizCard işlevi ve tasarımı") ve teslim kontrol listesi ("Botun BizCard bağlantısı", "BizCard tasarımı ve işlevi") BizCard'ı ayrı maddeler olarak sayar. Bu projede BizCard entegrasyonu isteğe bağlıdır ve backlog'dadır (26.11.2026 kararı: final değerlendirmesi AtölyeKart üzerinden)

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
10. Sırları (`WEBHOOK_URL`, `WEBHOOK_SECRET`, `JWT_SECRET`, `N8N_CHAT_*`, `N8N_FINAL_*`, tokenlar) koda, depoya, terminal çıktısına ya da rapora yazma; `VITE_` önekiyle tarayıcıya açma. Canlı sır değerlerini üretme ya da Vercel'e ekleme; eksikse dur ve bildir.
11. Ürün veya hero fotoğrafı yerine yapay placeholder, SVG veya ikon koyma.
12. Bileşen, stil, görsel, form/API ya da webhook üzerinde çalışırken `atolyekart-standartlari` Skill'ini kullan.
13. Ziyaretçi formlarını (`/api/order`, `/api/stock-request`) JWT ile koruma. Açıkça istenmeden `git push` yapma.
