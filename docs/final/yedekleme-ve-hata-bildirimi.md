# Otomatik yedekleme ve hata bildirimi: tasarım (TASLAK)

Durum 23.11.2026: 1. bölüm uygulandı ve doğrulandı (`atolyekart-final-yedekleme-test`, `jcH8s8nGulXET3bj`, yayınlanmadı; sonuç: bölüm 1 sonundaki "Uygulama sonucu"). 2. bölüm 4. aşamada uygulandı (`atolyekart-final-hata-yakalayici-test`, `IlJ0nrSuexnU4Wx4`; ayrıntı `asama-4-hata-yakalayici-plan.md`). Telegram mesajı gönderilmedi; hiçbir canlı workflow değişmedi.

**Güncelleme (24.11.2026):** 6. aşamada `-test` ekleri kaldırıldı: `atolyekart-final-yedekleme` (yayınlanmadı) ve `atolyekart-final-hata-yakalayici` (yayında, `53b87907`). jcH8'in `errorWorkflow`'u IlJ0'a bağlandı (D4). Hata ağı 7. aşamada uçtan uca doğrulandı (`asama-7-hata-agi-plan.md`). Telegram gönderimi hâlâ kapalı.

## 1. `atolyekart-final-yedekleme`

**Amaç:** Tüm workflow'ların JSON halini düzenli olarak Google Drive'daki özel bir klasöre koymak (Ders 12 DoD: "Otomatik yedekleme workflow'unu kurdum", "ilk yedeği Drive'a düşür").

```
Schedule Trigger (her gün 03:00, Europe/Istanbul)
 └─┐
Manual Trigger (ilk yedek ve demo için) ─┤
                                        ▼
n8n node: Workflow → Get Many (credential: n8n API, "Return All")
        ▼
Code: tek bir yedek nesnesi kur
   { createdAt, n8nWorkflowCount, workflows: [ { id, name, active, versionId, activeVersionId,
     updatedAt, settings, nodes, connections } ] }   ← pinData, staticData ALINMAZ
        ▼
Convert to File (JSON) → dosya adı: n8n-yedek-YYYY-MM-DD-HHmm.json
        ▼
Google Drive: Upload → klasör "AtolyeKart n8n Yedekleri"
        ▼
(settings.errorWorkflow = atolyekart-final-hata-yakalayici)
```

Kararlar:

- **Tek dosya**: geri yükleme ve kontrol kolay; 24 workflow birkaç yüz KB tutar.
- **pinData ve staticData alınmaz**: pinData'da test siparişlerinin ad/telefon/e-posta bilgisi bulunabilir; yedeğe kişisel veri girmesin.
- **Credential değerleri yedekte yoktur**: n8n workflow JSON'u credential'ı yalnızca ad ve kimlikle gösterir. Ancak webhook yolları, sistem prompt'ları ve Code node'ları yedekte vardır; Drive klasörü yalnızca kullanıcıya açık tutulur, paylaşılmaz.
- **Eski yedekler silinmez**: final süresince dosya sayısı küçük kalır; otomatik silme hata riskini artırır.
- **Retry**: n8n API ve Google Drive node'larında `retryOnFail`, 3 deneme, 5 sn bekleme.
- **Doğrulama**: ilk elle çalıştırmadan sonra Drive'daki dosyanın boyutu ve içindeki workflow sayısı, REST listesi (`scripts/n8n-workflow-listesi.mjs`) ile karşılaştırılır.

Kullanıcıdan gerekenler:

1. n8n'de **Google Drive OAuth2 credential'ı** ekle (ad önerisi: `Google Drive account`). Mevcut Google Sheets OAuth istemcisi kullanılabilir; Google Cloud projesinde Drive API'nin açık olması gerekir. Değerler sohbete yazılmaz.
2. Drive'da **"AtolyeKart n8n Yedekleri"** klasörünü oluştur (ya da adını söyle).
3. **n8n API credential'ı:** n8n'de `n8n_prod_key` adlı bir n8nApi credential'ı var; hangi anahtarı kullandığını ve süresini bilmiyorum. `.env.local`'deki anahtar 28.11.2026'da doluyor. Yedekleme için **3.12.2026'dan sonra dolan** yeni bir anahtar oluşturup credential'a girmen önerilir.
   **Durum (23.11.2026):**
   - Yedekleme workflow'u `n8n API yedekleme` (`bT2d…`) credential'ını kullanıyor. n8n'de bunun adına ve son kullanım zamanına uyan anahtar `atolyekart-yedekleme`; bitişi 22.12.2026. Credential'ın gerçekten bu anahtarı taşıdığı ayrıca doğrulanmadı.
   - Kullanıcı, `.env.local`'deki anahtarın 28.11'de dolan `n8n_test2` olmadığını doğruladı. n8n'deki diğer anahtarlar 3.12'den sonra da geçerli.
   - Yeni anahtar oluşturulmadı.
4. Workflow'u oluşturma (yayınlanmamış `atolyekart-final-yedekleme-test`) ve ilk elle çalıştırma için onay. Zamanlanmış çalışma ancak yayınla (publish) başlar; o da ayrı onaydır.

### Uygulama sonucu (22–23.11.2026)

Workflow: `atolyekart-final-yedekleme-test` (`jcH8s8nGulXET3bj`), sürüm `fe196dd2`, `active:false`, yayınlanmadı. Credential'lar (ID ile, kısaltılmış): n8n API `bT2d…`, Google Drive `vHAF…`.

