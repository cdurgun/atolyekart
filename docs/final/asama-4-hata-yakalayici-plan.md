# 4. aşama planı: `hata-yakalayici` (Telegram kapalı)

> Hazırlandı: 22.11.2026. **Durum: A, B, C ve E uygulandı; testler H1–H6 geçti. D (`errorWorkflow` bağlama) 6. aşamada yapıldı (D4: ruOv ve jcH8 → IlJ0; 14IY bağlanmadı); uçtan uca deneme 7. aşamada geçti (`asama-7-hata-agi-plan.md`). Sonuç: bölüm 5.** Tasarım kaynağı: `yedekleme-ve-hata-bildirimi.md` bölüm 2. Önceki aşama: `asama-3-prim-hesapla-plan.md`.

## 0. Bağlam

- Final ödevinin hata ağı: retry + Respond to Webhook hata yanıtı + error workflow + bildirim. Bu aşama **error workflow + bildirim metni** kısmıdır; gerçek Telegram gönderimi 7. aşamada ayrı onayla yapılır.
- Canlı `Atolyekart-Error-Handler` (`LTWx3hv6EaaNCLeR`, Error Trigger → Code, bildirim göndermez) **değiştirilmez**. Final workflow'ları yeni handler'a bağlanır.
- `Telegram account` credential'ı (`telegramApi`) n8n'de mevcut. Chat ID'yi kullanıcı doğrudan n8n'e girer; depoya, rapora ya da sohbete yazılmaz.

## 1. Kararlar (22.11.2026)

1. **Test yöntemi:** MCP `test_workflow`. Error Trigger örnek hata verisiyle sabitlenir (pin); Code node gerçekten çalışır. MCP Error Trigger'lı workflow'u doğrudan çalıştıramaz.
2. **Bildirim sınırı** (aynı workflow için 10 dakikada en fazla 1 mesaj): kodda kalır. Workflow static data yalnızca production çalışmalarında kaydedildiği için tekrar engeli 7. aşamanın uçtan uca testinde doğrulanır; şimdi yalnızca "ilk bildirim geçer" yolu görülür.
3. **`errorWorkflow` bağlama:** `atolyekart-final-prim-hesapla-test` (`14IYDf3MyS889v0b`) ve `atolyekart-final-yedekleme-test` (`jcH8s8nGulXET3bj`). 2. aşama workflow'larına dokunulmaz. (Adım D; **ertelendi**, bkz. bölüm 5.)
4. **Telegram node'u:** eklenir ama devre dışı; credential bağlı, chat ID boş.

Tasarımdan sapmalar:

- Mesaj taslağındaki "Yeniden deneme: 3/3 tükendi" satırı **çıkarıldı**: Error Trigger verisi deneme sayısını içermez.
- Telegram node'unda düz metin seçeneği yoktur (`parse_mode` HTML / Markdown / MarkdownV2; varsayılan HTML). Mesaj HTML modunda gönderilir; Code node `&`, `<`, `>` karakterlerini kaçışlar. "This message was sent automatically with n8n" eki kapatılır, link önizlemesi kapalıdır.

## 2. Workflow: `atolyekart-final-hata-yakalayici-test` (`active:false`, yayınlanmaz)

```
Error Trigger → Code "Hata mesajını kur" → Telegram "Telegram'a gönder" (DEVRE DIŞI)
```

Code node:

