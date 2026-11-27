# X2: Site sohbetinin final asistana bağlanması

> Durum (26.11.2026): **P1 ve P2 tamamlandı. Production sohbeti final asistana gidiyor.** Kod PR #2 ile `main`'e squash merge edildi (`27028a1`). P2'de Vercel Production değişkenleri girildi ve redeploy yapıldı. Smoke testinde senaryo 1–4 ve 6 geçti; senaryo 7'de hafıza ayrımı geçti, "Yeni sohbet" bildirimi production'da doğrudan doğrulanmadı; **senaryo 5 (stok) başarısız** (bölüm 9).
> **Güncelleme (27.11.2026):** stok sorusu hatası ve teklif satırının yerleşimi için final asistan düzeltildi, taslakta test edildi (8/9) ve `8a504da3` sürümü olarak yayınlandı. D9 bilinen hafıza sınırlaması olarak kaldı (bölüm 10).
>
> Hazırlık: commit'ler yeni `main` (`7f729bf`) üzerine cherry-pick ile `ozellik/x2-p1` dalında hazırlandı (kod commit'i `0919822`, ilk dal `ozellik/x2-final-asistan-sohbet`'teki `b44259e` ile aynı içerik). Bu tabanda `npm test` 102/102 ve `npm run build` geçti.

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

## 7. Doğrulananlar ve henüz doğrulanmayanlar

Doğrulandı (26.11.2026, bölüm 9):
- Production'da Vercel → tünel → final asistan yolu (ilk P2 mesajı, çalışma #536).
- Vercel Production değişkenleri: `N8N_FINAL_URL`, `N8N_FINAL_USER`, `N8N_FINAL_PASSWORD` ve `N8N_CHAT_BACKEND=final` kullanıcı tarafından girildi. Claude değerleri görmedi; değişkenlerin etkin olduğu, mesajın final asistana `webhook` modunda ulaşmasıyla anlaşıldı.

Henüz doğrulanmadı:
- Gerçek bir production hatasının hata yakalayıcı üzerinden Telegram bildirimine dönüştüğü uçtan uca.
- Final hedefinin hata yanıtları (503 yapılandırma eksik, 502 n8n hatası) production'da. Bilerek tetiklenmedi; birim testleriyle kapsanıyor (`server/chat.test.js`).
- "Yeni sohbet" bildiriminin production'da ekranda görünmesi (bölüm 9, senaryo 7).
- Yayınlanan `8a504da3` sürümünde production hafıza davranışı (bölüm 10).
- Yanıt kodundaki yer tutucu güvenlik ağının canlıda çalışması (bölüm 10).

## 8. Geçiş adımları (her biri ayrı onayla yapıldı)

| Adım | İçerik | Beklenen | Durum |
| --- | --- | --- | --- |
| **P1** | Push, PR, `main`'e merge; production deploy'u tetiklenir. `N8N_CHAT_BACKEND` Vercel'de tanımsız. | Davranış değişmez: sohbet canlı RAG'e gider; tek bir smoke mesajı | Yapıldı (26.11.2026): PR #2 squash merge → `27028a1`; deploy `dpl_5PVCvfBArVMg6V4Z84SYBfWHrd39` READY; smoke geçti (bölüm 9) |
| Vercel değişkenleri | Kullanıcı Production'a `N8N_FINAL_URL` (tünelin `https` adresi), `N8N_FINAL_USER` ve `N8N_FINAL_PASSWORD` girer. Claude değerleri görmez ve girmez. | — | Yapıldı (26.11.2026, kullanıcı) |
| **P2** | Kullanıcı `N8N_CHAT_BACKEND=final` tanımlar; redeploy | Production sohbeti final asistana gider; bakım, teklif ve hafıza mesajlarıyla smoke testi; final asistanda `webhook` çalışmaları, hata yakalayıcıda çalışma yok | Yapıldı (26.11.2026): redeploy `dpl_nZjzcf8XRPe85vcvpPx6P5fpQmZX`, SHA `27028a1`; smoke sonuçları bölüm 9 |

