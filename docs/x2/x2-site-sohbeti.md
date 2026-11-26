# X2: Site sohbetinin final asistana bağlanması

> Durum (26.11.2026): Kod ve yerel L1 testi tamamlandı. Yerel commit `b44259e`, dal `ozellik/x2-final-asistan-sohbet` (`main` `631ee35` tabanlı); push edilmedi. **P1 ve P2 yapılmadı; ikisi de ayrı onay bekliyor.** Production'da sohbet hâlâ canlı RAG'e gidiyor.

## 1. Amaç ve kapsam

- **Amaç:** AtölyeKart sitesindeki sohbeti (`/api/chat`) final asistan workflow'una bağlamak. Kursun açıklamasına göre final değerlendirmesi AtölyeKart üzerinden yapılıyor: webhook, RAG ve hata akışı projede yer almalı.
- **Kapsam dışı:** BizCard entegrasyonu (backlog; zorunlu kabul edilmedi) ve mobil uygulama.
- **Geri dönüş seçeneği (X1):** Kod değişikliği olmadan parçalar ayrı ayrı gösterilir (bölüm 8).

## 2. Sözleşme

| Konu | Önceki hedef (canlı RAG) | Final hedefi |
| --- | --- | --- |
| Tarayıcı → `/api/chat` | `{ action, sessionId, chatInput }` | Değişmedi |
| Proxy → n8n (mesaj) | `{ action: 'sendMessage', sessionId, chatInput }` | `{ sessionId, chatInput }`; `action` gönderilmez |
| n8n → proxy (başarılı) | `{ output }` | `{ ok: true, output }`; proxy `{ output }` döner |
| n8n hata yanıtı | 401/403/404/500 → 502 | 400 ve 503 → 502; n8n'in `reason` ve `mesaj` alanları tarayıcıya gitmez |
| Geçmiş (`loadPreviousSession`) | n8n'den yüklenir | Final asistanda karşılığı yok; proxy n8n'e gitmeden `{ data: [] }` döner |
| `sessionId` | `localStorage` UUID'si | Aynı kimlik; iki kalıba da uyar |
| Redis hafıza anahtarı | `<sessionId>__Redis_Chat_Memory`, TTL 30 gün | `atolyekart-final:<sessionId>`, TTL 7 gün (workflow ayarı) |

Eski RAG konuşmaları final hedefine taşınmaz. Final hedefinde sayfa yenilendiğinde pencere yalnızca karşılamayla açılır; model konuşma bağlamını n8n hafızasından sürdürür.

## 3. Hedef seçimi (`server/routes/chat.js`)

- `N8N_CHAT_BACKEND` tanımsızsa ya da tam olarak `final` (küçük harf; baştaki ve sondaki boşluk kırpılır) dışında bir değerdeyse `N8N_CHAT_*` ile canlı RAG kullanılır. Önceki davranış aynen korunur; `FINAL` ve `Final` da RAG seçer.
- `N8N_CHAT_BACKEND=final` ise `N8N_FINAL_URL`, `N8N_FINAL_USER` ve `N8N_FINAL_PASSWORD` kullanılır.
- Final değişkenleri eksik ya da geçersizse 503 döner. RAG'e sessiz geri dönüş yapılmaz. Adres kuralı RAG ile aynıdır: `https` (yalnızca `localhost` / `127.0.0.1` için `http`).
- Origin kontrolü, 415/400 doğrulaması ve rate limit sırası değişmedi; bunlar hedef seçiminden önce çalışır.
- Yerelde `vite.config.js` dört değişkeni `.env.local`'dan `/api` sürecine aktarır. Production'da `/api` değerleri doğrudan Vercel ortamından okur.
- Değişken adları ve biçimi: `.env.example`. Değerler yalnızca `.env.local`'da ve Vercel'de tutulur.

## 4. Metinler

- **Karşılama:** "Merhaba! Ben AtölyeKart'ın dijital asistanıyım. Ürünlerimiz hakkında size yardımcı olabilirim." Stok vaadi çıkarıldı; final asistanda stok aracı yok.
- **Yeni sohbet bildirimi:** "Yeni sohbet başladı. Önceki konuşma bu cihazdaki sohbet görünümünden kaldırıldı. Sunucuda işlenmiş kayıtlar ayrıca tutulabilir."
- **Saklama:** Redis hafızasının TTL'i ile n8n çalışma kayıtlarının saklanması ayrı konulardır. Çalışma kayıtlarının saklanması n8n ayarlarına bağlıdır ve Redis TTL'iyle silinmez. Metinler ve kod yorumları saklama süresi ya da otomatik silinme iddiası içermez; test bu iddiaları yasaklar (`chatClient.test.js`).

## 5. Birim testleri

