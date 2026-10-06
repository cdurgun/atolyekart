# AtölyeKart — Luna Atelier

Luna Atelier için tek sayfalık bir atölye vitrini: el yapımı seramik, doğal mum ve aksesuar. Ziyaretçi sipariş ya da stok bildirimi talebi bırakır; talepler güvenli bir API üzerinden atölyenin webhook'una iletilir.

| Parça | Nerede | Ne yapar |
| --- | --- | --- |
| Web | `src/`, `index.html`, `gizlilik.html` | React + Vite vitrin, iki form, gizlilik politikası |
| API | `api/`, `server/` | Doğrulama, stok kontrolü, rate limit, imzalı webhook, admin uç noktası |
| Mobil | `mobile/` | Expo uygulaması; aynı API'yi kullanır |

Canlı adres: https://atolyekart-tawny.vercel.app

## Yerel geliştirme

Node.js 22 ya da üstü gerekir.

```sh
npm install
cp .env.example .env.local   # sonra değerleri .env.local içinde doldurun
npm run dev                  # http://localhost:5173 — sayfa ve /api birlikte
npm test                     # doğrulama ve API testleri (node:test)
npm run build                # üretim derlemesi (dist/)
```

`npm run dev`, `/api` isteklerini Vercel'de çalışan kodun aynısına verir; `vercel dev` gerekmez. `.env.local` içinde `WEBHOOK_URL` boşsa webhook'a istek atılmaz, olay terminale `[webhook:mock]` ile yazılır.

## Ortam değişkenleri

Adlar ve biçim `.env.example` içindedir. Gerçek değerler yerelde `.env.local` (depoya girmez), canlıda Vercel Environment Variables içinde durur.

| Değişken | Nerede okunur | Gizli mi | Açıklama |
| --- | --- | --- | --- |
| `WEBHOOK_URL` | sunucu | evet | Taleplerin iletildiği adres (webhook.site ya da n8n). Canlıda zorunlu |
| `WEBHOOK_SECRET` | sunucu | evet | Webhook imzası için HMAC anahtarı. Canlıda zorunlu |
| `JWT_SECRET` | sunucu | evet | Admin JWT imza anahtarı, en az 32 karakter |
| `VITE_API_URL` | tarayıcı | hayır | API kök adresi. Boşsa aynı alan adı; `mock:` ağ isteği yapmaz |
| `VITE_CATALOG_URL` | tarayıcı | hayır | QR kodun adresi. Boşsa sayfanın kendi adresi |

`VITE_` önekli her değişken tarayıcı paketine girer ve herkes okuyabilir; sırlara bu önek verilmez. Anahtar üretmek için: `openssl rand -hex 32`. Yerel ve canlı için ayrı anahtar kullanın.

## Vercel'e deploy

Proje Vercel'e bağlıdır (`vercel link` yapılmış). Ayarlar `vercel.json` içindedir: Vite derlemesi `dist/` klasörüne çıkar, tüm `/api/*` istekleri tek fonksiyona (`api/index.js`) yönlenir.

1. Vercel → Project → Settings → Environment Variables altında **Production** için `WEBHOOK_URL`, `WEBHOOK_SECRET` ve `JWT_SECRET` değerlerini girin (panelden; değerler terminale ya da depoya yazılmaz).
2. Tanımlı olduklarını kontrol edin (yalnızca adları listeler):
   ```sh
   vercel env ls production
   ```
3. Deploy edin:
   ```sh
   vercel deploy --prod
   ```

Ortam değişkeni değişikliği yalnızca yeni deploy'da geçerli olur. Canlıda `WEBHOOK_URL` ya da `WEBHOOK_SECRET` eksikse formlar `502`, `JWT_SECRET` eksikse admin uç noktası `503` döner.

## API

Tüm yanıtlar JSON'dır. Başarı: `{ "ok": true }`. Hata: `{ "ok": false, "error": "<kod>", "message": "<Türkçe metin>" }`; doğrulama hatasında ayrıca `errors: { "<alan>": "<metin>" }`. Yanıtlarda teknik ayrıntı ya da stack trace bulunmaz.

| Uç nokta | Yöntem | Yetki | Gövde |
| --- | --- | --- | --- |
| `/api/order` | `POST` | yok (herkese açık) | `name`, `productId`, `quantity`, `phone`, `email` (isteğe bağlı), `consent`, `source` |
| `/api/stock-request` | `POST` | yok (herkese açık) | `name`, `productId`, `email`, `consent`, `source` |
| `/api/admin/orders` | `GET` | Bearer JWT, `role: "admin"` | — |

| Durum | Anlamı |
| --- | --- |
| `200` | Kabul edildi ve webhook'a iletildi |
| `400` | Doğrulama hatası, eksik açık rıza (`consent` tam olarak `true` olmalı) ya da bozuk gövde |
| `401` / `403` | Admin: token yok, geçersiz ya da süresi dolmuş / rol admin değil |
| `405` | İzin verilmeyen yöntem |
| `409` | Stok kuralı: stokta olmayana sipariş (`out_of_stock`), stokta olana stok bildirimi (`in_stock`) |
| `429` | Rate limit; `Retry-After` başlığı kaç saniye bekleneceğini söyler |
| `502` | Webhook'a iletilemedi |