**X1'e geri dönüş:**
1. Vercel Production'da `N8N_CHAT_BACKEND` silinir ve redeploy yapılır. `N8N_CHAT_*` değerleri değişmediği için sır yeniden girilmez.
2. Vercel Instant Rollback kullanılacaksa P1 deploy'una (`dpl_5PVCvfBArVMg6V4Z84SYBfWHrd39`; aynı kod, `N8N_CHAT_BACKEND` tanımsızken oluşturuldu) ya da X2'den hemen önceki deploy'a dönülür. 21.11'deki `WEBHOOK_URL` düzeltmesinden önceki bir deploy'a dönmek sipariş akışını bozar (`docs/hafta6/uretim-hazirlik.md` bölüm 6).

**Dikkat:**
- Final hedefi açıkken final asistanda oluşan bir hata, hata yakalayıcı üzerinden gerçek bir Telegram bildirimi üretebilir. Hata yakalayıcının açıklamasında "Telegram node'u devre dışı" yazsa da 26.11.2026 itibarıyla Telegram düğümü etkindir. Bunun bilerek yapıldığı doğrulanmadı. Alt workflow hataları bildirim üretmez (bilinen sınırlama).
- Production sohbeti; Mac'in, Docker'ın ve tünelin açık olmasına bağlıdır. Bu, RAG hedefi için de geçerlidir.

## 9. P1 ve P2 sonuçları (26.11.2026)

