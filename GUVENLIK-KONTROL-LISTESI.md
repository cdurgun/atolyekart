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
- [x] Vercel Environment Variables (Production) tanımlı: `WEBHOOK_URL`, `WEBHOOK_SECRET`, `JWT_SECRET` — değerleri proje sahibi Vercel panelinden girdi; `vercel env ls production` üç adı "Secret / Hidden" olarak listeliyor
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

6 Ekim 2026, https://atolyekart-tawny.vercel.app üzerinde `curl` ile, tek rate limit penceresinde 11 istek:

- [x] Geçerli sipariş → `200`
- [x] Geçerli stok bildirimi → `200`
- [x] Geçersiz e-posta → `400` (`errors.email`)
- [x] Eksik rıza → `400` (`errors.consent`)
- [x] Geçersiz adet (0) → `400` (`errors.quantity`)
- [x] Stokta olmayan ürüne sipariş → `409 out_of_stock`
- [x] Stokta olan ürüne stok bildirimi → `409 in_stock`
- [x] `GET /api/order` → `405`, `Allow: POST`
- [x] 11. istek → `429` + `Retry-After: 56`
- [x] Token'sız admin isteği → `401` + `WWW-Authenticate: Bearer`
- [x] Geçersiz token → `401`
- [x] Canlı pakette sır yok — canlı JS paketinde `webhook.site`, `WEBHOOK`, `JWT_SECRET` araması 0 eşleşme
- [x] Webhook alıcısına olay ulaştı — webhook.site'ta `order.requested` ve `stock_alert.requested` kayıtları; gövde sözleşmeyle aynı, `X-Atolyekart-Event` ve `X-Atolyekart-Signature: sha256=<64 hex>` başlıkları var
- [x] `productName` sunucudan — istekte gönderilen sahte `productName` yok sayıldı, webhook'a katalogdaki ad gitti
- [x] Tarayıcıdan uçtan uca — canlı sayfadaki formda rızasız gönderim engellendi, rıza ile sipariş başarı mesajı verdi
- [x] Yanlış rollü token → `403`, geçerli admin token → `200` — proje sahibi canlı `JWT_SECRET` ile imzalanmış tokenlarla canlıda denedi (6 Ekim 2026); anahtar ve tokenlar paylaşılmadı
- [ ] İmza değerinin alıcıda hesaplanarak doğrulanması — n8n aşamasına bağlı: webhook.site imza doğrulamaz. Başlığın varlığı ve biçimi canlıda doğrulandı, üretim mantığı `npm test` içinde sınanıyor

## Mobil (Expo Go)

- [x] Gerçek telefonda "Sipariş Ver" — proje sahibi uygulamayı Expo Go ile telefonda açtı ve bir sipariş gönderdi; işlem başarılı oldu (6 Ekim 2026)
- [x] Gerçek telefonda "Stok Bildirimi İste" — proje sahibi Terra Minimal Kolye için stok bildirimi gönderdi; işlem başarılı oldu. webhook.site'ta `stock_alert.requested` olayının ulaştığını, gövdenin doğru olduğunu ve `X-Atolyekart-Signature` başlığının geldiğini doğruladı (6 Ekim 2026)
- [x] Bilgisayarda — Metro çalışıyor ve Expo Go manifest'ini sunuyor, iOS ve Android paketleri derleniyor, `expo-doctor` 21/21

## Bilinen sınırlar

- Rate limit ve son siparişler listesi instance belleğindedir; paylaşımlı ve kalıcı değildir.
- API CORS başlığı göndermez; yalnızca aynı alan adındaki web sayfası ve yerel mobil uygulama çağırabilir.
- Webhook alıcısı (webhook.site) imzayı doğrulamaz; n8n'e geçildiğinde alıcıda `X-Atolyekart-Signature` doğrulanmalıdır.
- Formlarda bot koruması (CAPTCHA vb.) yoktur; kötüye kullanıma karşı tek engel rate limit'tir.