**Tasarımdan farklar:**
- Ayrı bir Manual Trigger yok; elle çalıştırma Schedule tetikleyicisi ("Her gün 03:00") üzerinden yapılıyor.
- `errorWorkflow` bağlı değil; 4. aşama D maddesiyle 6./7. aşamaya ertelendi. *(24.11.2026: 6. aşamada IlJ0'a bağlandı.)*
- Workflow yayınlanmadığı için günlük zamanlanmış çalışma yok.

**Tasarımın ötesinde eklenenler:**
- Yükleme öncesi gizli bilgi taraması: bulgu varsa yükleme yapılmaz.
- Yinelenen kimlik ve sayım kontrolleri.
- Yayınlanmış sürümün düğümleri de yedeğe alınır (`activeVersion`).

| Çalışma | Zaman (İstanbul) | n8n statüsü | Sonuç |
| --- | --- | --- | --- |
| #433 | 22.11.2026 18:47 | error | İlk deneme; hatanın nedeni bu belgede kayıtlı değil. |
| #434 | 22.11.2026 18:59 | success | `n8n-yedek-2026-11-22-1859.json`: 30 workflow, aktif 8, arşiv 2; n8n'e göre 302 kB, Drive'a göre 295 KB. |
| #514 | 23.11.2026 01:37 | success | `n8n-yedek-2026-11-23-0137.json`: 36 workflow, aktif 10, arşiv 2; n8n'e göre 392 kB, Drive'a göre 383 KB. Gizli bilgi taraması bulgu vermedi. |

**Doğrulama (kabul ölçütü 6):**
- #514'ten hemen önce REST script'i kullanıcının terminalinde çalıştırıldı: toplam 36, aktif 10, arşiv 2 (`isimlendirme-standardi.md` → "Kanıt").
- Yedekteki `n8nWorkflowCount` 36 ve yedekteki workflow sayısı 36; aktif ve arşiv sayıları REST listesiyle aynı. İki ölçüm arasında n8n'de workflow değişmedi.
- Kullanıcı Drive klasöründe iki dosyayı da gördü; eski yedek silinmemiş.
- Boyut farkı birimden kaynaklanıyor: n8n kB'yi 1000 bayt, Drive KB'yi 1024 bayt sayıyor.
- Drive dosya kimlikleri ve klasör kimliği belgeye yazılmadı.

## 2. `atolyekart-final-hata-yakalayici` (Telegram bildirimi)

**Amaç:** Hata ağının "bildirim" ayağını tamamlamak. Mevcut `Atolyekart-Error-Handler` değiştirilmez; final workflow'ları bu yeni handler'a bağlanır.

```
Error Trigger
   ▼
Code: mesajı kur (kişisel veri ve girdi gövdesi KONMAZ)
   ▼
Telegram: Send Message (credential: "Telegram account")
   - test kopyasında node DEVRE DIŞI; Code çıktısı gönderilecek metnin aynısıdır
```

**Hedef:** `Telegram account` credential'ındaki botla senin kişisel özel sohbetin (yalnızca sen). Bunun için:

- Bota Telegram'dan bir kez `/start` yazman,
- sohbet kimliğini (chat ID) bana değil, doğrudan n8n'deki Telegram node'una girmen gerekir. Chat ID gizli bir anahtar değildir ama kişisel veridir; depoya ve rapora yazılmaz.

**Mesaj taslağı** (düz metin, Markdown kapalı, en fazla ~600 karakter):

```
AtölyeKart — workflow hatası
Workflow : atolyekart-final-asistan
Çalışma  : #1234 (mod: webhook)
Adım     : Product Documents
Hata     : Request failed with status code 503
Zaman    : 22.11.2026 14:05 (İstanbul)
```

Not: İlk taslaktaki "Yeniden deneme: 3/3 tükendi" satırı çıkarıldı; Error Trigger verisi deneme sayısını içermez.

Kurallar: hata mesajı 200 karakterde kesilir; adres, anahtar, e-posta, telefon ve kullanıcı mesajı (`chatInput`) mesaja konmaz; aynı workflow için 10 dakikada en fazla 1 bildirim (Code node, workflow static data ile).

**Retry deseni** (final workflow'larında): OpenAI, Qdrant, Google Sheets/Drive ve HTTP node'larında `retryOnFail: true`, `maxTries: 3`, `waitBetweenTries: 2000`. Deneme biterse hata Error Trigger'a düşer ve bildirim gider. Ziyaretçiye yanıt veren dallarda ayrıca `Respond to Webhook` ile anlaşılır bir hata mesajı döner (sessiz ölüm yok).

**Test planı (gerçek mesaj göndermeden):**

1. `atolyekart-final-hata-yakalayici-test` oluşturulur, Telegram node devre dışı.
2. n8n'de error workflow yalnızca otomatik (tetiklenmiş) çalışmalardaki hatalarda devreye girer; editörde elle çalıştırılan bir workflow'un hatası handler'ı tetiklemez. Bu yüzden ilk test, handler'da Error Trigger'a sabitlenmiş (pin) örnek hata verisiyle yapılır; hiçbir workflow yayınlanmaz. Uçtan uca deneme (yayınlanmış bir workflow'da bilerek hata) ayrı onaya bağlıdır.
3. Code çıktısı yukarıdaki taslakla karşılaştırılır.
4. Gerçek gönderim, ayrı onayla Telegram node etkinleştirilerek yapılır.
