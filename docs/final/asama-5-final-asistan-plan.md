# 5. aşama planı: `atolyekart-final-asistan-test`

> Hazırlandı: 22.11.2026. **Durum (23.11.2026): A, B ve C tamamlandı. F1–F9 senaryoları düzeltme ve tekrar çalıştırmalarla doğrulandı. Sürüm bazındaki sonuçlar ve bilinen sınırlılıklar bölüm 8'de. Son sürüm `7ed1c0d7`, yayınlanmadı.** Önceki aşamalar: `asama-3-prim-hesapla-plan.md`, `asama-4-hata-yakalayici-plan.md`. Genel plan: `kapsam-ve-plan.md`. Tarife ve AI'ın rolü: `sigorta-tarife-taslagi.md` bölüm 5–7.

## 1. Amaç

Final ödevinin ana workflow'u. Ziyaretçinin mesajını alır; ürün bakımını RAG ile anlatır, sigorta şartlarını sigorta aracıyla yanıtlar, primi deterministik araçla hesaplar, konuşmayı Redis'te hatırlar. `kapsam-ve-plan.md` bölüm 5'teki kabul ölçütleri 1–3'ün n8n tarafı bu aşamada test edilir.

## 2. Yapı (`active:false`, yayınlanmaz)

```
Webhook (POST) → Girdiyi doğrula ─┬─ geçersiz → Respond 400 (LLM çağrılmaz)
                                  └─ geçerli → AI Agent ──→ Yanıtı tamamla (Code) → Respond 200
                                                 │  └─ hata çıkışı → Respond 503 → Stop and Error
                         ┌───────────────────────┼──────────────────────────┐
                 OpenAI gpt-4.1-mini        Redis Chat Memory           Araçlar:
                                          (final'e özel anahtar)   • Product Documents (Qdrant, salt okuma)
                                                                   • Sigorta Şartları → Q8hrWLrDUCixAEfn
                                                                   • Prim Hesapla → 14IYDf3MyS889v0b
```