- `npm test`: **102/102** (commit'ten hemen önce).
- `server/chat.test.js`'e final modu için 7 test eklendi:
  - değişken seçimi;
  - gövdenin tam olarak `{ sessionId, chatInput }` olması;
  - eksik ya da geçersiz değişkende 503 ve RAG'e dönüş olmaması;
  - geçmiş isteğinin n8n'e gitmemesi;
  - `FINAL` / `Final` / tanımsız değerlerde RAG davranışı;
  - 200, 400 ve 503 eşlemesi;
  - sır sızıntısı.
- Upstream çağrıları `fetch` taklidiyle yakalanır; gerçek n8n'e istek gitmez. Testler `N8N_*` değişkenlerini her testten sonra geri yükler.
- Bu testler proxy sözleşmesini doğrular, gerçek workflow'u değil.

## 6. L1: yerel entegrasyon testi (26.11.2026)

**Yol:** tarayıcı (`npm run dev`, `127.0.0.1:5173`) → yerel `/api/chat` → yerel n8n'deki final asistan (`127.0.0.1:5678`, `/webhook/`, Basic Auth). Tünel ve production kullanılmadı.

**Ön kontrol:** Ağ isteği yapmadan `loadEnv` ile yalnızca üç evet/hayır sonucu okundu: hedef `final`, yapılandırma geçerli, adres yerel. İlk denemede adres `https://127.0.0.1…` yazılmıştı. Yerel n8n `http` ile çalıştığı için bu bağlantı TLS'te başarısız olurdu; kullanıcı `http` olarak düzeltti ve sunucu yeniden başlatıldı.

Mesajları kullanıcı tarayıcıdan gönderdi. Çalışma kayıtları yalnızca meta veri düzeyinde (durum, mod, zaman) okundu; düğüm verisi okunmadı.

| Adım | Sonuç | Kanıt |
| --- | --- | --- |
| Pencereyi açma | ✅ Yalnızca yeni karşılama metni | Final asistanda ilk çalışma ilk mesajın çalışması; açılışta istek gitmedi |
| Ürün bakımı (RAG) | ✅ Bakım bilgisi ve "Kaynak: soy-candle-care-guide, sürüm 1.2" satırı; demo uyarısı yok | #526 `webhook` `success` |
| Teklif | ✅ Bedel 840,00 TL, prim 33,60 TL, vergiler hariç; demo uyarısı bir kez | #527 `webhook` `success`; Prim Hesapla alt workflow'u #528 `integrated` `success` |
| Hafıza | ✅ "2 adet Luna Seramik Kupa"; araç çağrılmadı | #529 `webhook` `success`; yeni prim çalışması yok |
| Kullanıcının ek mesajları | ✅ Dördü de başarılı | #530–#533 `webhook` `success` |
| Sayfa yenileme | ✅ Yalnızca karşılama | Yeni çalışma yok |
| Yeni sohbet | ✅ Onaylanan bildirim metni göründü | Ağ isteği yok |

- Canlı RAG workflow'u çağrılmadı; son çalışması test öncesindekiyle aynı.
- Hata yakalayıcı tetiklenmedi; Telegram bildirimi gitmedi.
- Sunucu günlüğünde `[chat]` hatası yok.

**Yan etkiler:**
- Final asistanda 8 `webhook` çalışması ve bunların OpenAI çağrıları.
- Redis'te `atolyekart-final:` önekli hafıza anahtarı ya da anahtarları.
- Mesajlar n8n çalışma kayıtlarında duruyor.
- **Sipariş, stok bildirimi ya da poliçe oluşmadı.** Sepet ve formlar kullanılmadı. Not: yerel `.env.local`'daki `WEBHOOK_URL` canlı sipariş workflow'unu gösteriyor; yerelde sepet kullanılırsa gerçek kayıt oluşur.

**Gözlemler (X2 kapsamı dışında, final asistanın yanıt biçimi):**
- Teklif yanıtında tutar satırı cümlenin ortasına yerleşti: "Prim ve detaylar için Demo teklif: … şeklinde bilgi verebilirim." Tutarlar doğru, dil akıcı değil. Düzeltilmesi canlı workflow değişikliği gerektirir; ayrı karar.
- Hafıza yanıtında araç çağrılmadığı hâlde demo uyarısı var. Bu tasarım gereği: mesajda "teklif" geçtiğinde uyarı eklenir.

## 7. Henüz doğrulanmayanlar

- Production'da Vercel → tünel → final asistan yolu.
- Vercel Production değişkenleri: `N8N_CHAT_BACKEND` ve `N8N_FINAL_*` henüz girilmedi.
- Gerçek bir production hatasının hata yakalayıcı üzerinden Telegram bildirimine dönüştüğü uçtan uca.

## 8. Sonraki adımlar (her biri ayrı onay bekliyor)

| Adım | İçerik | Beklenen | Durum |
| --- | --- | --- | --- |
| **P1** | Push, PR, `main`'e merge; production deploy'u tetiklenir. `N8N_CHAT_BACKEND` Vercel'de tanımsız. | Davranış değişmez: sohbet canlı RAG'e gider; tek bir smoke mesajı | Yapılmadı, onay bekliyor |
| Vercel değişkenleri | Kullanıcı Production'a `N8N_FINAL_URL` (tünelin `https` adresi), `N8N_FINAL_USER` ve `N8N_FINAL_PASSWORD` girer. Claude değerleri görmez ve girmez. | — | Yapılmadı |
| **P2** | Kullanıcı `N8N_CHAT_BACKEND=final` tanımlar; redeploy | Production sohbeti final asistana gider; bakım, teklif ve hafıza mesajlarıyla smoke testi; final asistanda `webhook` çalışmaları, hata yakalayıcıda çalışma yok | Yapılmadı, onay bekliyor |

**X1'e geri dönüş:**
1. Vercel Production'da `N8N_CHAT_BACKEND` silinir ve redeploy yapılır. `N8N_CHAT_*` değerleri değişmediği için sır yeniden girilmez.
2. Vercel Instant Rollback kullanılacaksa yalnızca X2'den hemen önceki deploy'a dönülür. 21.11'deki `WEBHOOK_URL` düzeltmesinden önceki bir deploy'a dönmek sipariş akışını bozar (`docs/hafta6/uretim-hazirlik.md` bölüm 6).

**Dikkat:**
- Final hedefi açıkken final asistanda oluşan bir hata, hata yakalayıcı üzerinden gerçek bir Telegram bildirimi üretebilir. Alt workflow hataları bildirim üretmez (bilinen sınırlama).
- Production sohbeti; Mac'in, Docker'ın ve tünelin açık olmasına bağlıdır. Bu, RAG hedefi için de geçerlidir.
