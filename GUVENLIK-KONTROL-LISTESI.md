# Güvenlik Kontrol Listesi — AtölyeKart Hafta 2

Her maddenin yanında nerede uygulandığı ve nasıl doğrulandığı yazar. `[x]` yapıldı ve doğrulandı, `[ ]` bekliyor demektir. Otomatik doğrulama: `npm test` (`server/api.test.js`).

## Secret yönetimi

- [x] `.env` dosyaları gitignore'da — `.gitignore`: `.env`, `.env.*`, istisna yalnızca `.env.example`
- [x] `.env.example` mevcut ve yalnızca değişken adlarını taşır, değer taşımaz
- [x] Webhook adresi ve gizli anahtar tarayıcı paketinde yok — `WEBHOOK_URL`, `WEBHOOK_SECRET`, `JWT_SECRET` yalnızca sunucuda okunur (`server/lib/webhook.js`, `server/routes/admin-orders.js`). Doğrulama: `npm run build` sonrası `grep -c "webhook\.site\|WEBHOOK\|JWT_SECRET" dist/assets/*.js` → 0
- [x] `VITE_` önekli hiçbir değişken sır taşımıyor — kalanlar `VITE_CATALOG_URL` ve `VITE_API_URL` (ikisi de herkese açık adres). Eski `VITE_WEBHOOK_URL` kaldırıldı
- [x] Webhook gizli anahtarı istemciye gönderilmiyor — imza sunucuda üretilir (`X-Atolyekart-Signature`, HMAC-SHA256)
- [x] Git geçmişinde sır yok — tüm geçmiş (`git log --all -p`) webhook adresi, anahtar ve token kalıpları için tarandı; eşleşme yok. Geçmişe giren tek `.env*` dosyası `.env.example`
- [x] Yerel ve canlı sırlar ayrı — yerel değerler `.env.local` içinde, canlı değerler yalnızca Vercel'de; iki ortam için ayrı anahtar kullanılır
- [ ] Vercel Environment Variables (Production) tanımlı: `WEBHOOK_URL`, `WEBHOOK_SECRET`, `JWT_SECRET` — değerleri proje sahibi Vercel panelinden girer
- [x] Canlıda eksik yapılandırma sessizce geçilmez — `WEBHOOK_URL` ya da `WEBHOOK_SECRET` yoksa talep `502`, `JWT_SECRET` yoksa ya da 32 karakterden kısaysa admin uç noktası `503` döner

## API ve sunucu tarafı doğrulama

- [x] Formlar webhook'a doğrudan gitmez; `/api/order` ve `/api/stock-request` arkasından çalışır
- [x] Yalnızca gerekli yöntemler — form uç noktaları yalnızca `POST`, admin yalnızca `GET`; diğerleri `405` ve `Allow` başlığı
- [x] Sunucu tarafı doğrulama — `name` (2–80 karakter), `email` (ASCII, biçim), `phone` (TR cep), `quantity` (1–99 tam sayı), `productId` (katalogda olmalı), `source`; tür denetimi dahil (`server/lib/validate.js`)
- [x] `consent` sunucuda zorunlu — yalnızca boolean `true` kabul edilir (`"true"` metni reddedilir)
- [x] `productName` istemciden alınmaz — yalnızca `productId` okunur, ad `server/lib/catalog.js`'ten yazılır; istemcinin gönderdiği `productName` ve `event` yok sayılır
- [x] Stok sunucuda denetlenir — stokta olmayana sipariş `409 out_of_stock`, stokta olana stok bildirimi `409 in_stock`
- [x] Gövde sınırı — 10 KB üstü ve JSON nesnesi olmayan gövde `400`
- [x] Teknik hata bilgisi sızmaz — yanıtlar sabit Türkçe mesaj taşır; hata ayrıntısı ve stack trace yalnızca sunucu günlüğüne yazılır (`server/router.js`). Webhook adresi ve bağlantı hatası metni yanıta girmez
- [x] Yanıtlar `Cache-Control: no-store` ile döner

## Rate limiting

- [x] IP başına dakikada 10 istek — `server/lib/rate-limit.js`; tüm `/api` yolları için ortak sayaç
- [x] Aşımda `429` ve `Retry-After` (saniye)
- [x] Sınırlama belgeli — sayaç bellek içidir; Vercel'de instance başınadır ve cold start'ta sıfırlanır. Kod içinde yorumla açıklandı; ödev kapsamında Redis/Upstash eklenmedi

## JWT

- [x] Ziyaretçi formları JWT istemez — `/api/order` ve `/api/stock-request` herkese açıktır
- [x] Admin uç noktası korumalı — `GET /api/admin/orders`, `Authorization: Bearer <JWT>`
- [x] İmza doğrulaması — yalnızca HS256, sabit zamanlı karşılaştırma; `alg: none` ve değiştirilmiş gövde reddedilir (`server/lib/jwt.js`)
- [x] Süre denetimi — `exp` zorunlu; süresi dolmuş ya da `exp`'siz token `401`
- [x] Rol denetimi — `role: "admin"` değilse `403`
- [x] Durum kodları — token yok / bozuk / yanlış imza / süresi dolmuş: `401` + `WWW-Authenticate: Bearer`; yetkisiz rol: `403`
- [x] Token ve anahtar depoda yok — `scripts/admin-token.mjs` anahtarı ortamdan okur, token'ı yalnızca ekrana yazar

## KVKK

- [x] Açık rıza kutusu — "Sipariş Ver" ve "Stok Bildirimi İste" formlarında; varsayılan olarak işaretsiz
- [x] İstemci tarafı — kutu işaretlenmeden form gönderilmez, alan altında hata gösterilir
- [x] Sunucu tarafı — `consent: true` yoksa `400`
- [x] Gizlilik Politikası — `/gizlilik.html`: toplanan veriler, amaç, paylaşım, saklama süresi, haklar, iletişim. Örnek taslaktır; hukuki danışmanlık değildir, şirket bilgileri yer tutucudur
- [x] Veri azaltma — webhook'a yalnızca formdaki alanlar gider; IP adresi gönderilmez ve kalıcı kaydedilmez

## Canlı ortam testleri

Sonuçlar deploy sonrasında işlenir.

- [ ] Geçerli sipariş → `200`
- [ ] Geçerli stok bildirimi → `200`
- [ ] Geçersiz e-posta → `400`
- [ ] Eksik rıza → `400`
- [ ] Geçersiz adet → `400`
- [ ] Stokta olmayan ürüne sipariş → `409`
- [ ] Stokta olan ürüne stok bildirimi → `409`
- [ ] 11. istek → `429` + `Retry-After`
- [ ] Token'sız admin isteği → `401`
- [ ] Geçersiz token → `401`
- [ ] Canlı pakette sır yok
- [ ] Webhook alıcısına olay ve imza ulaştı

## Bilinen sınırlar

- Rate limit ve son siparişler listesi instance belleğindedir; paylaşımlı ve kalıcı değildir.
- API CORS başlığı göndermez; yalnızca aynı alan adındaki web sayfası ve yerel mobil uygulama çağırabilir.
- Webhook alıcısı (webhook.site) imzayı doğrulamaz; n8n'e geçildiğinde alıcıda `X-Atolyekart-Signature` doğrulanmalıdır.
- Formlarda bot koruması (CAPTCHA vb.) yoktur; kötüye kullanıma karşı tek engel rate limit'tir.
