# 3. aşama planı: `prim-hesapla` alt workflow'u

> Hazırlandı: 22.11.2026. **Durum: uygulandı ve test edildi (22.11.2026); iki workflow `active:false`, yayınlanmadı. Sonuç: bölüm 7.** Yeni oturumda bu dosya verilerek başlanır. Kaynak tarife: `sigorta-tarife-taslagi.md` (değerler onaylı). Genel plan ve backlog: `kapsam-ve-plan.md`.
>
> **Güncel durum (24.11.2026):** 14IY (`14IY…`) 5. aşamada kullanıcı onayıyla yayınlandı (`2eba8392`); adı `atolyekart-final-prim-hesapla-test` olarak kaldı (`isimlendirme-standardi.md`). Çağırıcı `I8sS…` yayınlanmadı. **14IY'nin `errorWorkflow` ayarı yoktur:** 4. aşamada yapılan bağlama denemesini n8n reddetti, 6. aşamada da bilerek bağlanmadı (6. aşama planı, bölüm 5, karar 2). Bu nedenle aşağıdaki "4. aşamada bağlanır" ifadesi gerçekleşmemiş bir plandır.

## 0. Yeni oturum için bağlam

- Final ödevi (son teslim 3.12.2026): Webhook, AI adımı, RAG, Memory, hata ağı (yakala + bildir + retry) ve bir sektöre özel özellik. BizCard kapsam dışı.
- Sektöre özel özellik: **kargo sigortası demo teklifi** = sigorta şartları RAG'ı + **deterministik prim hesabı**. Prim yalnızca kodla hesaplanır; AI hesap yapmaz.
- Aşamalar: 1 yedekleme (tamam), **2 sigorta şartları alt workflow'u (kapatıldı)**, **3 prim-hesapla (bu plan)**, 4 hata yakalayıcı (Telegram kapalı), 5 final asistan, 6 yerel uçtan uca + yayınlama, 7 hata ağı uçtan uca, 8 doküman + commit, 9 prova + video. Her aşama ve her uygulama adımı ayrı onayla yapılır.

### 2. aşamanın sonucu (değiştirilmez)

| Workflow | ID | Durum |
| --- | --- | --- |
| `atolyekart-final-sigorta-sartlari-test` (alt workflow) | `Q8hr…` | Son sürüm `5f9edfd1`; `active:false`, yayınlanmadı |
| `atolyekart-final-sigorta-sartlari-cagri-test` (çağırıcı) | `Pt4W…` | `active:false`, yayınlanmadı |
| Kaynak `atolyekart-final-sigorta-asistan-test` | `kpYB…` | `8b8fa1d4` sürümünde korunuyor |