- Girdi `{ sessionId, chatInput }` (doğrulama: bölüm 4). Çıktı `{ ok: true, output }`; hata `{ ok: false, mesaj }` + 503.
- "Yanıtı tamamla" Code node'u, ajanın hangi araçları çağırdığını Agent'ın `returnIntermediateSteps` seçeneğinden okur:
  1. Sigorta ya da prim aracı çağrıldıysa sabit demo uyarısı yanıtın sonuna **tam bir kez** eklenir; model yazmışsa onun kopyası silinir (kaynak `8b8fa1d4`'teki "Disclaimer ekle" deseni).
  2. Prim aracı `inStock: false` döndürdüyse "Bu ürün şu anda stokta yok." cümlesi yoksa eklenir.
  3. Prim tutarlılığı: bölüm 3.
- Hata ağı: Agent'ta `retryOnFail` (3 deneme, 2 sn). Tükenirse ziyaretçiye anlaşılır 503 mesajı döner, ardından Stop and Error çalışmayı hatalı bitirir (ileride bağlanacak `errorWorkflow` tetiklenebilsin).
- Google Sheets stok aracı eklenmez: Products tablosu sunucu kataloğuyla eşleşmez (tarife bölüm 3). Stok bilgisi yalnızca prim aracından gelir.

### Kararlar (22.11.2026, kullanıcı onayladı)

1. **Giriş: Webhook.** Ödevin zorunlu "Webhook" parçası; testte `sessionId` verilebilir; Respond to Webhook ile hata yanıtı döner. bizcard2 proxy'si `{ sessionId, chatInput } → { output }` sözleşmesiyle yazılır.
2. **Sigorta Şartları aracı: 2. aşama alt workflow'u** (`Q8hrWLrDUCixAEfn`) araç olarak çağrılır. Prompt'ta "araç yanıtının özünü değiştirmeden aktar" kuralı; testte kontrol edilir.
3. **Redis anahtarı:** `atolyekart-final:<sessionId>`, TTL 7 gün (canlı anahtarlarla çakışmaz).
4. **Prim tutarlılığı:** bölüm 3 (netleştirildi).
5. **Webhook kimlik doğrulaması:** test sürümünde yok; Basic Auth 6. aşamada kullanıcının oluşturacağı yeni credential ile.
6. **Model:** gpt-4.1-mini, temperature 0.2.

## 3. Prim tutarlılığı (netleştirme 1)

**İlke:** Prim ve sigorta bedeli için tek doğru kaynak `atolyekart-final-prim-hesapla` alt workflow'unun çıktısıdır. Yanıttaki her tutar ya bu çıktıdan kodla üretilir ya da yanıttan çıkarılır. Modelin yazdığı farklı bir tutar yanıtta **kalmaz**. `ok: false` (limit aşımı dahil) olduğunda prim tutarı gösterilmez.

### Alt workflow çıktısı (kaynak: kayıtlı sürüm `2eba8392`, "Prim hesapla" Code node'u; tahmin değil)

| Durum | Alanlar |
| --- | --- |
| Başarılı | `ok: true`, `productId`, `productName`, `category`, `inStock`, `quantity`, `insuredValue` (sayı, TL), `premium` (sayı, TL), `deductibleRule` (metin), `claimNoticeDays` (3), `currency` (`"TRY"`), `taxIncluded` (false) |
| `unknown_product` | `ok: false`, `reason`, `mesaj` |
| `invalid_quantity` | `ok: false`, `reason`, `mesaj` |
| `limit_exceeded` | `ok: false`, `reason`, `mesaj`, `insuredValue`, `maxInsuredValue` (5000) |

`premium` hiçbir hata çıktısında yoktur.

### Akış

1. **Model tutar yazmaz.** Prompt kuralı: prim, sigorta bedeli ya da azami bedel için rakam yazma; prim aracını çağırdıysan teklif özetinin yerine yalnızca `[PRIM_OZETI]` yer tutucusunu koy. Önceki bir teklifin tutarı sorulursa aracı yeniden çağır; tutarı hafızadan yazma.
2. **Kod özeti üretir.** "Yanıtı tamamla", bu turdaki her prim aracı çağrısının çıktısından deterministik bir satır kurar ve `[PRIM_OZETI]` yerine koyar (yer tutucu yoksa yanıtın sonuna, disclaimer'dan önce ekler):
   - `ok: true` → "Demo teklif: {productName} × {quantity} — sigorta bedeli {insuredValue} TL, prim {premium} TL (vergiler hariç)." Tutarlar `tr-TR` biçiminde, iki ondalıkla (`840,00`, `33,60`).
   - `limit_exceeded` → "{mesaj}" ve sigorta bedeli `insuredValue` ile azami bedel `maxInsuredValue`. **Prim yok.**
   - `unknown_product` / `invalid_quantity` → yalnızca aracın `mesaj` alanı. **Tutar yok.**
3. **Kod kalan tutarları denetler.** Yer tutucu doldurulmadan önce model metninde para tutarları aranır (rakam + `TL` / `₺` / `lira`, ya da `₺` + rakam; binlik nokta ve ondalık virgül/nokta biçimleri dahil). İzinli tutarlar yalnızca şunlardır:
   - aynı turdaki `ok: true` çıktılarının `premium` ve `insuredValue` değerleri,
   - `limit_exceeded` çıktısının `insuredValue` ve `maxInsuredValue` değerleri (prim değil),
   - `deductibleRule` metnindeki "en az 50 TL" (sigorta şartları ve prim çıktısının ortak kuralı).

   İzinli olmayan bir tutar içeren cümle yanıttan **çıkarılır**. Bu kural prim aracı hiç çağrılmadığı turlarda da çalışır: model hafızadan ya da tahminle prim yazarsa o cümle silinir.
4. **İz bırakma.** Çıktıya test için şu alanlar eklenir: `primCagrilari` (aracın her çağrısının girdisi ve çıktısı), `primOzetiEklendi`, `kaldirilanCumleler` (çıkarılan cümle sayısı ve çıkarılan tutarlar). Kaldırma olduysa `primDuzeltildi: true`.

### Doğrulanacak varsayım

n8n AI Agent'ın `intermediateSteps` alanının biçimi (araç adı ve araç çıktısının hangi alanda, metin mi nesne mi olarak durduğu) bu planda **varsayılmaz**. B adımında kod bu alanı savunmacı okur (metinse `JSON.parse` dener, okuyamazsa `primCagrilari` içinde `okunamadi` işaretler ve tutarı göstermez). C adımındaki ilk model çağıran testin (F1) çalışma kaydından gerçek biçim okunur; farklıysa test durur ve rapor edilir, kod otomatik düzeltilmez.

### Hafıza ile ilişkisi

Redis'e ajanın ham yanıtı yazılır; bu yanıtta tutar yerine `[PRIM_OZETI]` bulunur. Bu yüzden sonraki turlarda model önceki tutarı hafızadan okuyamaz; tutar gerekiyorsa aracı yeniden çağırır. F3 beklentisi buna göre yazıldı.

> **Düzeltme (23.11.2026):** Bu varsayım yanlış çıktı. Redis'e ajanın ham yanıtıyla birlikte araç çağrıları ve araç sonuçları da yazılıyor; prim aracının sonucundaki `insuredValue` ve `premium` de buna dahil. Yani model önceki tutarı hafızadan okuyabilir. Kod koruması yine de geçerli: araç çağrılmayan turda izin verilen tek tutar "en az 50 TL" olduğu için hafızadan okunan bir prim ya da bedel yanıtta kalamaz. Ayrıntı: bölüm 8 ve `kapsam-ve-plan.md` bölüm 8.

## 4. Girdi doğrulaması (netleştirme 2)

"Girdiyi doğrula" Code node'u, AI Agent'tan önce çalışır. Geçersiz her durumda **400** döner, model çağrılmaz:

| Alan | Kural |
| --- | --- |
| Gövde | JSON nesnesi olmalı (`body` yoksa ya da nesne değilse geçersiz) |
| `chatInput` | Tür `string` olmalı. `chatInput.trim()` uygulanır; **trim sonrası** uzunluk (JavaScript `length`) **en az 1, en fazla 1000** olmalı. Boş metin (`""`) ve yalnızca boşluk / sekme / satır sonundan oluşan metin geçersizdir. Ajana trim edilmiş metin gönderilir. |
| `sessionId` | Tür `string`, `/^[A-Za-z0-9-]{8,64}$/` ile tam eşleşme (trim uygulanmaz). |

400 gövdesi: `{ "ok": false, "reason": "invalid_input", "mesaj": "Mesaj 1 ile 1000 karakter arasında olmalı." }` (sessionId hatasında mesaj "Geçersiz oturum kimliği."). Ayrıntı yalnızca n8n çalışma kaydında kalır.

## 5. Testler (her biri bir kez, `execute_workflow`, `manual`)

| # | Oturum | Mesaj | Beklenen |
| --- | --- | --- | --- |
| F1 | S1 | Soya mumunun bakımı nasıl yapılır? | Product Documents çağrılır, kaynak satırı var, **disclaimer yok**; `intermediateSteps` biçimi kayıttan okunur |
| F2 | S1 | 2 Luna Seramik Kupa'yı kargoyla göndereceğim, sigorta teklifi alabilir miyim? | Prim aracı çağrılır; kodun özeti 840,00 / **33,60**; başka tutar yok; disclaimer bir kez |
| F3 | S1 | Az önce hangi ürün için ve kaç adet teklif aldım? | Hafızadan: Luna Seramik Kupa, 2 adet. Tutar ya hiç yazılmaz ya da araç yeniden çağrılarak kodun özetiyle gelir; araçsız tutar yazıldıysa cümle çıkarılmış olur (`primDuzeltildi`) |
| F4 | S2 | 3 Terra Minimal Kolye için sigorta primi ne olur? | 870,00 / 15,00 + "Bu ürün şu anda stokta yok." + disclaimer |
| F5 | S2 | 12 Luna kupa için teklif istiyorum | `limit_exceeded`; prim tutarı yok; bedel 5.040,00 ve azami 5.000,00 yalnızca kodun satırında; disclaimer |
| F6 | S3 | Kargoda kırılma sigorta kapsamında mı? | Sigorta Şartları çağrılır; şartlara dayalı yanıt; disclaimer |
| F7 | S3 | Deprem hasarı kapsamda mı? | "Bu bilgi demo şartlarında yok" türü yanıt; uydurma yok |
| F8 | S3 | Seramik vazo için prim hesaplar mısın? | Katalog dışı ürün; tutar yok, tahmin yok |
| F9a | — | `chatInput: ""` | 400, model çağrılmaz |
| F9b | — | `chatInput: "   \n\t "` (yalnızca boşluk) | 400, model çağrılmaz |
| F9c | — | `chatInput`: trim sonrası 1001 karakter | 400, model çağrılmaz |

- F1 → F2 → F3 aynı oturumda: kabul ölçütü 1'deki üç mesajlık demonun n8n tarafı.
- Her testte çalışma kaydından araç çağrısı, aracın çıktısı ve `primCagrilari` / `kaldirilanCumleler` alanları doğrulanır; yalnızca yanıt metnine bakılmaz.
- Maliyet: F1–F8 için gpt-4.1-mini ile kabaca 25–35 model çağrısı (tahmin; OpenAI panelinden kontrol önerilir). F9a–c maliyetsizdir.
- Test başarısız olursa yeniden çalıştırma ya da otomatik düzeltme yok; sonuç ve olası neden raporlanır.

## 6. Uygulama adımları (her biri ayrı onayla)

- **A.** Bu dosya. ✅
- **B.** Workflow'u oluştur, yeniden oku, yapıyı raporla (model çağrısı yok). Çağrılacak iki alt workflow'un `callerPolicy` ayarı yalnızca okunarak kontrol edilir. ✅ (22.11.2026)
- **C.** Önce F9a–c (maliyetsiz), sonra ayrı onayla F1–F8. ✅ (22.11.2026; sonuçlar bölüm 8)

## 7. Sınırlar

- Canlı workflow'lar, 2. ve 3. aşama workflow'ları (yalnızca araç olarak çağrılır), kaynak `8b8fa1d4`, Qdrant koleksiyonları (salt okuma), Products tablosu ve canlı Redis anahtarları değiştirilmez.
- Yayınlama/aktif etme, commit, push, deploy yok. Telegram/e-posta, sipariş, poliçe yok. Sır yazdırılmaz; `.env.local` açılmaz.
- Taslak alt workflow'lar elle çalıştırmada çağrılabiliyor. 6. aşamada final asistan yayınlanınca iki aracın da yayınlanması gerekir; bu, `errorWorkflow` bağlamasıyla (4. aşama D) aynı onay paketine girer.
  *(Not, 24.11.2026: F2 #485, AI Agent aracı olarak bağlanan yayınlanmamış alt workflow'da başarısız oldu ve 14IY ile Q8hr yayınlandıktan sonra araçlar çalıştı. Yukarıdaki gözlem 3. aşamadaki çağırıcı workflow'a aittir; iki durumun farkı ayrıca doğrulanmadı.)*

## 8. Uygulama sonucu (22–23.11.2026)

Workflow: `atolyekart-final-asistan-test` (`ruOvhJ8EtfHvpkrt`), `active:false`, `activeVersionId:null`, yayınlanmadı.

n8n'deki senaryo çalışmaları `execute_workflow` ile elle (`manual`) çalıştırıldı. Elle çalıştırma gerçek bir HTTP isteği olmadığı için HTTP durum kodu ölçülmedi; tabloda yalnızca hangi Respond düğümünün çalıştığı yazılıdır. Son sürümün yerel Node.js testleri n8n çalışması değildir; aşağıdaki "Plandan sapmalar" başlığında ayrıca belirtilmiştir.

Sürüm–çalışma eşleştirmesi, n8n sürüm geçmişindeki kayıt saatleri ile çalışmaların başlangıç saatleri karşılaştırılarak yapıldı (salt okuma, 23.11.2026).

### Sürüm zinciri

| Sürüm | Kayıt (UTC) | Değişiklik | Bu sürümde çalışan testler |
| --- | --- | --- | --- |
| `85920ff6` | 22.11 19:42 | İlk sürüm (15 düğüm) | — |
| `6a6be774` | 19:48 | OpenAI credential, İstanbul saat dilimi, elle çalışmaların kaydı | F9a–c (#480, #481, #483; #482 yanlış uzunlukla gönderildiği için sayılmadı), F1 (#484), F2 ilk deneme (#485) |
| `831a7987` | 20:10 | "Yanıtı tamamla": prim aracı çıktısındaki `{type:'text', text}` sarmalı açılır (derinlik 6); `errored: true` araç sonucu ayrıştırılmaz; tutar temizliğinden sonra boşalan yanıtta sabit güvenli metin ve `yanitBosaldi` alanı | F2 (#486), F3 (#488), F4 (#489), F5 (#491), F6 ilk deneme (#493) |
| `faca77f7` | 20:43 | F6 düzeltmesi. Araç adı Türkçe karakter dönüşümünden etkilenmeden tanınır: n8n "Sigorta Şartları" adını `Sigorta_artlar_` olarak veriyor; tanıma sırası `action.tool` → `action.log` ("Calling <ad>") → çıktıdaki `kaynakDokuman`. Sigorta aracı okunabilir bir yanıt döndürdüyse o turda modelin metni kullanılmaz; aracın `yanitGovdesi` ve `kaynakSatiri` alanları birebir konur. Araç okunamazsa sabit metin konur; bilinmeyen bir araç çağrıldıysa disclaimer eklenir. | F6 (#495), F7 ilk deneme (#497) |
| `400e98ef` | 21:26 | F7 düzeltmesi. Sigorta metninde aynı cümlede belirsizlik ve kesin hüküm birlikte varsa (A kuralı), ya da ilk paragraf hüküm verirken başlıksız başka bir paragraf konunun açıkça belirtilmediğini söylüyorsa (B kuralı), metin aktarılmaz. Yerine şu sabit metin konur: "Bu konu demo sigorta şartlarında açıkça belirtilmiyor. Bu nedenle kapsam hakkında kesin bir hüküm veremiyorum." `kaynakSatiri` yoksa sondaki boş "Kaynaklar:" başlığı silinir. | F7 (#499), F8 ilk deneme (#501) |
| `7ed1c0d7` | 21:37 | F8 düzeltmesi. Kullanıcının mesajı `$('Girdiyi doğrula').first().json.chatInput` üzerinden try/catch içinde okunur. Mesajda `sigorta`, `teminat`, `teklif`, `poliçe` ya da `muafiyet` kelime başında geçiyorsa, ya da `prim` tek başına veya izin verilen eklerle geçiyorsa, araç çağrılmasa da disclaimer eklenir ("primitif" ve "primer" eşleşmez). Mesaj okunamazsa eski davranış sürer. | F8 (#502) |

`831a7987`'den sonraki sürümlerde (`faca77f7`, `400e98ef`, `7ed1c0d7`) yalnızca "Yanıtı tamamla" Code düğümünün `jsCode` alanı değişti. Prompt, diğer düğümler ve bağlantılar aynı kaldı (`831a7987` → `7ed1c0d7` sürüm farkıyla doğrulandı). Prim ve tutar doğrulama mantığı (`primGecerliMi`, izin listesi, `satiriTemizle`) hiçbir sürümde değişmedi.

Bu sürümlerde eklenen iz alanları: `sigortaCagrilari`, `sigortaMetniEklendi`, `sigortaOkunamadi`, `modelMetniAtildi`, `sigortaCeliskiliYanit`, `bosKaynakBasligiKaldirildi`, `kullaniciSigortaTalebi`.

### Test sonuçları

"n8n statüsü" sütunu yalnızca workflow'un teknik olarak hatasız tamamlandığını gösterir; içerik testinin geçtiği anlamına gelmez. n8n'de bu workflow için 16 çalışma kaydı var (#480–#502), hepsi `success`. Bunlardan 15'i geçerli senaryo çalışmasıdır ve aşağıdaki tabloda yer alır. #482 ise yanlış uzunlukla gönderilmiş geçersiz bir denemedir; test sayımına dahil edilmedi. İçerik sonucu çalışma kaydındaki yanıt metni ve iz alanları incelenerek verildi.

| # | Çalışma | Oturum | Sürüm | n8n statüsü | İçerik sonucu |
| --- | --- | --- | --- | --- | --- |
| F9a | #480 | — | `6a6be774` | success | Geçti. 400 düğümü çalıştı, model çağrılmadı. |
| F9b | #481 | — | `6a6be774` | success | Geçti. 400 düğümü çalıştı, model çağrılmadı. |
| F9c | #483 | — | `6a6be774` | success | Geçti. 400 düğümü çalıştı, model çağrılmadı. |
| F1 | #484 | final-test-s1 | `6a6be774` | success | Geçti. Gözlem: "tercih edilir" ifadesi "kullanın" diye kesinleştirildi (T14'e benzer). |
| F2 | #485 | final-test-s1 | `6a6be774` | success | **Başarısız:** Prim Hesapla alt workflow'u yayınlanmamıştı. |
| F2 | #486 | final-test-s1b | `831a7987` | success | Geçti: 840,00 / 33,60. |
| F3 | #488 | final-test-s1b | `831a7987` | success | Geçti. Hafızadan "2 Luna Seramik Kupa" geldi; araç çağrılmadı, tutar yazılmadı. |
| F4 | #489 | final-test-s2 | `831a7987` | success | Geçti: 870,00 / 15,00 + "Bu ürün şu anda stokta yok." + disclaimer. |
| F5 | #491 | final-test-s2 | `831a7987` | success | Geçti: `limit_exceeded`, prim yok, 5.040,00 / 5.000,00. |
| F6 | #493 | final-test-s3 | `831a7987` | success | **Başarısız:** disclaimer eksikti, şartlar kısaltılmıştı. |
| F6 | #495 | final-test-s3b | `faca77f7` | success | Geçti. |
| F7 | #497 | final-test-s4 | `faca77f7` | success | **Başarısız:** Sigorta Şartları alt workflow'u "doğal afetler kapsam dışıdır" diye dayanaksız bir hüküm üretti. |
| F7 | #499 | final-test-s4b | `400e98ef` | success | Geçti: sabit tarafsız metne düştü (yalnızca B kuralı yakaladı). |
| F8 | #501 | final-test-s5 | `400e98ef` | success | **Kısmen başarısız:** disclaimer yoktu. |
| F8 | #502 | final-test-s6 | `7ed1c0d7` | success | Geçti: `kullaniciSigortaTalebi: true`, disclaimer bir kez, tutar yok. Prim Hesapla çağrılmadı; "katalogda yok" cevabını model kendisi verdi. |

#482 (F9c'nin ilk denemesi) yanlış uzunlukla gönderildiği için tabloya alınmadı ve sonuç olarak sayılmadı.

### Plandan sapmalar

- **F3'ün mesajı farklı:** Test, plandakinden farklı bir mesajla çalıştırıldı: "Bir önceki mesajda hangi ürün için kaç adet teklif hazırlamıştık?"
- **Oturumlar:** Düzeltmeden sonraki tekrarlar (F2, F6, F7, F8) yeni oturumlarla yapıldı. F3, F2'nin tekrarındaki oturumu (`final-test-s1b`) sürdürdü.
- **Tek çalıştırma kuralı:** Plan "her test bir kez" diyordu. Başarısız testler düzeltmeden sonra, kullanıcının onayıyla bir kez daha çalıştırıldı.
- **Son sürümde ilk turda tekrar yoktu:** F1–F5 ilk test turunda son sürümde (`7ed1c0d7`) n8n'de yeniden çalıştırılmamış, yalnızca yerel Node.js testleriyle doğrulanmıştı. O testlerin dosyaları geçici klasördeydi ve kalıcı olarak saklanmadı. Bu açık, aşağıdaki "Regresyon kontrolü" ile n8n üzerinde kapatıldı.
- **F3'ün beklenen davranışı değişti:** `7ed1c0d7`'den sonra geçmiş teklif sorusuna da disclaimer eklenir, çünkü mesajda "teklif" kelimesi geçiyor.
- **`intermediateSteps` biçimi:** F1'de prim aracı çağrılmadığı için prim aracının biçimi orada doğrulanamadı. Prim ve sigorta aracıyla ilgili gözlemler ayrı ayrı:
  - **Prim aracı:** F2 #486'da prim aracının `observation`'ı `{type:'text', text}` biçiminde gözlemlendi. Bu sarmal `831a7987`'de ele alınmıştı ve kod tutarları aracın sonucundan üretti.
  - **Sigorta aracı:** `intermediateSteps`'te sigorta aracının adı Türkçe karakterleri dönüştürülmüş olarak geliyor (`Sigorta_artlar_`). Bu ad `faca77f7`'den sonra F6 #495'te tanındı. Bu, araç adının tanınmasıyla ilgilidir; `intermediateStepsBicimi` iz alanını doğrulamaz.
- **§3'teki hafıza varsayımı yanlış çıktı;** düzeltme notu §3'te.

### Regresyon kontrolü (`7ed1c0d7`, 23.11.2026)

**Amaç:** F1–F5 ve F9a–c en son eski sürümlerde (`6a6be774`, `831a7987`) n8n üzerinde geçmişti. Ardından "Yanıtı tamamla" kodu üç kez değişti (`faca77f7`, `400e98ef`, `7ed1c0d7`). Bu kontrol, son sürümde bu davranışların bozulmadığını n8n üzerinde gösterir.

**Kapsam dışı:** F6–F8 ve Q8hr'nin yanıt kalitesi. F8 zaten `7ed1c0d7`'de geçmişti; F6 ve F7'de ise yalnızca disclaimer kuralı değişmişti.

**Ön kontrol (R0, salt okuma, eşleşmeyen bir şey çıkmadı):**
- Final asistan: sürüm `7ed1c0d7`, `active:false`, `activeVersionId:null`; 15 düğüm, bağlantılar planla aynı.
- Credential ID'leri: OpenAI `tW1U…` (model ve embedding), Redis `i40q…`, Qdrant `Fk5s…`. Değerler okunmadı.
- Alt workflow'lar: Prim Hesapla `14IYDf3MyS889v0b` ve Sigorta Şartları `Q8hrWLrDUCixAEfn` yayınlı. Kayıtlı ve yayınlanan sürümler aynı (`2eba8392` ve `5f9edfd1`).

**Çalıştırma:**
- Bütün testler `execute_workflow` ile elle (`manual`) çalıştırıldı: 23.11.2026 01:06–01:10 (Europe/Istanbul; n8n kaydında 22.11 22:06–22:10 UTC).
- "n8n statüsü" yalnızca workflow'un teknik olarak tamamlandığını gösterir. "Çalışan Respond" sütunu hangi Respond düğümünün çalıştığını gösterir ve HTTP ölçümü değildir. İçerik sonucu yanıt metni ve iz alanları incelenerek verildi.
- Testler bir kez çalıştırıldı; tekrar ve düzeltme yapılmadı.

| Test | Çalışma | Oturum | n8n statüsü | Çalışan Respond | İçerik sonucu |
| --- | --- | --- | --- | --- | --- |
| R1 (F1) | #503 | final-reg-s1 | success | Yanıt (200) | Geçti. Yalnızca Product Documents çağrıldı (`Product_Documents` → `urun`); kaynak satırı var; disclaimer yok (`sigortaKonusu: false`, `kullaniciSigortaTalebi: false`); tutar yok. |
| R2 (F2) | #504 (Prim Hesapla alt çalışması #505) | final-reg-s1 | success | Yanıt (200) | Geçti. Prim Hesapla `durum: "basarili"`; kodun özeti 840,00 / 33,60; başka tutar yok; disclaimer bir kez; `modelMetniAtildi: false` (Sigorta Şartları çağrılmadı). |
| R3 (F3) | #506 | final-reg-s1 | success | Yanıt (200) | Geçti. Hafızadan "2 adet Luna Seramik Kupa"; araç çağrılmadı; modelin ham yanıtında da tutar yoktu (`kaldirilanCumleler.sayi: 0`); disclaimer bir kez (`kullaniciSigortaTalebi: true`, yeni beklenen davranış). |
| R4 (F4) | #507 (alt #508) | final-reg-s2 | success | Yanıt (200) | Geçti. 870,00 / 15,00 + "Bu ürün şu anda stokta yok." + disclaimer bir kez. |
| R5 (F5) | #509 (alt #510) | final-reg-s2 | success | Yanıt (200) | Geçti. `limit_exceeded`; prim yok; 5.040,00 / 5.000,00 yalnızca kodun satırında; disclaimer bir kez. |
| R6a (F9a) | #511 | final-reg-f9 | success | Geçersiz girdi yanıtı (400) | Geçti. `gecerli: false`; AI Agent çalışmadı, model çağrılmadı. |
| R6b (F9b) | #512 | final-reg-f9 | success | Geçersiz girdi yanıtı (400) | Geçti. `gecerli: false`; AI Agent çalışmadı, model çağrılmadı. |
| R6c (F9c) | #513 | final-reg-f9 | success | Geçersiz girdi yanıtı (400) | Geçti. `gecerli: false`; AI Agent çalışmadı, model çağrılmadı. |

Alt çalışmalar #505, #508 ve #510, Prim Hesapla'nın `integrated` çalışmalarıdır; hepsi `success`. Bu aralıkta bunların dışında çalışma oluşmadı.

**Kabul ölçütü 1 (yalnızca n8n tarafı):** R1 → R2 → R3 aynı oturumda (`final-reg-s1`) çalıştı. Bakım → teklif → hafıza akışı son sürümde n8n üzerinde kesintisiz geçti (#503 → #504 → #506). Bu, ölçütün yalnızca n8n tarafını doğrular. Ölçütün kendisi BizCard üzerinden 3 kesintisiz prova ister. O provalar bu regresyon kontrolünden ayrıdır, henüz yapılmadı ve hâlâ gereklidir.

**R6 notları:**
- "Girdiyi doğrula" düğümü `831a7987` → `7ed1c0d7` sürüm farkında değişmemişti. R6, bu davranışı son sürümde n8n üzerinde ayrıca teyit eder.
- R6c girdisi, 10'ar karakterlik numaralı parçalardan oluşan 1001 karakterlik bir metindi; trim sonrası da 1001 karakter. Burada yalnızca kısaltılmış gösterimi var (`000aaaaaaa…099aaaaaaaX`); tam metin belgeye eklenmedi. Metin şu kuralla üretilir: `000`–`099` arası her sayı ve ardından 7 `a`, sonunda bir `X`.
- Uzunluğu ve Python ile üretilen metinle birebir aynı olduğu gönderimden önce doğrulandı. Elle yazılan ilk deneme 1081 karakter çıktığı için gönderilmedi; sayılmayan bir çalışma oluşmadı.

**Gözlemler (başarısızlık değil):**
- **R1, T14 benzeri:** Kaynaktaki "Alevi üfleyerek söndürmek … neden olabilir" ifadesi "alevi üfleyerek söndürmeyin" diye kesinleştirildi ve gerekçe düştü. "tercih edilir" bu kez korundu (#484'te "kullanın" olmuştu). Bağlamdaki iki madde atlandı ("araç içinde, kalorifer yanında…" ve "Sıcak balmumuna dokunmayın."). Uydurma yok. Kod model metnine dokunmadı (`modelMetniAtildi: false`).
- **R4:** Model, aracın döndürdüğü `deductibleRule` ve `claimNoticeDays` bilgisini metne ekledi ("en az 50 TL muafiyet…", "3 gün içinde"). Bilgi araç çıktısında var; "50 TL" izinli tutar olduğu için silinmedi.
- **Adet türü:** Model `quantity` değerini metin olarak gönderiyor ("2", "3", "12"); Prim Hesapla bunu sayıya çeviriyor.
- **İz alanı:** `intermediateStepsBicimi` R1–R5'in hepsinde sabit `'dogrulanmadi'` (backlog'da).
- **Yan etki:** Testler yalnızca Redis'te `atolyekart-final:final-reg-s1` ve `atolyekart-final:final-reg-s2` test anahtarlarını oluşturdu (TTL 7 gün). R6'da model çağrılmadığı için `final-reg-f9` hafızaya yazılmadı.

### Açık kalanlar

- Backlog maddeleri: `kapsam-ve-plan.md` bölüm 8, "5. aşama (final asistan) gözlemleri".
- Gerileme kontrolü (`7ed1c0d7`): ✅ 23.11.2026, R1–R6 geçti (yukarıdaki "Regresyon kontrolü").
- 6. aşamaya kalanlar:
  - Webhook Basic Auth.
  - Final asistanın yayınlanması.
  - `errorWorkflow` bağlanması (D): handler `IlJ0nrSuexnU4Wx4` yayınlanmadan bağlanamaz.
