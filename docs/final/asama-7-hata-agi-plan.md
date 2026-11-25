# 7. aşama planı ve sonucu: hata ağı uçtan uca

> Hazırlandı: 23.11.2026. **Durum: H7-0 – H7-6 uygulandı ve geçti; test anahtarı TTL ile kendiliğinden silindi (23:49'da doğrulandı).** **Ek test (25.11.2026): alt workflow hatası, test kopyalarıyla elle çalıştırıldı (bölüm 8); bulgu 4 bilinen sınırlama olarak kaldı.** Önceki aşamalar: `asama-4-hata-yakalayici-plan.md` (handler ve pin verili testler H1–H6), `asama-6-yayin-ve-uctan-uca-plan.md` (yayın, `errorWorkflow` bağlantısı, K1/K2/K7). Tasarım: `yedekleme-ve-hata-bildirimi.md` bölüm 2. Genel plan: `kapsam-ve-plan.md`.

## 1. Amaç ve sınır

Final asistanın (`ruOvhJ8EtfHvpkrt`) production modunda gerçek bir hatayla karşılaştığında:
- ziyaretçiye anlaşılır bir hata yanıtı (503) döndüğünü,
- hata yakalayıcının (`IlJ0nrSuexnU4Wx4`) tetiklendiğini ve gerçek Error Trigger verisinden bildirim metni ürettiğini,
- workflow başına 10 dakikada en fazla 1 bildirim sınırının production'da çalıştığını

doğrulamak (kabul ölçütü 4; 4. aşamadan kalan maddeler).

**Kapsam dışında:**
- Gerçek Telegram gönderimi: düğüm devre dışı kaldı, chat ID boş.
- 14IY'de teknik hata (bölüm 6).
- bizcard2 proxy'si üzerinden test (6. aşama adım E; beklemede).
- Yedekleme workflow'unun (`jcH8s8nGulXET3bj`) hata yolu.

**Sınırlar:**
- Hiçbir workflow değiştirilmedi ya da yayınlanmadı.
- Canlı workflow'lara, Qdrant'a, Products tablosuna, canlı Redis anahtarlarına ve credential'lara dokunulmadı.
- Telegram, e-posta, sipariş, stok bildirimi ya da poliçe oluşmadı.
- Sırlar (Basic Auth değerleri, Redis şifresi, webhook adresinin tamamı, chat ID) çıktıya ve belgeye yazılmadı.

## 2. Senaryo: S1, bozuk hafıza anahtarı

Bu teste özel bir Redis anahtarı (`atolyekart-final:final-h7-s1`) liste yerine düz metin (string) olarak yazıldı. Ardından bu oturum kimliğiyle ruOv'a Basic Auth'lu gerçek bir HTTP isteği gönderildi. Redis Chat Memory anahtarı liste olarak okumaya çalıştığı için `WRONGTYPE` hatası alındı. Bu gerçek bir altyapı hatasıdır, ama yalnızca test oturumunu etkiler.

**Neden bu senaryo:**
- Hiçbir workflow ya da credential değişmiyor.
- Hiçbir konteyner durdurulmuyor; canlı RAG ve AtölyeKart sohbeti etkilenmiyor.
- Hafıza, model çağrısından önce okunuyor; bu yüzden OpenAI maliyeti oluşmadı (bölüm 3, H7-3).
- Anahtar 1 saatlik TTL ile kendiliğinden siliniyor.

**Yöntem:**
- Redis komutları ve HTTP istekleri kullanıcının kendi terminalinde çalıştırıldı. Şifreler `read -s` ile alındı; komut satırına, dosyaya ve sohbete yazılmadı.
- İstek yerel n8n'e gönderildi (`127.0.0.1:5678`, tünel atlanarak).
- Kullanılan script: Basic Auth başlığı curl'e standart girdiden verilir; gövde sabittir (`{"sessionId":"final-h7-s1","chatInput":"Merhaba"}`); göndermeden önce onay ister; yalnızca durum kodunu, süreyi ve gövdeyi yazdırır. Script geçici klasördeydi, depoya alınmadı.
- n8n tarafı salt okumayla incelendi: MCP çalışma kayıtları ve `n8n export:workflow` çıktısından yalnızca kalıcı veri anahtarının adı ve zamanı.

## 3. Test adımları ve kanıtlar

**Zamanlar.** Tüm saatler İstanbul saatidir. İki kaynaktan gelir:
- **Yanıt zamanı (script):** Script, saati curl yanıtı aldıktan sonra saniye hassasiyetiyle yazar. H7-2 ve H7-5'teki saatler isteğin gönderildiği an değil, **HTTP yanıtının alındığı andır**. İstek, yanıt zamanından yaklaşık 4 sn önce (ölçülen süre kadar) gönderilmiştir.
- **Çalışma zamanı (n8n):** ruOv'un başlangıç ve bitiş zamanlarıdır. 503 yanıtı, "Hata yanıtı (503)" düğümünde ve çalışma bitmeden ("Hatayla bitir"ten önce) gönderilir. Bu yüzden yanıt zamanı, çalışmanın bitiş zamanıyla aynı saniyede ya da bir saniye öncesindedir.

| # | Adım | Sonuç |
| --- | --- | --- |
| H7-0 | Salt okuma ön kontrolü | ✅ ruOv yayında, `08e2d27a` (taslak = yayın), `errorWorkflow` = IlJ0. IlJ0 yayında, `53b87907`; Telegram düğümü `disabled:true`, chat ID boş; kendi `errorWorkflow`'u yok. Son çalışmalar: ruOv #516, IlJ0 #479 (hiç gerçek hatayla tetiklenmemişti). `final-h7-s1` yok (`EXISTS 0`, `TYPE none`). |
| H7-0 (Redis bağlantısı) | Credential'ın hangi Redis'e gittiği | ✅ Tek Redis konteyneri `n8n-bootcamp-redis`; n8n ile aynı Docker ağında; portu Mac'e açılmıyor. Önceki test anahtarları (`final-reg-s1`, `final-reg-s2`, `final-d3-s1`) bu Redis'te ve `list` türünde. Kalan süreleri, 7 günlük kayan TTL ile #503–#513 ve #516'nın zamanlarına uyuyor. Credential içeriği okunmadı. |
| H7-1 | Test anahtarı: `SET … h7-bozuk-hafiza EX 3600 NX` (kullanıcı, 22:37 civarı) | ✅ `SET=OK`, `type=string`, `ttl=3600`. Başka anahtara dokunulmadı. Yazmanın ardından n8n'de yeni çalışma başlamadı. |
| H7-2 | İstek 1 (kullanıcı). **Yanıt zamanı 22:56:02**; ruOv #517: 22:55:58,5 – 22:56:02,6 | ✅ **HTTP 503**, 4,20 sn. Gövde: `{"ok":false,"mesaj":"Asistan şu anda yanıt veremiyor. Lütfen biraz sonra yeniden deneyin."}`. Teknik ayrıntı yok. |
| H7-3 | ruOv **#517** (salt okuma) | ✅ Mod `webhook`, `error`. "Girdiyi doğrula" geçti → AI Agent. "Redis Final Hafıza" 3 denemede de `WRONGTYPE` verdi (22:55:58,5 / 22:56:00,6 / 22:56:02,6; ~2 sn arayla). Agent hatayı hata çıkışına verdi → "Hata yanıtı (503)" → "Hatayla bitir". Model düğümü çalışmadı (OpenAI maliyeti yok); hafızaya yazılmadı. 200 ve 400 dalları çalışmadı. |
| H7-4 | IlJ0 **#518** (salt okuma) | ✅ Mod `error`, `success`; üst çalışma #517; 22:56:02,6'da, ruOv bittikten ~25 ms sonra başladı. Altı satırlık mesaj üretildi (aşağıda); adres, anahtar, kullanıcı mesajı ya da kişisel veri yok. Telegram düğümü devre dışıydı; girdiyi geçirdi (1 ms), gönderim yapmadı. Kalıcı veride `son_bildirim_ruOvhJ8EtfHvpkrt` = 22:56:02. |
| H7-5 | İstek 2, bildirim sınırı (kullanıcı). **Yanıt zamanı 22:59:49**; ruOv #519: 22:59:45,9 – 22:59:50,0 | ✅ **HTTP 503**, 4,19 sn, aynı gövde. ruOv **#519**: #517 ile aynı akış, model çağrılmadı. IlJ0 **#520** (22:59:50,0; son bildirim zamanı 22:56:02'den 3 dk 48 sn sonra): mod `error`, `success`; "Hata mesajını kur" **boş çıktı** verdi; "Telegram'a gönder" **çalışmadı**. Kalıcı veri **22:56:02'de kaldı**; engellenen çalışma zamanı güncellemiyor. |
| H7-6 | Test anahtarının silinmesi (salt okuma; kullanıcı terminali, 23:49:06) | ✅ `EXISTS 0`, `TTL -2`: anahtar 1 saatlik TTL sonunda kendiliğinden silindi. Elle silme ya da başka bir yazma yapılmadı. |

H7-4'te üretilen mesaj:

    AtölyeKart — workflow hatası
    Workflow : atolyekart-final-asistan
    Çalışma  : #517 (mod: webhook)
    Adım     : Hatayla bitir
    Hata     : Final asistan: AI Agent denemeleri tükendi; ziyaretçiye 503 döndü.
    Zaman    : 23.11.2026 22:56 (İstanbul)

## 4. Kabul ölçütleri

| Ölçüt | Durum | Kanıt |
| --- | --- | --- |
| Kabul ölçütü 4: bilerek bozulan bir adımda ziyaretçi anlaşılır bir hata görür, handler çalışır, bildirim metni üretilir | ✅ Karşılandı (n8n'e doğrudan istekle; proxy üzerinden değil) | H7-2, #517, #518 |
| 4. aşamadan kalan: gerçek Error Trigger verisinin alanları | ✅ | #518: workflow adı ve ID, çalışma numarası, mod, son düğüm, hata mesajı dolu |
| 4. aşamadan kalan: 10 dakikalık bildirim sınırı (production) | ✅ | #518 zamanı yazdı; #520 boş çıktı verdi, zaman değişmedi |
| 6. aşamada K7'den kalan: `errorWorkflow` bağlantısının gerçek hatayla tetiklenmesi | ✅ | #517 → #518, #519 → #520 |
| Telegram'a gönderim yok | ✅ | #518 devre dışı düğüm; #520'de düğüm çalışmadı |
| OpenAI maliyeti yok | ✅ | #517 ve #519'da model düğümü çalışmadı |

**Not:** Ziyaretçinin bizcard2 arayüzünde 503'ü nasıl gördüğü (proxy 502'ye çevirir, istemci genel metni gösterir) 6. aşama K3–K6 ile birlikte test edilecek.

## 5. Bulgular (düzeltme yapılmadı)

1. **Bildirimde kök neden görünmüyor.** Error Trigger yalnızca çalışmayı bitiren son hatayı taşıyor. Bu yüzden bildirimdeki adım "Hatayla bitir" ve hata metni bu düğümün sabit metni. Asıl neden (`WRONGTYPE`, "Redis Final Hafıza") bildirimde yok; ancak n8n çalışma kaydında görülebiliyor.
   **Olası düzeltme:** ruOv'daki "Hatayla bitir" mesajına `$json.error` eklemek. IlJ0'ın maskelemesi bu metne de uygulanır. Bu, yeni bir ruOv sürümü ve yeniden yayın gerektirir; ayrı karar ve onayla.
2. **Çalışma kayıtlarında hassas olabilecek ayrıntılar ve kullanıcı mesajı gizlenmiyor.**
   - Error Trigger verisinde n8n'in genel adresini içeren `execution.url` ve tam stack trace var. IlJ0 bunları mesaja koymuyor; ama #518 ve #520'nin kayıtlarında duruyorlar.
   - Kayıtlarda gizleme kapalı (`redaction.production: false`). Ziyaretçi mesajı (`chatInput`) ve oturum kimliği ruOv kayıtlarında açık duruyor (#517, #519: "Merhaba").
   - Bu kayıtlar yalnızca n8n veritabanındadır; yedekleme workflow'u çalışma kayıtlarını almaz. Gizlemenin açılması ya da kayıt saklama süresinin kısaltılması ayrı bir karar.
3. **`ai.agent.execution.succeeded: true` iz alanı yanıltıcı.** #517 ve #519'da Agent'ın iz verisinde `ai.agent.items.failed: 1` ve `iteration.count: 0` olduğu halde `ai.agent.execution.succeeded: true` yazıyor. Alanın n8n'in kendi metriği olduğu düşünülüyor; anlamı doğrulanmadı. Test raporlarında başarı ölçütü olarak bu alan değil, çalışma durumu ve çalışan dallar kullanılmalı.
4. **Alt workflow hatası bildirim üretmiyor (bilinen sınırlama; production'da test edilmedi).**
   - Gözlenen (bölüm 8, AH-1 ve AH-2; sohbette S3 / S3b olarak konuşuldu; elle çalıştırma): Prim Hesapla aracı alt workflow hatasını yakalayıp modele metin olarak veriyor; Agent hata fırlatmıyor ve başarılı çıkıştan devam ediyor. "Yanıt (200)" düğümündeki metin (elle testte gerçek ziyaretçi yoktu) güvenli ve prim tutarı içermiyor. Bu, hem alt workflow'un kendi çalışma zamanı hatasında (AH-2) hem de alt workflow yayında olmadığında (AH-1) aynı.
   - Çıkarım: Ana çalışma başarılı bittiği için ruOv'un `errorWorkflow` ayarı devreye girmez; 14IY ve Q8hr'de `errorWorkflow` yok. Bu yüzden production'da da IlJ0 bildirimi **beklenmiyor**. Bu sonuç production testiyle doğrulanmadı; n8n'in hata workflow'unu yalnızca başarısız production çalışmalarında tetiklemesinden ve elle testlerde gözlenen davranıştan çıkarılmıştır.
   - 14IY yayından kaldırılırsa da aynı sessiz yol beklenir (AH-1 bunu test kopyasında gösterdi). Sigorta Şartları aracı (Q8hr) test edilmedi; onun için aynı davranış yalnızca "Yanıtı tamamla" kodunun incelenmesine dayanan bir çıkarımdır.
   - **Karar (25.11.2026):** Düzeltme yapılmaz; canlı workflow'lar değişmez. Değerlendirilip uygulanmayan seçenekler: yanıt gönderildikten sonra araç hatası varsa çalışmayı hatayla bitirmek; alt workflow'lara `errorWorkflow` bağlamak.

## 6. Elenen senaryolar

| Senaryo | Neden elendi |
| --- | --- |
| Redis ya da Qdrant konteynerini durdurmak | AtölyeKart production asistanı ve canlı RAG aynı konteynerlere bağlı |
| OpenAI credential'ını bozmak ya da değiştirmek | Credential tanımları değiştirilmez |
| 14IY'de (Prim Hesapla) teknik hata | 14IY değiştirilmeden tetiklenemez. Araç hataları genelde modele geri verilir; 503 yoluna düşmeyebilir. OpenAI maliyeti oluşur. Sınırlama olarak kalır. *(25.11.2026: 14IY'ye dokunmadan, test kopyalarıyla elle denendi; bölüm 8.)* |
| jcH8'de (yedekleme) hata | Credential değişikliği ya da Drive'a yazma gerektirir |
| S2: Webhook + Stop and Error içeren yeni test workflow'u | Yeni workflow ve geçici yayın gerektirir; ziyaretçinin 503 yolunu sınamaz. S1 kabul edildiği için gerekmedi. |
| MCP ile elle çalıştırma | Elle çalıştırma hata workflow'unu tetiklemez; gerçek HTTP isteği gerekir |

## 7. Açık kalanlar (her biri ayrı karar ve onayla)

- Bulgu 1'in düzeltilmesi (ruOv yeni sürüm + yeniden yayın).
- Bulgu 2: çalışma kayıtlarında gizleme ve saklama süresi.
- Bulgu 4: karar 25.11.2026'da verildi (düzeltme yok, bilinen sınırlama). Bölüm 8'deki iki test workflow'u yayınlanmamış ve arşivlenmemiş halde tutuluyor; arşivlenmeleri ayrı karar.
- Gerçek Telegram gönderimi: kullanıcı chat ID'yi n8n'e girer; düğüm etkinleştirilir; IlJ0 yeniden yayınlanır. *(25.11.2026: bağlantı testi T1 ayrı test workflow'unda geçti; IlJ0 değişmedi. `yedekleme-ve-hata-bildirimi.md` → "T1: Telegram bağlantı testi".)*
- Uçtan uca hata gösteriminin bizcard2 proxy'si üzerinden testi (6. aşama adım E, K3–K6).
- `asama-4-hata-yakalayici-plan.md` bölüm 5'teki "7. aşamaya kalanlar" ile `kapsam-ve-plan.md` §5'teki ölçüt 4 durumunun güncellenmesi: 8. aşamada, diff ve onayla.

## 8. Ek test (25.11.2026): alt workflow hatası

Sohbette "S3" ve "S3b" olarak konuşuldu. Bölüm 2'deki S1 (bozuk hafıza anahtarı) ile karışmaması için burada AH-1 ve AH-2 adları kullanılır.

**Soru:** Prim Hesapla aracının çağırdığı alt workflow hata verirse yanıt düğümüne ne gider ve hata ağı ne yapar? Bölüm 6'da 14IY'de teknik hata elenmişti. Bu test 14IY'ye ve canlı workflow'lara dokunmadan, iki test workflow'uyla yapıldı.

**Test workflow'ları** (ikisi de yayınlanmamış ve arşivlenmemiş; tutuluyor):

| Workflow | ID | Rol |
| --- | --- | --- |
| `atolyekart-final-alt-hata-test` | `4UcIHjoOUajs7ibB` | 14IY ile aynı girdi (`productId`, `quantity`); "Bilerek hata" Code düğümü sabit bir hata fırlatır. Tek tetikleyici alt workflow girişi; webhook yok. Credential ve `errorWorkflow` yok. Taslak `3fe2363c`. |
| `atolyekart-final-asistan-hata-test` | `u9KeREnfXQNCZtyx` | ruOv'un kullanıcı tarafından arayüzden alınmış kopyası. Farklar: webhook yolu `atolyekart-final-asistan-hata-test`; Redis anahtarı `atolyekart-final-hatatest:<sessionId>`, TTL 3600 sn; Prim Hesapla aracı `atolyekart-final-alt-hata-test`'e bağlı; açıklama. Diğer 12 düğüm, bağlantılar, ayarlar ve credential ID'leri ruOv ile aynı (yerel karşılaştırma). `errorWorkflow` = IlJ0 (kopyalamayla geldi). Taslak `d9a24d15`. |

**Yöntem:**
- Kopya, MCP `execute_workflow` ile `manual` modda çalıştırıldı; her test bir kez. Yeniden çalıştırma ya da düzeltme yapılmadı.
- Bu gerçek bir HTTP isteği değildir: Basic Auth denetlenmedi, **HTTP durum kodu ölçülmedi** ve gerçek bir ziyaretçi yoktu. Hangi yanıt düğümünün çalıştığı çalışma kaydından okundu.
- Girdi: `{"sessionId":"hatatest-s3-000N","chatInput":"3 adet Luna Seramik Kupa için kargo sigortası primi ne kadar?"}`.
- n8n hata workflow'unu yalnızca production çalışmalarında tetikler (n8n MCP aracının açıklaması). Bu yüzden bu testler IlJ0'ın production davranışını sınamaz.
- Çalışma kayıtlarından yalnızca gereken düğümler okundu; credential, adres ve şifre yazdırılmadı.
- OpenAI maliyeti ölçülmedi. Her testte model düğümünün 2 alt çalışması gözlendi.

| # | Adım | Sonuç |
| --- | --- | --- |
| AH-1 | Kopya **#521** (25.11.2026 16:40:58, İstanbul); `atolyekart-final-alt-hata-test` yayında değil | Prim Hesapla aracı `error`: "Workflow is not active and cannot be executed." Alt workflow **çalışmadı** (çalışma kaydı yok). Agent'ın başarılı çıkışı → "Yanıtı tamamla" → "Yanıt (200)" düğümü (durum kodu ölçülmedi). `aracHatasi: true`, `durum: yok`. "Yanıt (200)" düğümündeki metin (elle testte gerçek ziyaretçi yoktu): "Şu anda prim hesaplama işlemi yapılamıyor. Başka bir konuda yardımcı olabilir miyim?" + "Prim hesabının sonucu okunamadığı için tutar gösterilmiyor." + demo uyarısı. Rakam yok. Çalışma `success`, 3,8 sn. IlJ0'da çalışma yok. |
| AH-2 hazırlık | `atolyekart-final-alt-hata-test`, `3fe2363c` sürümüyle yayınlandı (kullanıcı onayı) | ✅ `active: true`; yayındaki sürüm = taslak. |
| AH-2 | Kopya **#522** (16:52:32 – 16:52:36) → alt workflow **#523** (`integrated`, `error`, 26 ms) | #523: "Bilerek hata" düğümü, satır 2. Test çıktısındaki sabit hata metni: `TEST S1: prim alt workflow'u bilerek hata verdi.` (Buradaki "S1", bölüm 2'deki senaryo değil, sohbetteki test workflow'unun kısa adıdır; workflow'daki sabit metin değiştirilmedi.) Prim Hesapla aracı `error`, modele `{error: …}` döndü; Agent hata fırlatmadı. Başarılı çıkış → "Yanıt (200)" düğümü (durum kodu ölçülmedi). `aracHatasi: true`, `durum: yok`, `yerTutucuVardi: true`, silinen cümle 0. "Yanıt (200)" düğümündeki metin (elle testte gerçek ziyaretçi yoktu): "Üzgünüm, şu anda Luna Seramik Kupa için kargo sigortası primi hesaplanamıyor. Prim hesabının sonucu okunamadığı için tutar gösterilmiyor." + demo uyarısı. **Prim tutarı yok.** #522 `success`. IlJ0'da çalışma yok. |
| AH-2 geri alma | #522 biter bitmez `atolyekart-final-alt-hata-test` yayından kaldırıldı | ✅ `active: false`; yayındaki sürüm yok. |
| Redis | Kullanıcı terminali (`read -s`) | ✅ `atolyekart-final-hatatest:` önekinde iki anahtar (`…-0001` TTL 2730, `…-0002` TTL 3424); canlı `atolyekart-final:` önekinde test oturumu 0. |
| Son durum | Salt okuma (yerel n8n dışa aktarımı) | ✅ ruOv `08e2d27a`, IlJ0 `53b87907`, 14IY `2eba8392`, Q8hr `5f9edfd1`: taslak = yayındaki sürüm, değişmedi. İki test workflow'u yayında değil, arşivlenmemiş. n8n'de toplam 38 workflow. |

**Sonuç:** Bulgu 4 (bölüm 5).