- Normal hatada `execution` (id, mode, lastNodeExecuted, error.message), tetikleyici hatasında `trigger` (error.message, error.node.name) okunur. Eksik alan "Bilinmiyor" olur; workflow çökmez.
- Yalnızca hata mesajı (`error.message`) kullanılır; girdi gövdesi, `chatInput`, stack trace okunmaz.
- Hata metninde gizleme: adres (URL, IP, alan adı, `ad:port`, `localhost`) → `[adres]`, e-posta → `[e-posta]`, harf ve rakam içeren 24+ karakterlik dizi → `[gizli]`, telefon benzeri numara → `[numara]` (anahtar kuralı telefon kuralından önce çalışır). Alan adı kuralı yaygın uzantıları, `local` / `internal` / `lan` / `home` ve iki harfli ülke uzantılarını kapsar; `js`, `ts`, `py`, `md`, `sh`, `go`, `rb` dosya uzantıları hariçtir. Hata metni 200, mesajın tamamı 600 karakterde kesilir.
- Bildirim sınırı: static data'da workflow başına son bildirim zamanı; 10 dakika dolmadıysa çıktı boştur (Telegram çalışmaz).
- Çıktı: `{ mesaj, mesajTelegram, workflowAdi, calisma, adim, zaman }`. `mesaj` düz metin; `mesajTelegram` HTML kaçışlı.

Mesaj biçimi:

```
AtölyeKart — workflow hatası
Workflow : atolyekart-final-asistan
Çalışma  : #1234 (mod: webhook)
Adım     : Product Documents
Hata     : Request failed with status code 503
Zaman    : 22.11.2026 14:05 (İstanbul)
```

Tetikleyici hatasında Çalışma satırı `— (tetikleyici hatası)` olur.

Ayarlar: `executionOrder v1`, `Europe/Istanbul`, `saveManualExecutions: true`. Handler'ın kendisinde `errorWorkflow` yoktur (hata döngüsü olmasın).

## 3. Testler (`test_workflow`, her biri bir kez; maliyet yok, mesaj gönderilmez)

| # | Sabitlenen hata | Beklenen |
| --- | --- | --- |
| H1 | Webhook modunda `Product Documents` adımında 503 | Mesaj bölüm 2'deki biçimde |
| H2 | Hata metninde adres, e-posta, telefon ve uzun anahtar; 300+ karakter | Hepsi maskeli; hata satırı ≤ 200 karakter |
| H3 | Tetikleyici hatası (`execution` yok, `trigger` var) | Çalışma `— (tetikleyici hatası)`; çökme yok |
| H4 | Boş veri | Alanlar "Bilinmiyor"; çökme yok |
| H5 | `n8n.local`, `qdrant:6333`, `ornek.de:443`, `localhost:5678`, `redis.internal`, `index.js`, `$json.body.productId` (maskeleme düzeltmesinden sonra eklendi) | Adresler maskeli; dosya adı ve ifade yolu korunur |
| H6 | Adım adında ve hata metninde `<`, `>`, `&` | `mesajTelegram` HTML kaçışlı; `mesaj` ham |

Telegram node'u devre dışıdır; ayrıca `test_workflow` credential kullanan node'ları sabitler. Gerçek gönderim yoktur.

## 4. Sınırlar

- Canlı workflow'lar (`Atolyekart-Error-Handler` dahil), 2. aşama workflow'ları, kaynak `8b8fa1d4`, Qdrant koleksiyonları ve Products tablosu değiştirilmez.
- Yayınlama/aktif etme, commit, push, deploy yok. Telegram ya da e-posta gönderimi yok. Sır ve chat ID yazdırılmaz; `.env.local` açılmaz.
- Test başarısız olursa yeniden çalıştırma ya da otomatik düzeltme yok; sonuç ve olası neden raporlanır.

## 5. Uygulama sonucu (22.11.2026)

### Workflow

`atolyekart-final-hata-yakalayici-test` — `IlJ0nrSuexnU4Wx4`, son sürüm `53b87907`, `active:false`, yayınlanmadı.