**Erişim:** Production, Vercel Authentication (kapsam: tüm deploy'lar) arkasındadır. Testler, production alias'ı için oluşturulan tek Shareable Link ile, Vercel'e giriş yapılmamış gizli pencereden yapıldı. Mesajları kullanıcı gönderdi.

**Kanıt yöntemi:** n8n çalışmaları yalnızca meta veri düzeyinde (kimlik, workflow, durum, mod, zaman) okundu; düğüm verisi, prompt ve mesaj içeriği okunmadı. Çalışmalar senaryolarla gönderim sırası ve zamanla eşleştirildi. n8n MCP bağlantısının yerel instance'a gittiği, aynı workflow'un `updatedAt` değerinin konteynerden alınan dışa aktarımla karşılaştırılmasıyla doğrulandı. Yanıtların değerlendirmesi ekran görüntülerine dayanır; HTTP durum kodları ayrıca ölçülmedi.

### P1 (hedef: canlı RAG)

- Deploy `dpl_5PVCvfBArVMg6V4Z84SYBfWHrd39`, SHA `27028a1`, READY; production alias'ları bu deploy'a geçti.
- Ön kontrol: Vercel Production'da `N8N_CHAT_BACKEND` tanımlı değildi (kullanıcı panelden baktı).
- Smoke: yeni karşılama metni göründü; tek mesaj canlı RAG'de #535 `webhook` `success` oldu. Final asistanda ve hata yakalayıcıda çalışma yok.
- Gözlem: canlı RAG'in stok yanıtı sitedeki katalogla uyuşmadı (katalogda olmayan ürün adları ve farklı stok durumu). P2'den sonra production sohbeti RAG'e gitmediği için demoyu etkilemez.

### P2 (hedef: final asistan)

- Deploy `dpl_nZjzcf8XRPe85vcvpPx6P5fpQmZX` (redeploy), SHA `27028a1`, READY; production alias'ları bu deploy'a geçti.

| # | Senaryo | Sonuç | Çalışmalar |
| --- | --- | --- | --- |
| 1 | Pencereyi açma | ✅ Yalnızca yeni karşılama metni | Yok |
| 2 | Bakım (Amber Soya Mum fitili) | ✅ Dokümanda olmayan malzeme bilgisi uydurulmadı; "Kaynak: soy-candle-care-guide, sürüm 1.2"; demo uyarısı yok | #536 `ruOv` `webhook` `success` |
| 3 | Teklif (2 adet Luna Seramik Kupa) | ✅ Bedel 840,00 TL, prim 33,60 TL, vergiler hariç; demo uyarısı bir kez. Tutar satırı cümlenin ortasına yerleşti (bulgu 2) | #537 `ruOv` `webhook` `success`; #538 Prim Hesapla `integrated` `success` |
| 4 | Hafıza | ✅ "2 adet Luna Seramik Kupa"; araç çağrılmadı | #539 `ruOv` `webhook` `success` |
| 5 | Stok (Terra Minimal Kolye) | ❌ Prim Hesapla aracı çağrıldı; kesin stok durumu bildirildi ve istenmeyen bir demo teklifi eklendi (bulgu 1). Soru tekrar sorulmadı | #540 `ruOv` `webhook` `success`; #541 Prim Hesapla `integrated` `success` |
| 6 | Sayfa yenileme ve aynı oturumda hafıza sorusu | ✅ Yenilemeden sonra yalnızca karşılama; hafıza sunucu tarafında sürdü | Yenileme: yok; mesaj: #542 `ruOv` `webhook` `success` |
| 7 | Yeni sohbet ve hafıza sorusu | ✅ Yeni oturumda önceki ürün ve adet bilinmedi. Bildirim metni doğrulanamadı (aşağıda) | Düğme: yok; mesaj: #543 `ruOv` `webhook` `success` |
| 8 | Final uç noktası hatası | Bilerek tetiklenmedi (bölüm 7) | — |

- Canlı RAG'de P1'deki #535'ten sonra, hata yakalayıcıda bu testler boyunca çalışma yok; Telegram bildirimi gitmedi.
- **Senaryo 7, bildirim:** `ChatWidget.jsx`'te "Yeni sohbet" bildirimi düğmeye basılınca gösterilir ve zamanlayıcı olmadan bir sonraki mesaj gönderilince kaldırılır. Ekran görüntüsü mesaj gönderildikten sonra alındığı için bildirimin görünmemesi kodla tutarlıdır; ancak production'da ekranda göründüğü doğrudan doğrulanmadı.
- **Yan etkiler:** final asistanda 6 (#536, #537, #539, #540, #542, #543) ve Prim Hesapla'da 2 (#538, #541) çalışma ile bunların OpenAI çağrıları; Redis'te iki oturum için `atolyekart-final:` önekli hafıza anahtarı; mesajlar n8n çalışma kayıtlarında. Sipariş, stok bildirimi ya da poliçe oluşmadı.

### Açık bulgular

26.11.2026 itibarıyla. Bulgu 1 ve 2'nin 27.11.2026 durumu bölüm 10'da.

1. **Stok sorusu (senaryo 5):** final asistan stok sorusunda Prim Hesapla aracını çağırıyor, kesin stok durumu bildiriyor ve istenmeyen teklif ekliyor. Stok cümlesinin aracın çıktısından geldiği bir çıkarımdır; düğüm verisi okunmadı. Düzeltme canlı workflow değişikliği gerektirir (ayrı karar).
2. **Teklif satırının yerleşimi:** tutar satırı cümlenin ortasına giriyor ("… için Demo teklif: … yazabilirsiniz."). Tutarlar doğru; düzeltme canlı workflow değişikliği gerektirir (ayrı karar).
3. **Hata yakalayıcının açıklaması eskimiş:** açıklama Telegram düğümünü devre dışı olarak anlatıyor, düğüm etkin.
4. **"Yeni sohbet" bildirimi** production'da doğrudan doğrulanmadı (düşük risk; kodla tutarlı).

### Demo kısıtları

- Düzeltme yapılana kadar demoda stok sorusu sorulmaz. (27.11.2026: düzeltme yayınlandı; D1, D2, D5 ve production testlerinde stok hatası görülmedi, bkz. bölüm 10. Her mesaj bir kez denendi. D9'daki hafıza sınırlaması devam ediyor.)
- Erişim tek Shareable Link iledir (Hobby planda aynı anda tek link; yeni link eskisini iptal eder). Değerlendirme bitince link iptal edilir.
- Production sohbeti Mac'in, Docker'ın ve tünelin açık olmasına bağlıdır.
- Final asistanda oluşan gerçek bir hata Telegram bildirimi üretir.

## 10. Stok ve teklif düzeltmesi: test, yayın ve production sonucu (27.11.2026)

### Düzeltme

Yalnızca final asistan workflow'unda (`ruOv`) üç alan değişti. Site kodu değişmedi ve Vercel redeploy gerekmedi.

- **AI Agent sistem mesajı:** Prim Hesapla yalnızca açık sigorta primi ya da teklifi talebinde çağrılır. Stok sorusunda araç çağrılmaz ve sabit cümle kullanılır. Model tutar ve özet yazmaz; özeti kod ekler.
- **Prim Hesapla açıklaması:** araç stok ve fiyat sorularında kullanılmaz; `inStock` alanı stok bilgisi olarak aktarılmaz.
- **"Yanıtı tamamla" kodu:** teklif özeti her zaman sonda, ayrı paragrafta eklenir. Model yine de yer tutucu yazarsa devreye giren bir güvenlik ağı eklendi. Eski stok cümlesi (`STOK_YOK`) koddan kaldırıldı. Prim Hesapla çağrılıp Sigorta Şartları çağrılmadığında modelin şart terimli cümleleri gizlenir; bu ikinci davranışın canlıda devreye girdiği bir test görülmedi.

### Taslak testleri (D1–D9): 8/9 geçti

**Yöntem:** testler yayınlanmamış taslakta (`8a504da3`), yerel n8n'in `/webhook-test/` yoluyla ve her biri bir kez çalıştırıldı. İstekleri kullanıcı kendi terminalinden gönderdi.

**Kanıt:** kullanıcının paylaştığı yanıtlar ve ekran görüntüsü ile çalışma meta verisi. Ek olarak, kullanıcının isteğiyle #545, #546, #548, #550 ve #555'te yalnızca "Yanıtı tamamla" düğümünün çıktısı okundu. D3–D9 için HTTP 200 terminal çıktısında görüldü; D1 ve D2'nin HTTP durum kodu paylaşılmadı.

| Test | Mesaj | Sonuç | Prim Hesapla | Çalışmalar |
| --- | --- | --- | --- | --- |
| D1 | Terra Minimal Kolye stok sorusu | ✅ Sabit stok cümlesi; teklif ve demo uyarısı yok | 0 | #544 |
| D2 | Luna Seramik Kupa stok sorusu | ✅ Sabit stok cümlesi; teklif ve demo uyarısı yok | 0 | #545 |
| D3 | 2 kupa için teklif | ✅ 840,00 TL / 33,60 TL (vergiler hariç); demo uyarısı bir kez | 1 | #546, #547 |
| D4 | 1 kolye için teklif | ✅ 290,00 TL / 15,00 TL; stok cümlesi yok | 1 | #548, #549 |
| D5 | Stok sorusu ve teklif birlikte | ✅ Sabit stok cümlesi ve 290,00 TL / 15,00 TL | 1 | #550, #551 |
| D6 | Amber Soya Mum fitil bakımı | ✅ Bakım bilgisi ve kaynak satırı | 0 | #552 |
| D7 | Kırılan ürün teminatı | ✅ Sigorta Şartları çağrıldı; demo uyarısı bir kez | 0 | #553, #554 (Sigorta Şartları) |
| D8 | "Peki 3 adet olursa?" (D3 oturumu) | ✅ 1.260,00 TL / 50,40 TL | 1 | #555, #556 |
| D9 | "Az önce hangi üründen kaç adet sormuştum?" (D3 oturumu) | ❌ Son soru 3 adet iken yanıt 2 adet dedi | 0 | #557 |

- Testler boyunca canlı RAG'de ve hata yakalayıcıda çalışma yok.
- Prim sayıları alt workflow'un çalışma kayıtlarıyla eşleştirildi.

### Yer tutucu güvenlik ağı

Dört teklif testinde (D3, D4, D5, D8) güvenlik ağı **tetiklenmedi**: `yerTutucuGuvenlikAgi` `false`, `yerTutucuGizlenen` boş ve `yerTutucuDonusum` sayaçlarının tümü 0. Model bu testlerde yer tutucu yazmadı. Bu yüzden güvenlik ağı **canlıda henüz sınanmadı**; davranışı yalnızca yerel simülasyona dayanıyor.

### Bilinen sınırlama: hafıza (D9)

Aynı oturumda önce 2 adet için teklif istenip sonra "Peki 3 adet olursa?" diye soruldu. "Kaç adet sormuştum?" sorusuna model 3 yerine **2 adet** yanıtı verdi. Bir kez gözlendi; nedeni incelenmedi, düzeltme yapılmadı ve test yeniden çalıştırılmadı. Davranışın önceki sürümde de olup olmadığı bilinmiyor.

### Yayın

- Yayınlanan sürüm: **`8a504da3`** (kullanıcı onayıyla). Aktif sürüm, konteynerden alınan dışa aktarımla doğrulandı.
- Geri dönüş: önceki sürüm **`08e2d27a`** yeniden yayınlanır.

### Production testi

Mesajları kullanıcı siteden gönderdi ve yanıtları paylaştı. Çalışmalar meta veri düzeyinde okundu; HTTP durum kodları ölçülmedi. Çalışmalar mesajlarla gönderim sırası ve zamana göre eşleştirildi; Prim Hesapla çağrı sayıları alt workflow'un çalışma kayıtlarından çıkarıldı.

| Mesaj | Sonuç | Prim Hesapla | Çalışmalar |
| --- | --- | --- | --- |
| Terra Minimal Kolye stok sorusu | ✅ Sabit stok cümlesi; teklif ve demo uyarısı yok | 0 | #558 `webhook` `success` |
| 2 adet Luna Seramik Kupa için teklif | ✅ 840,00 TL / 33,60 TL (vergiler hariç), ayrı paragrafta; demo uyarısı bir kez | 1 | #559 `webhook` `success`; #560 `integrated` `success` |

- Stok ve teklif yanıtları doğru. Bulgu 1 (stok) ve bulgu 2 (tutar satırının cümle ortasına girmesi) bu testte görülmedi.
- **Küçük biçim kusuru:** "Başka bir konuda yardımcı olabilir miyim?" cümlesi teklif özetinden önce geliyor.
- Canlı RAG'de, Sigorta Şartları'nda ve hata yakalayıcıda çalışma yok.
- **Production hafıza testi yapılmadı.**

### Diğer gözlemler

- Teklif yanıtlarının giriş cümleleri yer yer gereksiz ya da tuhaf; D5'teki "Sigorta teklifi için işlem yaptım" ifadesi bir işlem yapılmış gibi okunabilir.
- D7 yanıtında farklı numaralar içeren iki liste var ("Kaynaklar: Parçalar …" ve "Getirilen demo şartları bölümleri …"); ziyaretçi için kafa karıştırıcı olabilir. Kanıt: kullanıcının paylaştığı yanıt. Farkın nedeni, önceki sürümde de olup olmadığı ve şartların kaynak belgeye göre doğruluğu incelenmedi.
- Her test bir kez çalıştırıldı; sonuçlar modelin her seferinde aynı davranacağını göstermez.
- Hata yakalayıcıda Telegram düğümünün etkin olmasının bilerek yapıldığı hâlâ doğrulanmadı.