Sunucu istemciye güvenmez: tüm alanları yeniden doğrular, ürün adını ve stok durumunu kendi kataloğundan alır (`server/lib/catalog.js`); istemcinin gönderdiği `productName` yok sayılır. Şu an Terra Minimal Kolye stokta yok, diğer iki ürün stokta.

Örnek:

```sh
curl -i -X POST http://localhost:5173/api/order \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ayşe Yılmaz","productId":"luna-seramik-kupa","quantity":2,"phone":"0532 123 45 67","consent":true,"source":"react"}'
```

Webhook'a giden olayın biçimi ve imzası: `.claude/skills/atolyekart-standartlari/webhook-format.md`.

### Admin uç noktası ve JWT

JWT yalnızca `/api/admin/orders` içindir; ziyaretçi formları token istemez. Uç nokta HS256 ile imzalanmış, `role: "admin"` ve geçerli `exp` taşıyan bir token bekler.

```sh
# Yerel sunucu için: .env.local içindeki JWT_SECRET ile 15 dakikalık token
TOKEN=$(node --env-file=.env.local scripts/admin-token.mjs)
curl -H "Authorization: Bearer $TOKEN" http://localhost:5173/api/admin/orders
```

Canlı sunucu canlı `JWT_SECRET` ile imzalanmış token ister: `JWT_SECRET=… node scripts/admin-token.mjs` (değeri kabuk geçmişine yazmamak için komutun başına bir boşluk koyun ya da `read -s JWT_SECRET` kullanın). İkinci argüman rolü değiştirir (`… admin-token.mjs 15 user` → `403` denemesi). Token'ı paylaşmayın, depoya yazmayın.

Uç nokta, o fonksiyon instance'ının belleğindeki son siparişleri (en fazla 50) döner; veritabanı yoktur, instance yeniden başlayınca liste boşalır.

### Rate limiting

IP başına dakikada 10 istek; sayaç tüm `/api` yolları için ortaktır. Aşılırsa `429` ve `Retry-After` döner.

Sayaç bellek içidir. Vercel'de her fonksiyon instance'ının belleği ayrıdır ve cold start'ta sıfırlanır; yani sınır instance başınadır. Ödev kapsamı için yeterlidir. Kesin ve paylaşımlı bir sınır için sayaç ortak bir depoya (ör. Upstash Redis) ya da Vercel Firewall rate limit kuralına taşınmalıdır (`server/lib/rate-limit.js`).

## KVKK

İki formda da açık rıza kutusu vardır; işaretlenmeden form gönderilmez ve sunucu da reddeder. `/gizlilik.html` hangi verilerin neden toplandığını, saklama sürelerini, hakları ve iletişimi anlatan **örnek bir taslaktır**: hukuki danışmanlık değildir, şirket bilgileri köşeli parantezli yer tutucudur.

Güvenlik maddelerinin tamamı: `GUVENLIK-KONTROL-LISTESI.md`.

## Mobil uygulama (Expo)

`mobile/` ayrı bir Expo projesidir (kendi `package.json`'ı vardır; web projesine bağımlılık eklemez). Ürün verisini (`src/products.js`), doğrulamayı (`src/webhook/validation.js`) ve istek gövdesini (`src/webhook/payload.js`) web ile paylaşır; talepleri aynı `/api` uç noktalarına gönderir. Uygulamada sır yoktur.

```sh
cd mobile
npm install
npx expo start
```

### Expo Go ile telefonda açma

1. Telefona **Expo Go** uygulamasını kurun (App Store / Google Play). Uygulama Expo SDK 57 kullanır; Expo Go güncel olmalı.
2. Telefon ve bilgisayar aynı Wi-Fi ağında olsun.
3. `npx expo start` terminalde bir QR kod gösterir. iOS'ta Kamera uygulamasıyla, Android'de Expo Go içindeki "Scan QR code" ile okutun.
4. Aynı ağda bağlanamıyorsanız: `npx expo start --tunnel`.

Uygulama varsayılan olarak canlı API'yi kullanır (`https://atolyekart-tawny.vercel.app`). Yerel API'yi denemek için kök klasörde `npm run dev -- --host` çalıştırın ve `mobile/.env.local` içine bilgisayarın ağ adresini yazın:

```sh
EXPO_PUBLIC_API_URL=http://192.168.1.20:5173
```

`EXPO_PUBLIC_` önekli değişkenler uygulama paketine girer; sır yazılmaz. Ürün fotoğrafları da bu adresten yüklenir.

## Yapı

```
src/            React uygulaması, ürün verisi, doğrulama ve API adapter'ı
api/            Vercel Function girişi (tek fonksiyon)
server/         yönlendirici, rotalar, doğrulama, rate limit, JWT, webhook, testler
scripts/        admin-token.mjs (yerel JWT üretici)
mobile/         Expo uygulaması
public/         ürün ve hero fotoğrafları, fontlar (SIL OFL 1.1)
DESIGN.md       tasarım sistemi
CLAUDE.md       proje kapsamı ve kuralları
GUVENLIK-KONTROL-LISTESI.md
```

## Lisans notları

- Fontlar: Brygada 1918 ve Hanken Grotesk, SIL Open Font License 1.1 (`public/fonts/OFL-*.txt`).
- QR kod: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator), MIT.