- Sözleşme: girdi `{ soru }` → `{ ok, yanit, yanitGovdesi, kaynakSatiri, kaynakBolumler, kaynakDokuman, modelDisclaimerYazdi, modelBolumAtfiTemizlendi, kalanBolumAtfi, girisDuzeltildi, icEtiketTemizlendi }`; geçersiz soruda `{ ok:false, reason:'invalid_question' }`. Disclaimer eklemez (final asistan ekler).
- Test sonuçları: T4 geçti (#435/#436), T3 geçti (#453/#454), T1 kabul edildi (#449/#450), T2 kabul edildi (#455/#456). Kalan model kusurları `kapsam-ve-plan.md` bölüm 8'de.
- Öğrenilenler: taslak (yayınlanmamış) alt workflow, çağırıcıdan elle çalıştırmada çağrılabiliyor. MCP `execute_workflow` Execute Workflow Trigger'ı doğrudan çalıştıramıyor; test çağırıcı Webhook workflow'u üzerinden yapılıyor.

## 1. Amaç

Ürün ve adetten **deterministik** demo prim teklifini hesaplayan, LLM/Qdrant/dış servis kullanmayan bir alt workflow. 5. aşamada final asistanın "Prim Hesapla" aracı olarak bağlanacak.

## 2. Oluşturulacaklar (yayınlanmadan, `active:false`)

| Workflow | Görev |
| --- | --- |
| `atolyekart-final-prim-hesapla-test` | Alt workflow: Execute Workflow Trigger → doğrulama ve hesap (tek Code node) → çıktı |
| `atolyekart-final-prim-hesapla-cagri-test` | Çağırıcı test: Webhook (POST, `body.productId`, `body.quantity`) → Execute Workflow → sonucu döndürür |

Ayarlar: `executionOrder v1`, `Europe/Istanbul`, `callerPolicy: workflowsFromSameOwner` (alt workflow), `saveManualExecutions: true`. `errorWorkflow`'un 4. aşamada bağlanması planlanmıştı; bağlanmadı ve 14IY'de bugün de `errorWorkflow` yoktur (bkz. başlıktaki güncel durum). Credential yok.

## 3. Girdi ve çıktı sözleşmesi

Girdi (Execute Workflow Trigger, `workflowInputs`): `productId` (string), `quantity` (number).

Katalog sabitleri Code node içinde (Products tablosu kullanılmaz; `server/lib/catalog.js` ve `src/products.js` ile aynı):

| productId | Ad | Kategori | Fiyat | Stok |
| --- | --- | --- | --- | --- |
| `luna-seramik-kupa` | Luna Seramik Kupa | Seramik | 420 | var |
| `amber-soya-mum` | Amber Soya Mum | Doğal Mumlar | 350 | var |
| `terra-minimal-kolye` | Terra Minimal Kolye | El Yapımı Aksesuarlar | 290 | yok |

Hesap (tarife bölüm 2): `insuredValue = fiyat × adet`; `insuredValue > 5000` → teklif yok; `premium = max(15, yuvarla(insuredValue × oran, 2))`; oranlar Seramik %4,0, Doğal Mumlar %2,5, El Yapımı Aksesuarlar %1,5. Kuruş hatasına karşı tamsayı kuruşla hesaplanır.

Başarılı çıktı (oran ve ara hesap **dönmez**):

```json
{ "ok": true, "productId": "luna-seramik-kupa", "productName": "Luna Seramik Kupa", "category": "Seramik",
  "inStock": true, "quantity": 2, "insuredValue": 840, "premium": 33.6,
  "deductibleRule": "Hesaplanan zarar tutarının %10'u, en az 50 TL (hasar ve kayıpta)",
  "claimNoticeDays": 3, "currency": "TRY", "taxIncluded": false }
```

Hata çıktısı (araç hata fırlatmaz; ajan nedeni okuyabilsin): `{ "ok": false, "reason": "unknown_product" | "invalid_quantity" | "limit_exceeded", "mesaj": "…" }`. `limit_exceeded` ayrıca `insuredValue` ve `maxInsuredValue: 5000` döndürür.

Doğrulama: `productId` katalogda olmalı; `quantity` 1–12 arası **tam sayı** olmalı (string "2" kabul edilir mi? → karar 2).

## 4. Testler (tarife bölüm 4; maliyet yok)

| # | Girdi | Beklenen |
| --- | --- | --- |
| P1 | `luna-seramik-kupa`, 2 | `ok:true`, 840, **33,60** |
| P2 | `amber-soya-mum`, 1 | `ok:true`, 350, **15,00** (8,75 < en az prim) |
| P3 | `terra-minimal-kolye`, 3 | `ok:true`, 870, **15,00**, `inStock:false` |
| P4 | `luna-seramik-kupa`, 12 | `ok:false`, `limit_exceeded` (5.040 TL) |
| P5 | `luna-seramik-kupa`, 11 | `ok:true`, 4.620, **184,80** |
| P6 | `bilinmeyen-urun`, 1 | `ok:false`, `unknown_product` |
| P7a / P7b | `luna-seramik-kupa`, 0 / 13 | `ok:false`, `invalid_quantity` |

Yöntem: önce oluşturma ve yapı doğrulaması (çalıştırmadan); sonra ayrı onayla P1–P7 çağırıcı üzerinden birer kez. Ek olarak hesap mantığı yerelde `node:test` ile denenebilir (karar 3).

Başarı ölçütleri: 8 çalıştırmanın hepsi beklenen değeri verir; çıktıda oran yok; iki workflow `active:false`; 2. aşama workflow'ları, canlı workflow'lar ve Qdrant değişmemiş.

## 5. Açık kararlar (yeni oturumda sorulacak)

1. **Disclaimer alanı:** tarife bölüm 5 çıktıda `disclaimer` öneriyor; 2. aşamada sigorta şartları aracı disclaimer döndürmüyor ve final asistandaki Code node tek kez ekliyor. Öneri: tutarlılık için `prim-hesapla` da döndürmesin.
2. **`quantity` türü:** Agent sayıyı string verebilir. Öneri: `"2"` gibi tam sayı metnini kabul et, `2.5` / `"iki"` reddet.
3. **Yerel birim testi:** hesap fonksiyonu için repoda `node:test` dosyası eklensin mi (yeni dosya; commit 8. aşamada)? Öneri: n8n testleri yeterli, ek dosya yok.
4. **Katalog eşleşmesi:** fiyatlar `src/products.js`'te metin ("420 TL"). Alt workflow sabit taşıdığı için fiyat değişirse iki yer güncellenir; bu bilinen risk olarak `kapsam-ve-plan.md` risklerine yazılsın mı?

## 6. Sınırlar

- Canlı workflow'lar, 2. aşama workflow'ları, kaynak `8b8fa1d4`, Qdrant koleksiyonları, Products tablosu değiştirilmez.
- Yayınlama/aktif etme, commit, push, deploy yok. Sır yazdırılmaz; `.env.local` açılmaz.
- Sipariş, stok bildirimi, poliçe, Telegram/e-posta gönderimi yok.
- Test başarısız olursa yeniden çalıştırma ya da otomatik düzeltme yok; sonuç ve olası neden raporlanır.

## 7. Uygulama sonucu (22.11.2026)

### Kararlar (bölüm 5)

1. Disclaimer: **dönmez**; final asistandaki Code node tek kez ekler.
2. `quantity`: tam sayı ya da yalnızca rakamlardan oluşan metin (`"2"`) kabul edilir; `2.5`, `"iki"` ve boş değer `invalid_quantity` döner.
3. Yerel `node:test` dosyası: **eklenmedi**; n8n testleri yeterli sayıldı.
4. Katalog eşleşmesi riski `kapsam-ve-plan.md` bölüm 7'ye yazıldı.

Ek olarak belirlenenler: doğrulama sırası `unknown_product` → `invalid_quantity` → `limit_exceeded`; yuvarlama tamsayı kuruşla, yarım kuruşta yukarı (bugünkü fiyat ve oranlarla bütün sonuçlar tam kuruş çıkar, yuvarlama devreye girmez).

### Oluşturulan workflow'lar

| Workflow | ID | Sürüm | Yapı |
| --- | --- | --- | --- |
| `atolyekart-final-prim-hesapla-test` | `14IY…` | `2eba8392` | Execute Workflow Trigger v1.3 (`productId: string`, `quantity: any`) → Code v2 "Prim hesapla" (`runOnceForEachItem`) |
| `atolyekart-final-prim-hesapla-cagri-test` | `I8sS…` | `60f4caf6` | Webhook v2.2 (POST, `lastNode`, `firstEntryJson`) → Execute Workflow v1.4 (`waitForSubWorkflow`, `attemptToConvertTypes:false`) |

- Ayarlar: ikisinde `executionOrder v1`, `Europe/Istanbul`, `saveManualExecutions: true`; alt workflow'da ayrıca `callerPolicy: workflowsFromSameOwner`. Credential ve `errorWorkflow` yok. Ayarlar SDK'da olmadığı için oluşturmadan hemen sonra `setWorkflowSettings` ile verildi (her workflow'un geçmişinde iki sürüm var).
- `quantity` girdisi `any` türündedir; böylece n8n değeri kendisi dönüştürmez, karar 2'yi Code node uygular.
- Code node'da oranlar baz puan olarak (400 / 250 / 150) yalnızca node içinde kullanılır. Başarılı çıktı: `ok, productId, productName, category, inStock, quantity, insuredValue, premium, deductibleRule, claimNoticeDays, currency, taxIncluded`. **`rate`, ara hesap ve `disclaimer` dönmez.**

### Test sonuçları (çağırıcı Webhook üzerinden, `manual`, her biri bir kez)

| # | Girdi | Bedel (`insuredValue`) | Prim (`premium`) | Sonuç | Çalışma (çağırıcı / alt) |
| --- | --- | --- | --- | --- | --- |
| P1 | `luna-seramik-kupa`, 2 | 840 | 33,60 | geçti | #457 / #458 |
| P2 | `amber-soya-mum`, 1 | 350 | 15,00 | geçti | #459 / #460 |
| P3 | `terra-minimal-kolye`, 3 | 870 | 15,00, `inStock:false` | geçti | #461 / #462 |
| P4 | `luna-seramik-kupa`, 12 | 5.040 (azami 5.000) | — `limit_exceeded` | geçti | #463 / #464 |
| P5 | `luna-seramik-kupa`, 11 | 4.620 | 184,80 | geçti | #465 / #466 |
| P6 | `bilinmeyen-urun`, 1 | — | — `unknown_product` | geçti | #467 / #468 |
| P7a | `luna-seramik-kupa`, 0 | — | — `invalid_quantity` | geçti | #469 / #470 |
| P7b | `luna-seramik-kupa`, 13 | — | — `invalid_quantity` | geçti | #471 / #472 |

- 8/8 geçti; hiçbir test yeniden çalıştırılmadı. Hiçbir çıktıda `rate` yok.
- Tutarlar JSON'da sayı olarak döner (`33.6`, `15`); "33,60 TL" biçimi 5. aşamada final asistanın işidir.
- Değişmeyenler: canlı workflow'lar, 2. aşama workflow'ları (`Q8hr…`, `Pt4W…`; yalnızca okundu), kaynak `8b8fa1d4`, Qdrant koleksiyonları, Products tablosu. Sipariş, stok bildirimi, poliçe, Telegram ya da e-posta gönderimi yapılmadı.
- Çağırıcı Webhook'unda kimlik doğrulama yok (2. aşamadaki çağırıcıyla aynı); workflow aktif olmadığı için production adresi çalışmaz.
- Gerçek bir sigorta projesinde bu hesabın nerede yapılacağına dair notlar: `docs/gelecek/gercek-sigorta-projesi-n8n.md`.
