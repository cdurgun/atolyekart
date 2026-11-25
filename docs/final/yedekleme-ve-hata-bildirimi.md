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

Workflow: `atolyekart-final-yedekleme-test` (`jcH8s8nGulXET3bj`), sürüm `fe196dd2`, `active:false`, yayınlanmadı. *(25.11.2026: taslak `13ed8808`, hâlâ yayınlanmadı; aşağıda "Yedek içeriği ve repo güvenliği". #434 ve #514 `fe196dd2` koduyla alındı.)* Credential'lar (ID ile, kısaltılmış): n8n API `bT2d…`, Google Drive `vHAF…`.

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
- 25.11.2026: n8n'e yayınlanmamış iki test workflow'u eklendi; toplam 38 (`asama-7-hata-agi-plan.md` §8). #514'teki 36, 23.11 için geçerli. O tarihten sonra yedek alınmadı.

### Yedek içeriği ve repo güvenliği (25.11.2026)

- **Yedekler hassas kabul edilir.** Yedek dosyası credential değerlerini içermez; ama credential kimliklerini ve adlarını, webhook yollarını ve düğüm parametrelerini içerir. Drive klasörü paylaşıma açılmaz; yedek dosyaları halka açık depoya konmaz. Klasörün paylaşım durumunu kullanıcı arayüzden kontrol edecekti; sonucu bu belgede kayıtlı değil.
- **Chat ID gizleme (jcH8 taslağı `13ed8808`, yayınlanmadı):** Gizli bilgi taraması Telegram chat ID'sini yakalamıyordu: anahtar adı taranan listede yok, sayısal değer de kalıplara uymuyor. Yeni kodda Telegram düğümlerindeki dolu `chatId` değeri yedekte `[GİZLENDİ]` ile değiştirilir (taslak ve yayındaki sürümün düğümleri). Yedeğe `redacted` sayaçları eklenir; "Sonuç özeti" bu sayıları gösterir. Değişen yalnızca iki Code düğümü (n8n sürüm karşılaştırması `fe196dd2` → `13ed8808`). Geri yüklemede chat ID elle yeniden girilir.
- **Doğrulama:** Yalnızca yerelde yapıldı: gerçek workflow listesi ve sahte bir chat ID ile; n8n çalıştırması ve Drive'a yazma yok. Sahte değer çıktıda bulunmadı. Gerçek bir elle yedek henüz alınmadı; Drive'daki dosyada doğrulanmadı.
- **Sınırlar:** Yalnızca chat ID gizlenir. Chat ID, n8n'deki workflow sürüm geçmişinde kalır; Telegram yanıtı da çalışma kayıtlarında chat bilgisi taşıyabilir.
- **Repo güvenliği:** `.gitignore`'a `atolyekart-final-*.json`, `n8n-yedek-*.json` ve `*.n8n.json` kalıpları eklendi. Bu not yazıldığında (25.11.2026) kural çalışma kopyasında uygulanmıştı ama henüz commit edilmemişti. Kural yalnızca bu adlarla kaydedilen dosyaları korur; dışa aktarılan workflow JSON'ları ve yedek dosyaları depo klasörüne indirilmez.

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

### T1: Telegram bağlantı testi (25.11.2026)

**Amaç:** Bot, credential ve chat ID'yi canlı IlJ0'a dokunmadan doğrulamak. IlJ0'ın kopyası alınmadı; mesajın hata verisine bağlı olmaması için ayrı ve iki düğümlü bir test workflow'u kuruldu.

| Adım | Sonuç |
| --- | --- |
| Kurulum (Claude, kullanıcı onayıyla) | `atolyekart-final-telegram-test` (`M8TdawbecXcQW08v`): Manual Trigger → Telegram v1.2 `sendMessage`. Sabit metin: "AtölyeKart final – Telegram bağlantı testi. Bu bir test mesajıdır; işlem gerekmez." HTML, n8n imzası ve bağlantı önizlemesi kapalı (IlJ0 ile aynı). Credential IlJ0'daki ile aynı (yerel karşılaştırma; ID yazılmadı). `errorWorkflow` yok; hiçbir workflow çağırmıyor; yayınlanmadı. Elle çalıştırma kaydı kapalı (`saveManualExecutions: false`). |
| Chat ID (kullanıcı) | Kullanıcı chat ID'yi n8n arayüzünde girip kaydetti (taslak `88e8f4d4`). Salt okuma: dolu, sayısal, ifade değil; başka düğüm, bağlantı ve credential değişmedi. Editör kaydederken varsayılan değerli `resource`, `operation`, `replyMarkup` anahtarlarını kaldırdı ve `binaryMode: separate` ayarını ekledi. Claude test sırasında workflow veya canlı yapılandırma değiştirmedi. Telegram mesajının ulaşması kullanıcı bildirimi ve ekran görüntüsüyle doğrulandı; gönderim sürecine ilişkin ayrıca nedensel bir değerlendirme yapılmadı. |
| Gönderim (kullanıcı) | Kullanıcı arayüzden bir kez çalıştırdı. **Mesaj kullanıcının Telegram'ına ulaştı** (kullanıcı bildirimi ve ekran görüntüsü). Düğümün yeşil/kırmızı durumu ayrıca doğrulanmadı. |
| Kayıt | Test workflow'una ait kalıcı execution kaydı bulunmadı (çalışma listesi, yalnızca metadata). `saveManualExecutions: false` ayarı mevcut olmakla birlikte, kayıt bulunmaması tek başına bu ayarın davranışını kesin olarak kanıtlamaz. Gönderimin kanıtı kullanıcı bildirimi ve ekran görüntüsüdür. |
| Son durum | Test workflow'u yayında değil, arşivlenmemiş. IlJ0 `53b87907`, Telegram düğümü devre dışı, chat ID boş; ruOv, 14IY, Q8hr değişmedi. n8n'de 39 workflow. *(T1 sonundaki durum; IlJ0 aynı gün değişti, aşağıda T2.)* |

**Kanıtlanan:** bot token geçerli, credential çalışıyor, chat ID doğru, bot bu sohbete yazabiliyor.

**Kanıtlanmayan:** IlJ0'ın ürettiği gerçek hata mesajının Telegram'a gitmesi (HTML kaçışlı metin, 10 dakikalık sınırla birlikte). Bunun için IlJ0'da chat ID girilip düğüm etkinleştirilmeli ve IlJ0 yeniden yayınlanmalı (T2, ayrı karar).

**Chat ID'nin bulunduğu yerler:** test workflow'unun taslağı ve n8n sürüm geçmişi. Belgeye, depoya ve rapora yazılmadı. Test workflow'unun akıbeti (alanın boşaltılması, arşiv) ayrı karar; alan boşaltılsa da değer sürüm geçmişinde kalır.

### T2: IlJ0'da Telegram etkin (25.11.2026)

Kullanıcı canlı IlJ0'da (`atolyekart-final-hata-yakalayici`) chat ID'yi n8n arayüzünde girdi, Telegram düğümünü etkinleştirdi ve yeni sürümü yayınladı. Claude IlJ0'ı değiştirmedi; aşağıdakiler salt okumayla belirlendi.

| Konu | Durum |
| --- | --- |
| Sürüm | `b619fa06` yayında (taslak = yayındaki sürüm, `active: true`). Önceki yayın `53b87907`. n8n sürüm geçmişinde 25.11 18:31–18:32 (İstanbul) arasında 6 kayıt var; Telegram düğümü bunların beşincisinde etkinleşiyor. |
| Telegram düğümü | Etkin; chat ID dolu (değer yazılmadı). Metin ifadesi `={{ $json.mesajTelegram }}` ve ek alanlar (HTML, imza ve önizleme kapalı) 22.11'deki yapılandırmayla aynı. Credential değişmedi. Editör varsayılan değerli `resource`, `operation`, `replyMarkup` anahtarlarını kaldırdı. |
| Diğer düğümler | "Hata tetikleyici", "Hata mesajını kur" (Code) ve bağlantılar, 25.11'deki 6 sürümün hepsinde aynı. |
| `53b87907` ile karşılaştırma | **Doğrudan yapılamadı:** bu sürüm n8n sürüm geçmişinde artık yok (geçmişte yalnızca 25.11 kayıtları var). Dolaylı kanıt: Code düğümünün güncel metni, 22.11'de bu düğümün yazıldığı oturum kaydındaki metinle birebir aynı. Bu resmi bir sürüm karşılaştırması değildir. |
| Ayarlar | `binaryMode: separate` eklendi (editör kaydı). `saveManualExecutions: true`, `Europe/Istanbul` ve `errorWorkflow` yokluğu 22.11'den beri aynı. |
| Test | Kullanıcı IlJ0'ı editörde, n8n'in Error Trigger örnek verisiyle bir kez çalıştırdı: **#525**, `manual`, `success`, 18:32:46, 0,4 sn. Mesaj kullanıcının Telegram'ına ulaştı (kullanıcı bildirimi ve ekran görüntüsü); biçim bu belgedeki taslakla aynı. İçerik örnek veriydi ("Example Workflow", "Node With Error"); **gerçek bir production hatası değildi**. |
| #525 kaydı | Tutuldu (`saveManualExecutions: true`). İçeriği okunmadı; Telegram'ın yanıtını içerebilir. Silinmesi kullanıcının kararı. |

**Kanıtlanan:** IlJ0'ın Code düğümünün ürettiği HTML mesaj, etkin Telegram düğümüyle kullanıcının sohbetine ulaşıyor.

**Kanıtlanmayan:** Gerçek bir production hatasının (ör. ruOv'un 503 yolu) Telegram bildirimine dönüşmesi ve 10 dakikalık sınırın gerçek gönderimle birlikte çalışması. Uçtan uca deneme ayrı plan ve onay gerektirir.

**Değişmeyen:** Alt workflow hatalarında bildirim gelmez (`asama-7-hata-agi-plan.md` bulgu 4). jcH8 yayında olmadığı için onun hataları da bildirim üretmez.

**Açık:** IlJ0'ın n8n'deki açıklama alanı hâlâ "Telegram node'u DEVRE DIŞI, chat ID boş; mesaj gönderilmez" diyor; güncellenmesi ayrı karar. Chat ID artık IlJ0'ın taslağında, yayındaki sürümde ve sürüm geçmişinde de bulunuyor; jcH8'in B1 kodu (`13ed8808`, yayınlanmadı) yedekte gizler.