- Hata tetikleyici (Error Trigger v1) → Hata mesajını kur (Code v2, `runOnceForAllItems`) → Telegram'a gönder (Telegram v1.2, `disabled:true`, chat ID boş, `Telegram account` credential'ı bağlı, HTML, imza ve link önizlemesi kapalı).
- Ayarlar: `executionOrder v1`, `Europe/Istanbul`, `saveManualExecutions: true`; `errorWorkflow` yok.
- Sürümler: `42f8c151` (ilk sürüm + Telegram devre dışı + ayarlar) → `53b87907` (maskeleme genişletildi: genel alan adı, `ad:port`, `localhost`).
- Yükleme öncesi yerel ön kontrolde bulunan hata: telefon kuralı anahtar kuralından önce çalıştığı için örnek anahtarın baş ve sonu açıkta kalıyordu. Sıra değiştirildi; n8n'e düzeltilmiş kod yüklendi.

### Test sonuçları (`test_workflow`, Error Trigger sabitlenerek, her biri bir kez)

| # | Sürüm | Çalışma | Sonuç |
| --- | --- | --- | --- |
| H1 | `42f8c151` | #473 | Geçti: mesaj bölüm 2'deki biçimle aynı |
| H2 | `42f8c151` | #474 | Geçti: adres, IP:port, alan adı, e-posta, telefon, anahtar maskeli; hata satırı 200 karakter |
| H3 | `42f8c151` | #475 | Geçti: `— (tetikleyici hatası)`, çökme yok |
| H4 | `42f8c151` | #476 | Geçti: dört alan "Bilinmiyor" |
| H5 | `53b87907` | #477 | Geçti: 5 adres maskeli; `index.js`, `$json.body.productId`, "status code 503" korundu |
| H2 (gerileme) | `53b87907` | #478 | Geçti: çıktı #474 ile aynı |
| H6 | `53b87907` | #479 | Geçti: `&lt;`, `&gt;`, `&amp;` doğru; çift kaçış yok; adım adı da kaçışlı |

- Telegram node'u hiçbir çalışmada API'ye gitmedi: çıktısı Code çıktısıyla aynı, süresi 0–1 ms (devre dışı node girdiyi geçirir). Gerçek mesaj gönderilmedi.
- H1, H3, H4 yeni sürümde n8n'de yeniden çalıştırılmadı (hata metinlerinde adres yok); yerel ön kontrolde sonuçları değişmedi.

### D ertelendi

`errorWorkflow` bağlama (`14IYDf3MyS889v0b`, `jcH8s8nGulXET3bj`) n8n tarafından reddedildi: **error workflow olarak bağlanacak workflow'un yayınlanmış bir sürümü olmalı.** Hiçbir workflow değişmedi. Handler'ı şimdi yayınlamak "yayınlama yok" kuralına aykırı olduğu için bağlama, final workflow'larının yayınlandığı 6. aşamaya (uçtan uca deneme 7. aşama) ertelendi. Şu an yayınlanmış bir final workflow'u olmadığı için ertelemenin pratik kaybı yok. `asama-3-prim-hesapla-plan.md` bölüm 2'deki "`errorWorkflow` 4. aşamada bağlanır" ifadesi bu nedenle güncel değildir.

### 7. aşamaya kalanlar

> **Güncelleme (24.11.2026):** 7. aşamanın sonuçları `asama-7-hata-agi-plan.md` dosyasında.

- 10 dakikalık bildirim sınırı (static data yalnızca production çalışmalarında kaydedilir). **✅ 7. aşama: #518 zamanı yazdı, #520 boş çıktı verdi.**
- Gerçek Error Trigger verisinin alanları (testlerde elle yazılmış örnek veri kullanıldı). **✅ 7. aşama: #518'de tüm alanlar dolu.**
- Zaman satırı hatanın değil mesajın oluştuğu anı gösterir (Error Trigger verisinde hata zamanı yok); fark birkaç saniye.
- Gerçek Telegram gönderimi: kullanıcı chat ID'yi n8n'e girer, node ayrı onayla etkinleştirilir. **Açık: karar bekliyor.**
- Maskeleme sezgiseldir: listede olmayan uzun uzantılar (ör. `.example`) ve port'suz tek kelimelik servis adları maskelenmez.
