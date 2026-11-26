# 6. aşama planı: yayınlama ve yerel uçtan uca

> Hazırlandı: 23.11.2026. **Durum: Adım B'nin kararları 23.11.2026'da alındı (bölüm 4 ve 5). C ve D1–D5 uygulandı; K1, K2 ve K7 geçti (bölüm 9). K7 yalnızca bir yapılandırma kontrolüdür: `errorWorkflow` bağlantısını salt okumayla doğrular, gerçek hatayla tetikleme içermez. Gerçek hatayla uçtan uca doğrulama 7. aşamada H7-2 – H7-5 adımlarında yapıldı (`asama-7-hata-agi-plan.md`). Adım G 8. aşamada yapıldı (24.11.2026). Adım E ve K3–K6 kullanıcı kararıyla beklemede: PDF'te BizCard bağlantısı "Önerilen ek"tir (`Final_Gorevi_BizCard.pdf`). Yedekleme yayını kararı açık.** Önceki aşamalar: `asama-3-prim-hesapla-plan.md`, `asama-4-hata-yakalayici-plan.md`, `asama-5-final-asistan-plan.md`. Genel plan: `kapsam-ve-plan.md`. Aşama listesi: 6 yerel uçtan uca + yayınlama, 7 hata ağı uçtan uca, 8 doküman + commit, 9 prova + video.

## 1. Amaç ve sınır

Final workflow'larını yayına hazırlamak ve yayınlamak; BizCard → bizcard2 `/api/chat` proxy'si → n8n zincirini yerelde uçtan uca doğrulamak.

**Kapsamda:**
- Workflow adları ve açıklamaları (bölüm 4'teki karara göre).
- Final asistan webhook'una Basic Auth ve yeni yol (bölüm 5, karar 5).
- Hata yakalayıcının yayınlanması ve `errorWorkflow` bağlanması (4. aşamadaki D).
- Final asistanın yayınlanması.
- bizcard2 proxy'sinin yerelde yazılması (ayrı plan ve onayla).
- Proxy üzerinden yerel uçtan uca kabul testi.

**Kararı açık:** Yedekleme workflow'unun yayınlanması (Ö1–Ö3'e bağlı; bölüm 5, karar 3).

**Kapsam dışında:**
- Gerçek Telegram gönderimi ve bilerek hata üretilen uçtan uca hata ağı denemesi; alt workflow teknik hatası ve asistanın 503 yolu (7. aşama).
- Commit (8. aşama).
- 3 prova ve video (9. aşama).
- AtölyeKart canlı sitesi ve canlı workflow'lar.
- bizcard2 production deploy (ayrı inceleme ve onay; adım H).

**Aşamanın kapanması:** n8n tarafındaki adımlar (D1–D5) proxy tamamlanmadan yapılabilir. 6. aşamanın uçtan uca kabulü ve bütünüyle kapanması ise bizcard2 proxy'si üzerinden yapılan K3–K6 testlerinin geçmesine bağlıdır (bölüm 7).

## 2. Başlangıç durumu ve kanıtlar (23.11.2026)

