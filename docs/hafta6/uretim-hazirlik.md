# AtölyeKart Asistan: Production geçiş hazırlığı (Hafta 6)

Durum (21.11.2026): **AtölyeKart Asistan production'da yayında** (bölüm 6, "Production deploy"). n8n tarafı canlıya geçti: canlı RAG Basic Auth ile korunuyor; Redis bellek, Qdrant ve v4 sistem mesajı canlıda. Vercel Production değişkenleri (`N8N_CHAT_*`) kullanıcı tarafından girildi, `855a533` push edildi ve GitHub entegrasyonunun başlattığı Production deploy testleri geçti. WAF rate limit kuralı production ve Preview'ı kapsayacak şekilde genişletildi (bölüm 3).
Ayrıntılı geçiş/geri dönüş planı ve yedekler: n8n sunucusundaki yerel yedek klasörleri (`yedekler/20261120-canli-oncesi/GECIS-PLANI.md`, `yedekler/20261121-yukleme-qdrant/`). Bu klasörler repoya girmez.

## 0. Kapsam güncellemesi (21.11.2026)

AtölyeKart bir bootcamp/ödev projesidir, ticari SaaS değildir. n8n bağlantısı yaklaşık 2–3 hafta sonra kapatılacak.

**Korunanlar:**
- Vercel `/api/chat` proxy'si.
- n8n Chat Trigger Basic Auth.
- Production için tek WAF kuralı.
- Basit Preview Protection.
- Mevcut Redis ve Qdrant (Mac üzerinde).
- Yedekler ve geri dönüş yolları.

**Çıkarılanlar:**
- Ayrı OpenAI projesi, anahtarı ve bütçesi; harcama limiti testi.
- Başka sunucuya taşıma ya da ücretli altyapı.
- Dağıtık/paylaşımlı rate limit.
- Docker yeniden başlatma gerektiren n8n kayıt budama ayarı.
- Automation bypass anahtarı.

n8n'i kapatma planı: bölüm 7.

## 1. RAG model ayarı (karar: 21.11.2026)