| Konu | Durum | Kanıt |
| --- | --- | --- |
| Final asistan `ruOv…` | Sürüm `7ed1c0d7`, `active:false`, yayınlanmadı. Webhook yolu `atolyekart-final-asistan-test`, kimlik doğrulama yok. Açıklamada "TEST, yayınlanmaz" yazıyor. | `asama-5-final-asistan-plan.md` §8; 23.11 salt okuma |
| Final asistan regresyonu | R1–R6 geçti (#503–#513). Yalnızca n8n tarafının doğrulamasıdır; proxy üzerinden yapılmadı. | `asama-5-final-asistan-plan.md` §8, "Regresyon kontrolü" |
| Prim Hesapla `14IY…` | Yayınlı, `2eba8392`. Çağıranlar: ruOv'un Prim Hesapla aracı ve test çağırıcısı `I8sS…`, ikisi de ID ile. Diğer 34 workflow 14IY referansı için taranmadı. | R0 ön kontrolü; 23.11 salt okuma |
| Sigorta Şartları `Q8hr…` | Yayınlı, `5f9edfd1`; 2. aşama workflow'u, değiştirilmez kuralı geçerli. Çağıranlar: ruOv'un Sigorta Şartları aracı ve `Pt4W…`, ikisi de ID ile. | R0 ön kontrolü; 23.11 salt okuma |
| `Pt4W…` | Q8hr'nin 2. aşama test çağırıcısı (webhook → Q8hr), yayınlanmadı. Final asistanın bağımlılık zincirinde değil: asistan Q8hr'yi kendi aracından doğrudan çağırıyor; Pt4W'ye hiçbir workflow bağlı değil. | 23.11 salt okuma |
| Hata yakalayıcı `IlJ0…` | Yayınlanmadı; Telegram düğümü devre dışı, chat ID boş | `asama-4-hata-yakalayici-plan.md` §5 |
| Yedekleme `jcH8…` | Sürüm `fe196dd2`, yayınlanmadı; günlük çalışma yok. *(25.11.2026: taslak `13ed8808`, yayınlanmadı; Telegram chat ID yedekte gizlenir. `yedekleme-ve-hata-bildirimi.md` → "Yedek içeriği ve repo güvenliği".)* | `yedekleme-ve-hata-bildirimi.md` → "Uygulama sonucu" |
| bizcard2 | `/api/chat` yok, `api/` klasörü yok. Web (`index.html`) ve mobil (`mobile/src/chat.js`) istemciler `chatWebhookUrl` adresine `{ event, cardId, sessionId, question, timestamp }` gönderiyor ve `{ answer: string }` bekliyor. Hata gövdesini okumuyorlar: 429'da bir sabit metin, diğer her hatada genel bir metin gösteriyorlar. `sessionId` `randomUUID()` ile üretiliyor. `chatWebhookUrl` web'de ve mobilde boş. Final asistan `{ ok, output }` döndürüyor. | 23.11 salt okuma |
| Eski webhook yolunun geçtiği yerler | Kodda yok (iki depoda da). Yalnızca `docs/final` belgelerinde. | 23.11 salt okuma |

### Yedekleme kabul ölçütleri (5 ve 6): tamamlandı

| Adım | Kayıt | Sonuç |
| --- | --- | --- |
| Y1 | `node --test scripts/n8n-workflow-listesi.test.mjs` | 8/8 geçti |
| Y2 | REST script'i, kullanıcının terminalinde (23.11.2026) | Toplam 36, aktif 10, uygun 12, istisna 22, ihlal 0, arşiv 2 |
| Y3 | Çalışma **#514**, `jcH8…`, 23.11.2026 01:37 (İstanbul), `success` | `n8n-yedek-2026-11-23-0137.json` Drive'a yüklendi; gizli bilgi taraması bulgu vermedi |
| Y4 | Sayım karşılaştırması + Drive ekran görüntüsü | Aşağıdaki tablo; dosya Drive'da, 383 KB (n8n'e göre 392 kB, 1000/1024 birim farkı); eski yedek duruyor |

| | REST (Y2) | Yedek (#514) |
| --- | --- | --- |
| Toplam | 36 | 36 (`n8nWorkflowCount` ve yedekteki sayı) |
| Aktif | 10 | 10 |
| Arşiv | 2 | 2 |

Bu ölçütler, yedekleme workflow'u yayınlanmadan elle yapılan çalışmayla karşılandı. Günlük otomatik yedek ancak yayından sonra başlar.

## 3. Uygulama öncesi doğrulamalar (açık konular)

| # | Konu | Bilinen | Doğrulanmayan | Doğrulama yolu | Ne zaman kapanmalı |
| --- | --- | --- | --- | --- | --- |
| Ö1 | `.env.local` API anahtarı | `n8n_test2` (28.11'de doluyor) değil (kullanıcı kontrolü). Y2 23.11'de çalıştı: o gün geçerliydi ve listeleme yetkisi vardı. | Hangi anahtar olduğu; bitiş tarihi | Kullanıcı REST script'ini çalıştırır, hemen ardından n8n API sayfasında "Last used" değeri "şimdi" olan anahtara bakar | 28.11'den sonra REST script'i yeniden çalıştırılmadan önce ve yedekleme yayın kararından önce |
| Ö2 | Yedekleme credential'ı | #514 23.11'de çalıştı: o gün geçerliydi. `n8n_test2`'nin "Last used" değeri Y2 ve #514'ten sonra da "2 gün önce" kaldı; bu güçlü bir işaret ama kesin eşleştirme değil. | Credential'ın `atolyekart-yedekleme` (22.12.2026) anahtarını taşıdığı | jcH8'in elle çalıştırılması ve ardından "Last used" kontrolü. Bu Drive'a ek bir dosya yükler; **ayrı onaya bağlıdır (23.11.2026'da onay verilmedi).** | **Yedekleme yayın kararından önce** |
| Ö3 | API anahtarı izinleri | Ekranda her anahtar için "109 scopes" | İzinlerin adları; iki iş için de gereken `workflow:list` ve `workflow:read` | Kullanıcı n8n API sayfasında ilgili anahtarların ayrıntı ekranına bakar | Ö1 ve Ö2 ile birlikte |
| Ö4 | Yeniden adlandırma ve açıklama değişikliğinin sürüme etkisi | 14IY yeniden adlandırılmayacağı için yayındaki bir workflow etkilenmez | ruOv, IlJ0 ve jcH8'te ad ve açıklama değişikliğinin yeni sürüm oluşturup oluşturmadığı | D1'den sonra salt okuma: sürüm kimliği ve sürüm farkı | D1'in hemen ardından |
| Ö5 | bizcard2 oturum kimliği | İstemci `sessionId`'yi `randomUUID()` ile üretiyor (36 karakter); proxy kalıbına (`/^[A-Za-z0-9-]{8,64}$/`) uyuyor | Asistanın "Girdiyi doğrula" düğümündeki kurala uyduğu (bu turda yeniden okunmadı) | ruOv'un salt okunması | Adım E'nin planlamasında |
| Ö6 | OpenAI bakiyesi | Yaklaşık 2 USD (kapsam §7) | Güncel bakiye | Kullanıcı kontrolü | Adım F'den önce |
| Ö7 | Altyapı | Docker ve cloudflared yeniden başlatmada elle açılıyor | — | — | Her test gününden önce |
| Ö8 | 14IY'nin diğer kullanımları | ruOv aracı ve I8sS (ID ile) | Diğer 34 workflow'da referans olup olmadığı | Ayrı onaylı salt okuma taraması | Şart değil: 14IY bu aşamada değişmiyor |

Ö1–Ö3 kapanmadan yedekleme için yayın kararı verilmez ve günlük yedek aktifleştirilmez.

## 4. Karar: workflow adları

Standart (`isimlendirme-standardi.md`): `-test` eki yayınlanmayan deneme kopyası içindir; yayınlanan sürümde olmaz.

**Q8hr koruması:** `Q8hr…` 2. aşama workflow'udur. Açık istisna verilmedikçe hiçbir seçenekte yeniden adlandırılmaz, kopyalanmaz, yayından kaldırılmaz, `errorWorkflow`'a bağlanmaz ve başka şekilde değiştirilmez. Bu durumda `atolyekart-final-sigorta-sartlari-test` adıyla yayında kalır ve isimlendirme standardına istisna olarak yazılır (bu belge değişikliği adım G'de, onayla). `Pt4W…` için de aynı kural geçerlidir. Q8hr'nin mevcut bağlantıları (ruOv aracı, Pt4W) değiştirilmez.

**Karar (23.11.2026): Seçenek B, yalnızca yayınlanmamış üç workflow için.**

| ID | Şimdiki ad | Yeni ad | Not |
| --- | --- | --- | --- |
| `ruOv…` | `atolyekart-final-asistan-test` | `atolyekart-final-asistan` | Açıklama da güncellenir |
| `IlJ0…` | `atolyekart-final-hata-yakalayici-test` | `atolyekart-final-hata-yakalayici` | Açıklama da güncellenir |
| `jcH8…` | `atolyekart-final-yedekleme-test` | `atolyekart-final-yedekleme` | Açıklama da güncellenir |
| `14IY…` | `atolyekart-final-prim-hesapla-test` | **Değişmez** | Yayınlı; adı, açıklaması ve ayarları bu aşamada değişmez. `-test` adıyla yayında kalır ve isimlendirme standardına istisna olarak yazılır (adım G). |
| `Q8hr…`, `Pt4W…` | — | **Değişmez** | Koruma kuralı |
| `I8sS…`, `jV30…`, `kpYB…`, `E3LF…` | — | **Değişmez** | Test yardımcıları; `-test` adıyla ve yayınlanmadan kalır |

ruOv'un araçları alt workflow'ları ID ile çağırdığı için ad değişikliği bağlantıları koparmaz. Araçlarda görünen eski ad (`cachedResultName`) güncel kalmaz; bu yalnızca görünüm farkıdır ve bu aşamada düzeltilmez.

**Açıklamalar.** Yayın durumu doğru yazılır; yayınlanmamış bir workflow yayınlanmış gibi gösterilmez. Açıklama, yayından sonra da doğru kalacak biçimde "onayla yayınlanır" der, "yayında" demez. Önerilen metinler (D1'de son hali ayrıca gösterilir):
- **ruOv:** "Final asistan. Webhook {sessionId, chatInput} → AI Agent (gpt-4.1-mini, Redis atolyekart-final:*) + Product Documents, Sigorta Şartları, Prim Hesapla → tutar/disclaimer kodla tamamlanır. Yayına hazırlanıyor; yalnızca kullanıcı onayıyla yayınlanır. Hiçbir yere yazmaz (Redis hafıza hariç)."
- **IlJ0:** "Final hata yakalayıcı. Error Trigger → mesaj kurulur (kişisel veri yok) → Telegram (düğüm devre dışı; gönderim yok). Yayına hazırlanıyor; yalnızca kullanıcı onayıyla yayınlanır. Hiçbir yere yazmaz."
- **jcH8:** "Final yedekleme. Her gün 03:00 → n8n workflow listesi → gizli bilgi taraması → Google Drive 'AtolyeKart n8n Yedekleri'. Yayınlanmadı; yayın kararı API anahtarı doğrulamasına bağlı ve ayrı onayla. Yalnızca Drive'a yazar."

Değerlendirilen seçenekler (karar öncesi karşılaştırma):

| | A. `-test` adlarıyla yayınlama | B. Aynı ID ile yeniden adlandırma | C. Temiz adlı kopyalar |
| --- | --- | --- | --- |
| Değişen ID | Yok | Yok (yalnızca ad değişir) | 4 yeni ID; eskiler test olarak kalır |
| Alt workflow referansları | Değişmez | Araçlar ve test çağırıcıları alt workflow'u **ID ile** çağırıyor; bağlantı kopmaz. Editörde görünen eski ad (`cachedResultName`) güncel kalmaz; yalnızca görünüm farkıdır. Q8hr bağlantısı aynı kalır. | Kopya asistanın Prim Hesapla aracı yeni prim ID'sine yeniden bağlanmalı; Sigorta Şartları aracı mevcut Q8hr'yi çağırmaya devam eder. `errorWorkflow` yeni handler ID'sini göstermeli. Credential'lar yeniden ID ile doğrulanmalı (5. aşamada SDK yanlış OpenAI credential'ı bağlamıştı). |
| Webhook adresi | `/webhook/atolyekart-final-asistan-test` | Yol, webhook düğümünün parametresidir; ad değişince değişmez. Yol değişikliği ayrı bir karardır (bölüm 5, karar 5). | Kopyada yeni yol seçilebilir |
| Yayına etkisi | Yok | Yayınlı bir workflow'un adı değişince yeniden yayın gerekip gerekmediği **doğrulanmadı**; bu yüzden yayınlı 14IY kararın dışında bırakıldı. ruOv, IlJ0 ve jcH8 henüz yayınlanmadığı için son adlarıyla yayınlanır. | Kopyaların her biri yayınlanmalı; eski 14IY yayında kalır ya da ayrı kararla yayından kaldırılır |
| Test yükü | Yok | Düşük. Davranış değişmez; R0 benzeri salt okuma kontrolü yeter. | Yüksek. Kopyalar için R1–R6 yeniden çalıştırılmalı (OpenAI maliyeti). |
| Kanıtlara etkisi | Yok | REST'teki adlar değişir, sayılar aynı kalır. Belgelerde eski adlar "önceki ad" notuyla kalır. | Workflow sayısı 40'a çıkar; Y2 ve Y4 kanıtları eskir, yeni ölçüm gerekir. |
| Ana risk | Standarda aykırı; açıklamalarda "yayınlanmaz" yazıyor; videoda kafa karıştırır | Test ile yayın ayrımı kalkar: sonraki değişiklikler doğrudan yayındaki workflow'a gider (gerekirse yeni `-test` kopyası açılır). Q8hr ve 14IY `-test` adıyla kalır. | En çok işi ve en yüksek yanlış bağlantı riskini taşır; iki kopya seti arasında karışıklık olabilir. Q8hr yine `-test` adıyla kalır. |

## 5. Diğer kararlar (23.11.2026)

1. **Proxy yanıt sözleşmesi: `{ answer }`.** İstemciler değişmez; dönüşümü proxy yapar. K3–K6'da bu sözleşme esas alınır.

   | Yön | Gövde |
   | --- | --- |
   | İstemci → proxy | `{ event, cardId, sessionId, question, timestamp }` (istemciler bugünkü gibi gönderir) |
   | Proxy → n8n | `{ sessionId, chatInput: question }`; `event`, `cardId` ve `timestamp` iletilmez |
   | n8n 200 `{ ok: true, output }` | Proxy 200 `{ answer: output }` |
   | n8n 200 ama `ok` true değil ya da `output` metin değil | Proxy 502 |
   | n8n 400 / 503 ya da başka hata | Proxy 502; n8n'in gövdesi iletilmez |
   | n8n zaman aşımı | Proxy 504 |
   | Proxy'nin kendi reddi | 400 (geçersiz girdi), 403 (origin), 413 (boyut), 415 (JSON değil), 429 + `Retry-After` |

   Hata yanıtlarında gövde yalnızca kısa bir Türkçe metindir; teknik ayrıntı içermez. İstemciler hata gövdesini okumaz, durum koduna göre kendi sabit metnini gösterir: 429'da "çok fazla soru" metni, diğer hatalarda genel metin. Bu yüzden istemcide değişiklik gerekmez ve hata gösterimi sözleşmeyle tutarlıdır.
2. **`errorWorkflow`: Seçenek 2.** ruOv ve jcH8 → IlJ0. Yayınlı 14IY değiştirilmez; Q8hr'ye bağlanmaz. 14IY'de oluşabilecek bir teknik hatanın davranışı (asistanın 503 yolu) 7. aşamada ayrıca test edilir.
3. **Yedekleme yayını: karar açık.** Ö1–Ö3 tamamlanmadan karar verilmez. Ö2'yi kesinleştirmek için jcH8'in elle çalıştırılması (Drive'a ek bir dosya) ayrı onaya bağlıdır. Bu planda yedekleme yayını için bir uygulama adımı yoktur.
4. **bizcard2 production: ayrı inceleme ve açık onay (adım H).** K3–K6 geçmeden production'da hiçbir değişiklik yapılmaz.
5. **Webhook yolu: Seçenek (i).** ruOv'un yolu `atolyekart-final-asistan-test` → `atolyekart-final-asistan`. Basic Auth ile aynı düğüm değişikliğinde yapılır (D3).
   - **Mevcut bağlantılara etkisi:** Eski yol kodda hiçbir yerde kullanılmıyor; bizcard2'de `chatWebhookUrl` boş; workflow yayınlanmadığı için eski yolun production adresi bugün çalışmıyor. Bu yüzden kırılan bir bağlantı yok. Test adresi (`/webhook-test/…`) de yeni yola geçer.
   - **Belgeler:** `asama-5-final-asistan-plan.md` ve `kapsam-ve-plan.md` içindeki eski yol geçmiş kaydıdır; değiştirilmez. Yeni yol adım G'de belgelenir.
   - **Proxy:** n8n adresi yalnızca proxy'nin sunucu ortam değişkeninde tutulur; tam adres belgeye yazılmaz.
   - **Test:** D3'ten sonra R6a ve R1 elle; D5'ten sonra K1 ve K2 yeni yol üzerinden. Eski yola istek atılmaz.
6. **Açıklamalar:** Ad değişiklikleriyle birlikte güncellenir (bölüm 4).

## 6. Uygulama adımları (her biri ayrı onayla)

- **A.** Bu plan (yalnızca belge).
- **B.** Kullanıcı kararları: ✅ 23.11.2026 (bölüm 4 ve 5).
- **C.** ✅ 23.11.2026. Kullanıcı, **plan onaylandıktan sonra** final asistan için yeni bir Basic Auth credential'ı oluşturur. Değerler sohbete yazılmaz; yalnızca adı bildirilir. Mevcut Basic Auth credential'ları başka akışlara ait olduğu için kullanılmaz. Claude credential'ı ID ile doğrular.
- **D. n8n tarafı** (her biri ayrı onay; her adımdan sonra salt okuma ile kontrol). Bu adımlar proxy'yi beklemeden yapılabilir. 14IY, Q8hr, Pt4W ve I8sS hiçbir D adımında değişmez.
  - **D1 Adlar ve açıklamalar.** ✅ 23.11.2026. Yayınlamadan **önce**: ruOv, IlJ0 ve jcH8 (bölüm 4). Açıklamaların son metni uygulamadan önce gösterilir. Ardından salt okuma ile kontrol (Ö4):
    - ID'ler aynı; `active:false` ve yayınlanmamış durum değişmemiş.
    - Sürüm oluştuysa sürüm farkında yalnızca ad ve açıklama değişmiş; düğümler, bağlantılar ve ayarlar aynı.
    - ruOv'un araç ID'leri (14IY, Q8hr) ve tüm credential ID'leri aynı.
  - **D2** ✅ 23.11.2026. Hata yakalayıcıyı (IlJ0) son adıyla yayınla. Telegram düğümü devre dışı ve chat ID boş kalır.
  - **D3** ✅ 23.11.2026. ruOv webhook düğümü: Basic Auth (C'deki credential) ve yeni yol `atolyekart-final-asistan`, tek düğüm değişikliğinde. Bu yeni bir sürüm oluşturur. Ardından:
    - Salt okuma: sürüm farkında yalnızca webhook düğümü değişmiş olmalı; credential ID doğru.
    - R6a (geçersiz girdi → 400 yanıt düğümü) ve R1 (tek tur bakım sorusu; disclaimer ve içerik ölçütleri) elle tekrarlanır.
    - Elle çalıştırma gerçek bir HTTP isteği değildir; Basic Auth'u ve yolu sınamaz. Bunları K1 ve K2 sınar.
  - **D4** ✅ 23.11.2026. `errorWorkflow` bağlama: ruOv ve jcH8 → IlJ0 (bölüm 5, karar 2). IlJ0 yayınlanmış olmalı. jcH8'e ayar eklemek onu yayınlamaz.
  - **D5** ✅ 23.11.2026. Final asistanı son adıyla yayınla. Bu noktada webhook internete açılır; D3 tamamlanmadan D5 yapılmaz. Hemen ardından K1, K2 ve K7.
  - Yedekleme yayını bu planda bir adım değildir (bölüm 5, karar 3).
- **E. bizcard2 proxy'si** (ayrı depo; o deponun kurallarıyla ayrı plan ve onay). Sözleşme bölüm 5, karar 1'dedir. AtölyeKart'taki `server/routes/chat.js` deseni:
  - Gövde yalnızca izinli alanlarla yeniden kurulur.
  - JSON olmayan istekte 415, geçersiz gövdede 400.
  - n8n'e Basic Auth ile, yönlendirme izlemeden ve zaman aşımıyla gidilir; IP adresi n8n'e iletilmez.
  - Sırlar yalnızca sunucu ortam değişkenlerinde tutulur.
  - Kapsamdaki sabit demo uyarısı arayüzde görünür.

  **Güvenlik notu:** Aynı origin kontrolü (`Origin` / `Sec-Fetch-Site`) tarayıcı dışından gelen istekleri durdurmaz; **tek başına bir güvenlik sınırı değildir.** Aşağıdakiler proxy planında ayrıca değerlendirilir:
  - Rate limit (IP ve oturum başına; bellek içi sayaç instance başınadır).
  - İstek gövdesi boyut sınırı.
  - n8n'e giden çağrı sayısı ve OpenAI maliyeti için üst sınır.
  - Internete açılmadan önce gereken ek erişim ve kötüye kullanım korumaları (ör. platform düzeyinde WAF / rate limit kuralı, bot koruması).

  **Mobil istemci:**
  - Mobil uygulama tarayıcı değildir ve `Origin` başlığı göndermez. Origin kontrolü olan bir proxy mobil istekleri reddeder. `Origin`'i olmayan istekleri kabul etmek ise tarayıcı dışındaki tüm istemcilere kapıyı açar; bu durumda koruma yükünü rate limit, boyut sınırı, maliyet üst sınırı ve platform korumaları taşır. Hangisinin seçileceği adım H'de (P1) kararlaştırılır.
  - Mobil uygulama geliştirme makinesindeki `localhost`'a erişemez ve mutlak bir proxy adresine ihtiyaç duyar. Bu yüzden K3–K6 yalnızca web istemcisiyle yapılır. Mobil uçtan uca deneme production incelemesinin parçasıdır.

  Proxy'nin internete açılması (production deploy) ayrı inceleme ve onaya bağlıdır (adım H).
- **F.** Yerel uçtan uca kabul testi (bölüm 7).
- **G.** Belgeleme: plan sonucu; isimlendirme standardı (yeni adlar, 14IY ve Q8hr istisnaları); yeni webhook yolu; kapsam §5. Önce diff, sonra onay.
- **H. bizcard2 production inceleme süreci** (yalnızca K3–K6 geçtikten sonra; her biri ayrı onay):
  - **P1** Proxy güvenlik incelemesi: rate limit, boyut sınırı, maliyet üst sınırı, Origin kuralı ve mobil karar.
  - **P2** bizcard2 Vercel projesinin güvenlik duvarı ve koruma ayarlarının salt okunması.
  - **P3** Ortam değişkenleri: kullanıcı girer; Claude değer üretmez ve eklemez.
  - **P4** Deploy için açık onay.
  - **P5** Production'da kısa doğrulama (web; mobil P1'deki karara göre).

**Geri alma:**
- Yayın: yayından kaldırma (unpublish).
- Sürüm: kayıtlı bir sürüme geri dönme (restore). D3 öncesine dönülürse eski yol ve kimlik doğrulamasız webhook geri gelir; bu yüzden yayındaki bir workflow'da önce yayından kaldırılır.
- Her ikisi de ayrı onayla. Yeniden adlandırma ve açıklama değişikliği geri alınabilir.

## 7. Kabul testleri

**Önemli:** n8n'de elle yapılan çalışmalar (R1–R6 dahil) yalnızca n8n tarafının doğrulamasıdır. Elle çalıştırma gerçek bir HTTP isteği değildir; Basic Auth'u ve proxy'yi sınamaz. **6. aşamanın uçtan uca kabulü bizcard2 proxy'sine (adım E) bağlıdır.** Proxy olmadan yapılan hiçbir test tam entegrasyon kabulü sayılmaz.

| # | Test | Yol | Kayıt ölçütleri | Proxy gerekir mi? |
| --- | --- | --- | --- | --- |
| K1 | Kimlik doğrulamasız istek | Yayınlı webhook'a (yeni yol) doğrudan HTTP | (1) Gerçek HTTP durum kodu kaydedilir; istek reddedilmeli. (2) Workflow'un iş mantığı çalışmamalı ve workflow çalışması başlamamalı: "Girdiyi doğrula" ve sonraki düğümler çalışmamış, model çağrılmamış olmalı. n8n'in reddedilen istek için teknik bir kayıt oluşturması tek başına tetiklenme sayılmaz; böyle bir kayıt varsa düğüm verisi incelenir. (3) Yanıt gövdesi ve başlıkları sır içermemeli (kimlik bilgisi, iç adres, stack trace). | Hayır (yalnızca n8n güvenlik kontrolü) |
| K2 | Yanlış kimlik bilgisi | Aynı | K1 ile aynı üç ölçüt | Hayır |
| K3 | Üç mesajlık demo (bakım → teklif → hafıza) | Yerel bizcard2 (web) → `/api/chat` → yayınlı n8n | Her turda 200 ve `{ answer }`; R1–R3 içerik ölçütleri (disclaimer, 840,00 / 33,60, hafıza); arayüzde doğru gösterim | **Evet: kabulün asıl testi** |
| K4 | Limit aşımı (12 kupa) | Aynı | Prim yok; 5.040,00 / 5.000,00; `{ answer }` ile. Prim aracı iş kuralı nedeniyle reddettiğinde asistan çökmez (200, hata yolu değil) ve yanıttaki tutarlar doğru kalır. Teknik hata ve 503 davranışı bu testin kapsamında değildir (7. aşama). | Evet |
| K5 | Geçersiz girdi | Proxy'ye boş mesaj | Proxy 400 döner, n8n'e gidilmez (n8n'de workflow çalışması başlamaz); arayüz durum koduna göre genel hata metnini gösterir | Evet |
| K6 | Başka origin'den istek | Proxy | 403; n8n'e gidilmez | Evet |
| K7 | Hata yakalayıcı bağlı mı | Salt okuma | ruOv ve jcH8'te `settings.errorWorkflow` IlJ0'ı gösteriyor; 14IY ve Q8hr değişmemiş; Telegram mesajı gönderilmez | Hayır (asıl hata denemesi 7. aşamada) |
| K8 | Yedekleme (yayınlanırsa; karar açık) | Salt okuma | Zamanlanmış (03:00) çalışma `success`; sayım o günkü REST listesiyle aynı. Yedekleme 03:00'ten sonra yayınlanırsa kontrol bir sonraki günün zamanlanmış çalışmasından sonra yapılır. Elle çalıştırma (ör. #514) Schedule Trigger doğrulamasının yerine geçmez. | Hayır |

- K1 ve K2 gerçek HTTP ölçümleridir. Kimlik bilgisi ve webhook adresinin tamamı komut satırına, çıktıya ve belgeye yazılmaz.
- K3–K6 yerel bizcard2'nin web istemcisi üzerinden yapılır. **6. aşama, K3–K6 geçmeden kapanmaz.**
- Kabul ölçütü 1'deki "3 kesintisiz prova" 9. aşamaya aittir; K3 bu provaların yerini tutmaz.

## 8. Sınırlar

- Canlı workflow'lar, kaynak `8b8fa1d4`, Qdrant koleksiyonları, Products tablosu, Redis canlı anahtarları ve credential tanımları değiştirilmez.
- Q8hr ve Pt4W açık istisna olmadan hiçbir şekilde değiştirilmez (bölüm 4). 14IY ve I8sS bu aşamada değiştirilmez. Q8hr'nin ve 14IY'nin mevcut bağlantıları değiştirilmez.
- Her yayınlama, aktifleştirme, yeniden adlandırma ve açıklama değişikliği ayrı onaya bağlıdır.
- Drive'a dosya yükleyen her elle çalıştırma (ör. Ö2 için jcH8) ayrı onaya bağlıdır.
- Commit, push ve deploy yapılmaz (bizcard2 deploy adım H'de, ayrı inceleme ve onayla).
- Telegram mesajı ve e-posta gönderilmez; sipariş, stok bildirimi ve poliçe oluşturulmaz.
- Sırlar (Basic Auth değerleri, API anahtarları, webhook adresinin tamamı, chat ID) çıktıya, belgeye ve Git'e yazılmaz. `.env.local` dosyaları açılmaz.
- Test başarısız olursa yeniden çalıştırma ya da otomatik düzeltme yapılmaz; dur ve raporla.

## 9. Uygulama sonucu (23.11.2026)

n8n 2.46.5 (`n8n-bootcamp` konteyneri). Her adım ayrı onayla yapıldı; her adımdan sonra salt okuma ile kontrol edildi.

| Adım | Sonuç |
| --- | --- |
| C | Basic Auth credential'ı kullanıcı oluşturdu: `AtolyeKart Final Assistant Basic Auth` (`httpBasicAuth`). |
| D1 | ruOv, IlJ0 ve jcH8 yeniden adlandırıldı (`-test` eki kaldırıldı), açıklamaları güncellendi. Yeni sürüm oluşmadı (Ö4: yayınlanmamış workflow'da ad ve açıklama değişikliği sürüm oluşturmuyor). 14IY, Q8hr, Pt4W ve diğer test workflow'ları değişmedi. |
| D2 | IlJ0 yayınlandı (`53b87907`). Telegram düğümü devre dışı, chat ID boş. |
| D3 | ruOv webhook düğümü: yol `atolyekart-final-asistan`, Basic Auth (`AtolyeKart Final Assistant Basic Auth`). Yeni sürüm `08e2d27a`; sürüm farkında yalnızca webhook düğümü var. Elle çalıştırma: R6a #515 (400 yanıt düğümü, model çağrılmadı), R1 #516 (200; yalnızca Product Documents; kaynak satırı var; disclaimer yok). R1'de T14 benzeri kesinleştirme yine görüldü ("tercih edilmeli", "kaçınılmalıdır"). |
| D4 | `errorWorkflow` = IlJ0: ruOv ve jcH8. Yeni sürüm oluşmadı (ayar workflow düzeyinde). Diğer 34 workflow değişmedi; sipariş workflow'ları canlı hata ağına (`LTWx…`) bağlı kaldı. |
| D5 | ruOv yayınlandı (`08e2d27a`). |
| K1 | Kimlik bilgisi olmadan dış istek: ilk deneme **502** (Cloudflare'in kendi hata sayfası, n8n'e ulaşmadı). Aynı isteğin yerel n8n'e (tünel atlanarak) gönderilmesi: 401. Dış tekrar: **401** (n8n yanıtı "Authorization is required!", `WWW-Authenticate: Basic realm="Webhook"`). İlk 502 büyük olasılıkla Cloudflare ya da tünel tarafında oluşan geçici bir hataydı; **nedeni doğrulanmadı**. |
| K2 | Uydurma kimlik bilgisiyle dış istek: **401** ("Authentication data is wrong!"). |
| K7 | ruOv ve jcH8'in `errorWorkflow` ayarı yayından sonra da `IlJ0…`. IlJ0 yayında; Telegram düğümü devre dışı; IlJ0 tetiklenmedi. K7 yalnızca bağlantının kurulu olduğunu doğrular; gerçek bir hatayla tetikleme yapılmadı (7. aşama). |

K1, K2 ve yerel kontrolde workflow çalışmadı (ruOv'un son çalışması #516) ve yanıtlarda sır yoktu. İsteklerin gövdesinde bilerek boş mesaj vardı; kimlik doğrulama geçilseydi bile model çağrılmazdı.

**Açık kalanlar:**
- K3–K6: bizcard2 proxy'sine bağlı (adım E).
- Yedekleme (jcH8) yayını: karar açık (Ö1–Ö3).
- Belgeleme (adım G).

Redis'te yeni test anahtarı: `atolyekart-final:final-d3-s1` (7 gün sonra kendiliğinden silinir).