| Ayar | Production için karar |
|---|---|
| Model | `gpt-4.1-mini` |
| Temperature | Varsayılan (açık bir değer verilmez). 0 denendi ve reddedildi, aşağıya bakın |
| `topK` | 6 |
| Sistem mesajı | v4 (test kopyası `PxbJha0DZvRy66wI`, sürüm `432d24f5`; 21.11'de bu sürüme geri dönüldü, yeni kayıt `480d62c2`) |

**Test özeti** (14 soruluk set; beklenen cevaplar dokümanın tam metninden):

| Sürüm | Geçti | Kısmi | Başarısız |
|---|---|---|---|
| Başlangıç (eski kısa prompt) | 9 | 3 | 2 |
| v4, varsayılan temperature | 13 | 0 | 1 (T14) |
| v4, temperature 0 | 12 | 1 (T04) | 1 (T14) |
| **Canlı RAG** (`7126796b`, v4, varsayılan temperature; 21.11, #336–349) | 11 | 3 (T04, T09, T11; biçim) | 0 |

Temperature 0'da T05, T06 ve T08 dört çalıştırmada da doğru cevap verdi. T14'te 1 geçti, 2 kısmi, 1 başarısız.

Canlı çalıştırmada hiçbir yanıtta uydurma sayı, süre, hacim ya da malzeme yok; koşullu ifadeler korundu. T14 bu kez geçti ("artırabilir" korundu, hüküm cümlesi eklenmedi). Kısmi olanlar yalnızca biçim kuralını ihlal ediyor: T04 sonuna "… önemlidir" ekledi; T09 soruyla ilgisiz güvenli yakma bilgisi ve "Bu bilgiler ışığında…" özeti ekledi; T11 "bilgi bulamadım" dedikten sonra kaynak satırı yazdı. Temperature varsayılan olduğu için sonuçlar çalıştırmadan çalıştırmaya değişebilir.

### Bilinen sınırlama (T14), bilinçli olarak kabul edildi

- **Belirti:** Doküman bir risk ya da öneri bildirdiğinde (örnek: "çatlama riskini artırabilir"), model cevabın sonuna dokümanda olmayan bir hüküm cümlesi ekleyebiliyor. Örnekler: "kaçınılmalıdır", "dikkatli olunmalıdır", "… önemlidir". Bu, olasılık bildiren ifadeyi zorunluluğa çevirir.
- **Sıklık:** v4'te 1/1 çalıştırmada, temperature 0'da 3/4 çalıştırmada görüldü.
- **Kapsam:** Sayı, süre, hacim ya da malzeme uydurma testlerin hiçbirinde görülmedi. Sorun yalnızca ifade kesinliği.
- **Alınmayan önlemler** (kullanıcı kararıyla): ikinci bir AI kontrol adımı ya da son cümleyi dokümanla karşılaştıran kod kontrolü eklenmedi.
- **İzleme önerisi:** Canlıda n8n çalışma kayıtlarından ayda bir örnek yanıt incelenmeli. Aynı 14 soru her prompt ya da model değişikliğinden sonra yeniden çalıştırılmalı.

## 2. Preview Deployment Protection (etkin; Standard Protection)

Kullanıcı Vercel panelinden etkinleştirdi; ayar `ssoProtection.deploymentType = "all_except_custom_domains"` olarak doğrulandı. Aşağıdaki not etkinleştirme öncesi hazırlıktır.

- **Plan:** Hobby. Vercel Authentication tüm planlarda var ve ek ücret gerektirmiyor. Password Protection Hobby'de yok.
- **Etkinleştirme** (kullanıcı, panelden): Vercel → atolyekart → Settings → Deployment Protection → Vercel Authentication → **Enabled**, kapsam **Standard Protection** → Save.
  - API karşılığı: `ssoProtection.deploymentType = "all_except_custom_domains"`.
- **Etkisi:** Production alan adı (`atolyekart-tawny.vercel.app`) açık kalır. Preview adresleri ve production'ın deploy adresleri (ör. `atolyekart-2sjgcx3w9-…`) Vercel girişi ister.
- **Erişim yöntemleri:**

  | Kim | Nasıl |
  |---|---|
  | Sen (tarayıcı) | Vercel hesabınla giriş yapılmış tarayıcıda Preview adresini açarsın, otomatik geçersin |
  | Başka bir kişi | Hobby'de hesap başına en fazla bir dış kullanıcı ("Request Access" / paylaşılabilir bağlantı) |
  | Komut satırı testleri | `vercel curl /api/chat --deployment <preview-url>`. CLI korumayı kendi hesabınla aşar; sır gerekmez |
  | Otomasyon (CI, betik) | Kapsam dışı. Bypass anahtarı üretilmez; gerekirse `vercel curl` yeterlidir |

- **Proxy ile uyum:** Sayfa ve `/api/chat` aynı korumalı alan adında olduğu için tarayıcıdaki sohbet çalışır. Vercel'e göre aynı alan adına giden isteklerde bypass gerekmez.
- **Etkinleştirdikten sonra kontrol listesi:**
  1. Gizli pencerede Preview adresi → Vercel giriş sayfası.
  2. Giriş yapılmış tarayıcıda Preview → sohbet çalışıyor.
  3. Production alan adı → açık.

## 3. Vercel WAF rate limit

**Preview testi (21.11.2026; kuralın ilk hâli, yalnızca test Preview'ına uygulanıyordu; güncel hâli aşağıda):**
- **Kural:** "Preview test - api/chat rate limit".
  - Koşullar: host = ana test Preview adresi, path = `/api/chat`, method = POST.
  - Sayım: fixed window, IP başına 60 saniyede 30 istek; aşılınca 429.
- **Yöntem:** 36 POST isteği gönderildi. Gövde geçersizdi, bu yüzden n8n ve OpenAI çağrılmadı.
- **Sonuç:**

  | İstek | Durum | Kaynak |
  |---|---|---|
  | 1–20 | 400 `invalid_body` | Uygulama |
  | 21–30 | 429 `rate_limited`, `Retry-After` var | Uygulamanın kendi sınırı |
  | 31–36 | 429, `x-vercel-mitigated: deny`, Vercel'in İngilizce JSON gövdesi, `Retry-After` yok | WAF |

- **Negatif kontrol:** Başka bir Preview adresine aynı 34 istek gönderildi; hiçbirine WAF müdahale etmedi, yalnızca uygulamanın 429'u görüldü. Pencere dolduktan sonra test Preview'ı yeniden 400 döndü, yani engel kalktı.
- **İstemci davranışı:** WAF'ın 429'unda `Retry-After` yok ve gövde farklı. `chatClient.js` yalnızca durum koduna baktığı için ziyaretçi yine Türkçe "Çok sık mesaj gönderdiniz…" mesajını görür. Bu davranış kod okunarak çıkarıldı; tarayıcıda denenmedi.

**Production kuralı (uygulandı, 21.11.2026; kullanıcı onayıyla, Production deploy testlerinden sonra):**
- Mevcut kuraldan yalnızca host koşulu kaldırıldı (firewall yapılandırması sürüm 1 → 2). Koşullar artık path = `/api/chat` ve method = POST; sayım değişmedi (fixed window, IP başına 60 saniyede 30 istek, aşılınca 429). CRS ve diğer firewall ayarları değişmedi.
- Ardından, ayrı onayla, yalnızca kuralın adı ve açıklaması güncellendi (sürüm 2 → 3): ad "api/chat rate limit (production + preview)", açıklama tüm alan adlarını kapsadığını söylüyor. Kural kimliği (`rule_preview_test_…`) Vercel'de sabittir ve değişmedi; koşullar ve sayım aynı kaldı.
- Değişiklik Vercel CLI ile yapıldı (`vercel api … --method PATCH`); MCP isteği yetki hatası verdi ve hiçbir şeyi değiştirmedi.
- Doğrulama (geçersiz gövdeyle, n8n ve OpenAI çağrılmadan; tarayıcıdan, çünkü production alan adı curl'e Vercel Security Checkpoint gösteriyor):

  | Adres | 1–30 | 31 ve sonrası |
  |---|---|---|
  | Production `atolyekart-tawny.vercel.app` | 1–20: 400 `invalid_body`; 21–30: uygulamanın 429 `rate_limited` yanıtı | 429, `x-vercel-mitigated: deny` (WAF) |
  | Preview `atolyekart-5th1yk5nw-…` (kuralın eski hâlinde kapsam dışıydı) | 404 (bu eski deploy'da `/api/chat` yok) | 429, `x-vercel-mitigated: deny` (WAF) |

- WAF engeli sürerken ana sayfa 200, `/api/order` normal yanıt (400) verdi; kural yalnızca `/api/chat` POST'u etkiliyor.
- WAF sayacı IP başına ve alan adından bağımsız: production testinden hemen sonra Preview'a giden istekler ilk istekten itibaren 429 aldı. Temiz ölçüm pencere dolduktan sonra yapıldı.

**Production kuralı önerisi (uygulama öncesi not):**
- Mevcut test kuralı düzenlenir: host koşulu kaldırılır, path = `/api/chat` ve method = POST kalır. Sayım aynı: 60 saniyede 30 istek, IP başına, aşılınca 429.
- Host koşulu kaldırılınca kural production alan adını **ve** tüm Preview adreslerini birlikte kapsar. Preview'ı korumak için ayrı bir kurala gerek kalmaz; Hobby'deki tek rate limit kuralı ikisine de yeter.
- Hobby planında en fazla 3 özel kural var ve bunlardan yalnızca biri rate limit olabilir. Bu yüzden test kuralı **düzenlenir ya da silinir**; yanına ikinci bir rate limit kuralı eklenemez.
- Not: CLI firewall değişikliğini "publish to production" diye yayınlar; bu, proje düzeyindeki firewall ayarının etkinleşmesidir. Test kuralı host koşuluyla sınırlı olduğu için production alan adını etkilemez.

## 4. OpenAI maliyet takibi (21.11 kapsam güncellemesiyle sadeleştirildi)

**Karar:** Yeni OpenAI projesi, API anahtarı ya da ek bütçe oluşturulmaz. Mevcut `gpt-4.1-mini` credential'ı ("OpenAI account 2") kullanılmaya devam eder.

**Durum:** Ön ödemeli bakiye yaklaşık 2 USD; otomatik yükleme (Auto Top-up) kapalı.

**Bakiye bitince ne olur:**
- OpenAI `429 credit_balance_exhausted` hatası döner.
- n8n çalışması hata verir, `/api/chat` 502 döner.
- Ziyaretçi "Asistan şu anda yanıt veremiyor" mesajını görür.
- Ek harcama oluşmaz. Bakiye pratikte bir harcama tavanı işlevi görür.

**Tahmini tüketim** (test kopyası, çalışma #316, n8n'in token tahmini):
- Mesaj başına iki model çağrısı yapılır: yaklaşık 1,5 bin + 3,4 bin girdi token'ı ve yaklaşık 100 çıktı token'ı. Buna ek olarak tek bir embedding çağrısı.
- Fiyatlar burada doğrulanmadı. `gpt-4.1-mini` için 1M girdi token'ı 0,40 USD, 1M çıktı token'ı 1,60 USD varsayılırsa mesaj başına yaklaşık 0,002–0,003 USD tutar. Konuşma uzadıkça geçmiş de modele gittiği için maliyet artar.
- 2 USD yaklaşık 600–900 mesaja yeter. 14 soruluk tam test seti yaklaşık 0,03–0,04 USD tutar.

**Takip:**
- OpenAI panelindeki Billing (bakiye) ve Usage (günlük tüketim) sayfalarına her test turundan önce ve sonra bakılır *(kullanıcı)*.
- Her test turunda kaç model çağrısı yapıldığı raporda belirtilir. Gereksiz tekrar testi yapılmaz.
- Değerlendirme ya da sunum öncesinde bakiyenin bittiği durumda asistanın nasıl göründüğü önceden bilinmeli (yukarıdaki 502 mesajı).
- Kötüye kullanım sınırları: uygulama IP başına saatte en fazla 60 mesaja izin verir (yaklaşık 0,15 USD/saat); WAF ayrıca dakikada 30 isteği sınırlar. Bir saldırgan bakiyeyi en kötü durumda birkaç saatte bitirebilir. Bunun sonucu yalnızca asistanın durmasıdır; ek borç oluşmaz.

## 5. Canlı RAG endpoint incelemesi ve Basic Auth değişiklik planı

**İnceleme (14–21 Kasım, salt okunur):**
- **n8n çalışma kayıtları:** Canlı RAG (`mYsRTCYniOggXfSJ`) 33 kez çalışmış: 20'si manuel/editör, 13'ü webhook.
  - Webhook çalışmaları: 17.11'de 6, 18.11'de 3, 20.11'de 4. Son çalışma 20.11 12:26 UTC.
  - İncelenen 6 webhook çalışmasının içeriği: "Luna Seramik Kupa stokta yok…", "Seramik kupa nasıl temizlenmeli…", "Soya mumu ilk kez yakmadan önce…", "merhaba, bana hangi konularda yardımcı olabilirsin?", "tekrar kontrol et". Hepsi geliştirme/ödev testi sorusu, tanımadık bir trafik görünmüyor.
- **HTTP erişim günlüğü:** n8n istek başlığı ya da IP saklamıyor. Tünel (Cloudflare Tunnel) için yerelde günlük dosyası yapılandırılmamış. Bu yüzden isteğin hangi makineden geldiği kesin bilinmiyor. Cloudflare paneli → Zero Trust/Analytics bölümünden ayrıca bakılabilir (kullanıcı).
- **Olası tüketiciler:**

  | Aday | Sonuç |
  |---|---|
  | Production ve tüm Preview bundle'ları (5 adres tarandı; ikisi taramadan sonra silindi) | n8n adresi **yok** |
  | Diğer n8n workflow'ları (tüm export tarandı) | Canlı webhook id'sine referans **yok** |
  | Yerel `.env.local` | `VITE_N8N_CHAT_URL` canlı adresi içeriyor. Mevcut kod bu değişkeni kullanmıyor; yalnızca eski commit (`fa84552`) yerelde çalıştırılırsa kullanılır. 20.11'deki 4 webhook çalışmasının kaynağı büyük olasılıkla bu |
  | n8n'in barındırdığı sohbet sayfası | Trigger `mode: webhook`; barındırılan sayfa sunulmuyor |

- **Sonuç:** Bilinen başka bir tüketici yok. Endpoint adres bilen herkese açık ve kimlik doğrulama istemiyor (`allowedOrigins: *`).

**Uygulandı (21.11.2026):** Basic Auth, aşağıdaki plandan farklı olarak tek başına değil, tam geçişin parçası olarak uygulandı: Trigger ile birlikte Redis bellek, Qdrant ve v4 sistem mesajı da canlıya alındı. Kayıt ve test sonuçları bölüm 6'dadır. Aşağıdaki plan tarihçe için korunuyor.

**Basic Auth değişiklik planı (ilk taslak):**
1. Kullanıcı n8n'de yeni bir credential oluşturur, örneğin "AtolyeKart CANLI Basic Auth". Değerleri kullanıcı üretir; testtekinden farklı ve güçlü olmalı.
2. Yedek doğrulanır (`mYsRTCYniOggXfSJ.json`, SHA-256 `0324…9d9a6`).
3. Canlı RAG'de **yalnızca** Chat Trigger değişir:
   - `authentication: basicAuth`, credential = yeni canlı credential.
   - `allowedOrigins`: `*` yerine production alan adı.
   - Diğer node'lar, bellek içi depo ve prompt değişmez.
   - Kaydedip yayınlarken sürüm notu yazılır; `get_workflow_versions_diff` ile farkın yalnızca Trigger olduğu kontrol edilir.
4. Doğrulama:
   - Kimliksiz POST → 401.
   - Yanlış parola → 403.
   - Doğru kimlikle bir test mesajı → 200; oturum öneki `h6-auth-*`. Gerçek veri yok; tek bir OpenAI çağrısı.
5. Yerel `.env.local` içindeki eski `VITE_N8N_CHAT_URL` satırı silinebilir (kullanıcı kararı).
6. Etki: Site zaten n8n'i çağırmadığı için ziyaretçiye etkisi yok. Production geçişinde aynı credential'ın değerleri Vercel Production `N8N_CHAT_USER` ve `N8N_CHAT_PASSWORD` olarak girilir.
7. Geri dönüş: `restore_workflow_version` → `433691ae-6da5-49d0-97e9-94e475680039`, ardından yeniden yayın.

## 6. Veri taşıma doğrulaması (21.11.2026)

**PDF'ler:** SHA-256 değerleri n8n'in ikili veri deposundan hesaplandı.

| Dosya | Canlı depoya yüklenen (#201 / #203) | Qdrant'a yüklenen (#212 / #213 / #214) |
|---|---|---|
| `AtolyeKart_Seramik_Kupa_Bakim_Rehberi.pdf` (73.688 bayt) | `560fd0698f0b30419c17c1ea79bfc887c1d84f7844488d146d6b96ba56cf5f3b` | aynı |
| `AtolyeKart_Soya_Mum_Bakim_Rehberi_v1.2.pdf` (74.291 bayt) | `82fd51a04b08dce511ee7cd349b85257dcd9d30e6bc00b6afdb4539127a323b2` | aynı (iki yükleme de) |

- Kopyaları ve `SHA256SUMS` dosyası `yedekler/20261120-canli-oncesi/pdf/` klasöründe.

**Qdrant snapshot:**
- Dosya: `atolyekart_product_knowledge-8945276431270180-2026-11-20-21-08-06-0.snapshot`, 546.816 bayt.
- Checksum: `a126b01f3fb1ef3dd763c27c87545b22b1ed657c06c81aa89ada3e484b3f31b1`.
- Kopyalar: Qdrant volume'unda ve `yedekler/…/qdrant/` klasöründe. İkisinin checksum'ı eşleşti.
- Snapshot anında koleksiyon: 21 nokta, durum green.

**Workflow yedekleri:** Canlı RAG ve yükleme workflow'larının bugünkü export'u, 20.11'deki yedeklerle bayt bayt aynı (SHA-256 eşleşti). Yedek alındığından beri canlı workflow'lar değişmedi.

**Geçiş öncesi tekrar:** Geçiş günü sırasıyla yeni snapshot alınır, workflow export'unun SHA-256'sı karşılaştırılır ve n8n'in yeniden başlamadığı (`docker inspect`) kontrol edilir.

### Canlı geçiş kaydı (21.11.2026)

Yedekler: `yedekler/20261121-yukleme-qdrant/` (iki workflow'un önce/sonra export'u ve iki Qdrant snapshot'ı, `SHA256SUMS` ile). Export'larda kullanıcı adı ya da parola yoktur.

**Ön kontrol:** İki canlı workflow'un export'u 20.11 yedekleriyle aynıydı (`0324…`, `b9e2…`). Değişiklik öncesi snapshot `…2026-11-21-10-06-32-1.snapshot` (checksum `7abba5c9…`, kopyayla eşleşti; 21 nokta).

**1. Canlı yükleme workflow'u (`hkc6PGrM6o0aAvo8`): `cc36024a` → `4b41a863`**
- Simple Vector Store ve manuel tetikleyici kaldırıldı. Yerine: "Eski parçaları sil" (aynı `document_id`) → "Form verisini geri al" → Qdrant Vector Store (`atolyekart_product_knowledge`).
- TEST kopyasından farkı: silme adımı hata verirse akış durur (TEST'te `continueRegularOutput` idi). Code node silme yanıtında `status: ok` ve `result.status: completed` görmezse ya da PDF yoksa akışı durdurur; böylece silme başarısızken çift kayıt eklenmez.
- Sürüm farkında değişen node yok: form adresi (`webhookId c34c4d08…`), alanlar, metadata, 500/50 bölme, embeddings ve `binaryMode: separate` korundu.
- Pin testleri (Qdrant ve OpenAI çağrılmadan): #331 PDF verisi `separate` modunda Qdrant node'una ulaştı; #332 başarısız silmede akış durdu.

**2. PDF'lerin yeniden yüklenmesi (canlı formdan, yedekteki SHA-256'sı doğrulanmış kopyalarla)**

| Çalışma | Doküman | Silme | Sonuç |
|---|---|---|---|
| #333 | `ceramic-mug-care-guide` 1.0 | `completed` | başarılı |
| #334 | `soy-candle-care-guide` 1.2 | `completed` | başarılı |

- Qdrant sonrası: toplam 21 (ceramic 10, soy 11); aynı içerikli tekrar 0; eksik metadata 0; durum green. Sonraki snapshot `…2026-11-21-10-09-24-2.snapshot` (`e9db51ef…`).
- Yükleme workflow'u hemen **yayından kaldırıldı**: form adresi GET ve POST'ta 404 döner.

**3. Canlı RAG (`mYsRTCYniOggXfSJ`): `433691ae` → `7126796b` (yayında)**
- Değişiklikten önce eski Simple Vector Store'un dolu ve çalıştığı doğrulandı (#335; rehberden parça döndü). Geri dönüş yolu bu sayede gerçek.
- Sürüm farkı: eklenen Redis Chat Memory (30 gün TTL, pencere 10) ve Product Documents (Qdrant, `topK` 6, metadata dahil); kaldırılan eski vektör aracı, Simple Vector Store ve ikinci LLM; değişen yalnızca Chat Trigger ve AI Agent sistem mesajı.
- Chat Trigger: `basicAuth` ("AtolyeKart CANLI Basic Auth"), `allowedOrigins` = `https://atolyekart-tawny.vercel.app`, `loadPreviousSession: memory`. **`webhookId 541ab5e6` ve adres değişmedi.**
- Sistem mesajı TEST v4 ile birebir aynı (SHA-256 `fe5d212d…`). Model `gpt-4.1-mini`, Google Sheets aracı ve `binaryMode` değişmedi.

**4. Testler**

| Test | Sonuç |
|---|---|
| Kimliksiz POST | 401 |
| Uydurma kullanıcı/parola | 403 |
| Kimliksiz geçmiş yükleme | 401 |
| Reddedilen istekler | n8n çalışma kaydı ve Redis anahtarı oluşmadı |
| 14 soruluk RAG testi (MCP manuel, #336–349) | 11 geçti, 3 kısmi (biçim), 0 başarısız; bölüm 1. Her oturum kendi Redis anahtarına yazıldı, TTL ≈ 30 gün |
| Uçtan uca, yerel `npm run dev` → `/api/chat` → Basic Auth → canlı n8n | Aynı `sessionId` (`h6-e2e-…`) ile iki mesaj: ikisi de **200**. İlk mesajdaki uydurma test kodu ("MAVİ-47") ikinci mesajda doğru hatırlandı. `loadPreviousSession` 200 ve 4 mesaj (human, ai, human, ai) döndü |
| Redis | Yalnızca `h6-e2e-…__Redis_Chat_Memory` anahtarı; 4 mesajlık liste; TTL 2.591.992 sn (≈ 30 gün) |
| Sır sızıntısı | Sunucu günlüğünde ve yanıtlarda kullanıcı adı, parola, Basic Auth başlığı ve webhook adresi yok |

Aynı oturumla geçmiş testi MCP ile yapılamadı: manuel çalıştırma her seferinde yeni bir `mcp-session-…` kimliği veriyor. Bu yüzden test, kullanıcı `.env.local`'e canlı değerleri girdikten sonra `/api/chat` üzerinden yapıldı; değerler yalnızca proxy'de kaldı ve hiçbir çıktıya yazılmadı. Toplam OpenAI kullanımı: 17 sohbet çalışması (#335, #336–349 ve uçtan uca testin iki mesajı) ve iki PDF'in embedding'i, tahminen 0,05 USD'nin altında.

**Geri dönüş:**
- Canlı RAG: `restore_workflow_version` → `433691ae`, ardından yeniden yayın. Eski bellek içi depo n8n yeniden başlayana kadar doludur; başlarsa iki PDF eski formdan yeniden yüklenmelidir.
- Yükleme workflow'u: `cc36024a` (şu an yayında değil).
- Qdrant: `…10-06-32-1` snapshot'ı ya da iki PDF'in yeniden yüklenmesi (silme adımı çift kaydı önler).

### Production deploy (21.11.2026)

- Vercel Production değişkenleri (`N8N_CHAT_URL`, `N8N_CHAT_USER`, `N8N_CHAT_PASSWORD`; sensitive, yalnızca Production) kullanıcı tarafından girildi. Değerler hiçbir çıktıya yazılmadı.
- `git push origin main` (`fa84552..855a533`). Deploy'u GitHub entegrasyonu başlattı (`vercel deploy --prod` kullanılmadı): `dpl_8iMS5DYB36MPDk776HZpFycdPfFU` (`atolyekart-2559z363x`), READY.
- Production alan adı curl isteklerine Vercel Security Checkpoint (403, `x-vercel-mitigated: challenge`) gösterdi; tarayıcı doğrulamayı otomatik geçti. Bu yüzden testler tarayıcıdan yapıldı. Ayar değiştirilmedi.

| Test | Sonuç |
|---|---|
| Site erişimi | Sayfa açıldı; yeni paket yayında ("Yeni sohbet" var) |
| Paket içeriği | JS'te n8n alan adı ya da webhook adresi yok; tarayıcı yalnızca `/api/chat`'i biliyor |
| Geçersiz gövde | 400 `invalid_body` |
| Farklı origin | JSON isteğinin CORS ön kontrolü (OPTIONS) 403 aldı, POST gönderilmedi. Ön kontrolsüz basit istek Vercel kenar katmanından 503 aldı (uygulama günlüğü boş, n8n çalışması ve Redis anahtarı oluşmadı). Uygulamanın kendi `403 forbidden_origin` yanıtı production'da doğrudan görülemedi; `server/chat.test.js` kapsıyor |
| Gerçek mesaj, aynı oturum (`h6-prod-…`) | 1. mesaj 200; 2. mesaj 200 ve ilk mesajdaki test kodu ("YEŞİL-83") hatırlandı; `loadPreviousSession` 200 ve 4 mesaj |
| Redis | Yalnızca `h6-prod-…__Redis_Chat_Memory`; 4 mesajlık liste; TTL 2.591.994 sn (≈ 30 gün) |
| Arayüz | Yenileme sonrası geçmiş yüklendi; "Soya mumu nasıl saklamalıyım?" sorusu doküman kaynaklı yanıt aldı (`soy-candle-care-guide`, sürüm 1.2) |
| Yeni sohbet | Yeni kimlik üretildi, pencerede yalnızca karşılama kaldı, uyarı metni göründü; ağ isteği yok |
| Ağ trafiği | Tüm istekler aynı alan adına (`/api/chat`, 200); n8n'e doğrudan istek yok |
| 390px | Pencere tam ekran, yatay taşma yok (`scrollWidth` 390), "Yeni sohbet" düğmesi 36px |
| Runtime günlüğü ve sır sızıntısı | Deploy'da runtime günlük kaydı yok (yapılandırma ya da n8n hatası oluşmadı); yanıtlarda ve sayfada kimlik bilgisi yok |
| n8n | Production testlerinden 3 webhook çalışması (#352–354), hepsi başarılı |

- Rollback gerekmedi. Gerekirse Vercel Instant Rollback ile önceki production deploy'u `atolyekart-2sjgcx3w9` (`dpl_7DGhPCifcECkFMFdHpEHd5cPbtjT`) seçilir.

## 7. n8n bağlantısını kapatma planı (yaklaşık 2–3 hafta sonra; onayla yapılır)

Sıra önemlidir: önce ziyaretçinin gördüğü taraf, sonra veri.

1. **Site:**
   - Kullanıcı Vercel Production'dan `N8N_CHAT_URL`, `N8N_CHAT_USER` ve `N8N_CHAT_PASSWORD` değişkenlerini siler.
   - Ardından yeniden deploy yapılır (onayla).
   - `/api/chat` 503 döner, pencere "Asistan şu anda kullanılamıyor" gösterir. Kod değişikliği gerekmez.
   - İstenirse daha sonra sohbet penceresi koddan da kaldırılabilir; bu ayrı bir karardır.
2. **n8n:**
   - Canlı RAG yayından kaldırılır (unpublish); endpoint 404 döner.
   - Canlı yükleme workflow'u 21.11.2026'dan beri zaten yayında değil.
   - Kapatmadan önce workflow'ların son hali export edilip yedek klasörüne eklenir.
3. **Veri:**
   - Redis'teki `*__Redis_Chat_Memory` anahtarları silinir. Silmeden önce anahtar sayısı raporlanır; işlem geri alınamaz, onay gerekir. Silinmezse anahtarlar en geç 30 günde kendiliğinden silinir.
   - AtölyeKart RAG çalışma kayıtları silinir. Bunlar sohbet mesajlarını içerir.
4. **Qdrant:**
   - Koleksiyon silinebilir ya da bırakılabilir. Silinirse snapshot ve PDF kopyaları yedekte kalır.
5. **Sırlar ve dosyalar:**
   - Test ve canlı Basic Auth credential'ları ile RTF dosyası silinir (onayla).
   - `.env.local` içindeki eski `VITE_N8N_CHAT_URL` satırı kaldırılır.
6. **WAF:**
   - `/api/chat` kuralı silinebilir; uç nokta 503 döndüğü için gerek kalmaz.
7. **Belgeler:**
   - CLAUDE.md'de asistanın "kapalı" olduğu yazılır.
   - Gizlilik metni sohbet artık yokmuş gibi güncellenir. Hukuki maddelerin çoğu bu durumda düşer.
8. **Dokunulmayacaklar:**
   - Cloudflare tüneli ve n8n'in kendisi, diğer bootcamp workflow'ları kullandığı için ayrı karardır.
   - Yedek klasörü korunur.

**Geri dönüş:** Değişkenler yeniden girilip deploy edilir, workflow yeniden yayınlanır. Redis verisi silindiyse geri gelmez; Qdrant snapshot'tan geri yüklenir.
