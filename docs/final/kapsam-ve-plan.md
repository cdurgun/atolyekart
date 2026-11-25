# Final görevi: kapsam ve iki haftalık plan

Kaynak: `Final_Gorevi_BizCard.pdf` (kopyası `docs/final/` altında). Son teslim: **3 Aralık 2026**. Teslim: en fazla 5 dakikalık ekran kaydı (Demo → Mimari → Kararlar), ödev Drive klasörüne.

## 1. Tek cümle

BizCard kartvizitindeki sohbet, AtölyeKart'ın ürün bilgisi asistanına bağlanır; asistan ürün bakımını RAG ile anlatır ve kargo sigortası için **deterministik olarak hesaplanmış, demo amaçlı** bir örnek teklif hazırlar.

## 2. Kararlar (22.11.2026)

| Konu | Karar |
| --- | --- |
| Sektöre özel özellik | A′: kargo sigortası örnek teklif asistanının sade sürümü. Prim Code node/alt workflow'da hesaplanır; AI fiyat hesaplamaz ve uydurmaz. Tarife değerleri kullanıcı onayına kadar taslaktır (`sigorta-tarife-taslagi.md`). |
| Canlı sistemler | AtölyeKart'ın canlı sipariş/stok akışı, canlı RAG, Validation ve Error-Handler **değişmez**. Final için yeni workflow seti kurulur. |
| İsimlendirme | Yeni final workflow'ları `atolyekart-final-*` standardına uyar; eski ve test workflow'ları belgelenmiş istisnadır (`isimlendirme-standardi.md`). |
| Hata bildirimi | Telegram tasarımı test kopyasında hazırlanır; gerçek mesaj ayrı onayla (`yedekleme-ve-hata-bildirimi.md`). |
| BizCard bağlantısı | Tarayıcı n8n'e doğrudan gitmez. bizcard2'ye bağımlılıksız küçük bir `/api/chat` sunucu fonksiyonu eklenir; n8n'e Basic Auth ile gider (AtölyeKart'taki desenin aynısı). |

**Güncelleme (24.11.2026), BizCard:** PDF iki ayrı şeyden söz eder:
- **Bağlantı:** Botun BizCard'a bağlanması. Parça tablosunda "Önerilen ek"tir; zorunlu beş parçanın arasında değildir. Bu nedenle bizcard2 proxy'sinin AtölyeKart final sistemine eklenmesi **isteğe bağlıdır**. Yukarıdaki karar (proxy deseni) bağlantı yapılırsa uygulanacak yöntemi tanımlar; bağlantıyı zorunlu kılmaz. Proxy (6. aşama adım E) kullanıcı kararıyla beklemede.
- **Tasarım ve işlev:** BizCard'ın kendisinin işlevi ve tasarımı. Puanlamanın 4. sorusunda ("BizCard işlevi ve tasarımı") ve teslim kontrol listesinde ("BizCard tasarımı ve işlevi") ayrı bir madde olarak geçer. PDF bu maddeyi bağlantı şartına bağlamaz; bağlantı maddesinden ayrı değerlendirilir.

## 3. Kapsam

**Dahil:**

- `atolyekart-final-asistan`: Webhook girişi → AI Agent (`gpt-4.1-mini`) → Redis hafıza (final'e özel anahtar) → araçlar:
  - "Product Documents": mevcut Qdrant koleksiyonu `atolyekart_product_knowledge` (salt okuma)
  - "Sigorta Şartları": yeni koleksiyon `atolyekart_sigorta_demo`
  - "Prim Hesapla": alt workflow `atolyekart-final-prim-hesapla`
- `atolyekart-final-hata-yakalayici`: Error Trigger → mesaj → Telegram (onaya bağlı).
- `atolyekart-final-yedekleme`: zamanlanmış yedek → Google Drive.
- bizcard2: sohbetin bağlanması, proxy ve sohbet alanının altında her zaman görünen sabit demo uyarısı (`sigorta-tarife-taslagi.md` bölüm 7).
- Testler: prim hesabı birim testleri, sigorta RAG soru seti, hafıza, hata yolu, proxy güvenlik testleri.
- Video: Demo → Mimari → Kararlar (en son faz).

**Dahil değil:** gerçek sigorta şirketi entegrasyonu, gerçek poliçe/ödeme/müşteri verisi, stok düşürme, canlı sipariş göndermek, e-posta göndermek, ücretli yeni servis, AtölyeKart canlı sitesinde değişiklik.

## 4. Zorunlu parçaların karşılığı

| PDF maddesi | Final'deki karşılığı | Durum (22.11.2026) | Durum (24.11.2026): yalnızca kanıtlananlar |
| --- | --- | --- | --- |
| Webhook | `atolyekart-final-asistan` Webhook node'u (bizcard2 proxy'si çağırır) | Desen canlıda var; final workflow'u yok | ◐ ruOv webhook'u yayında, Basic Auth var. Gerçek HTTP ile ölçülenler: 401 (K1/K2), 503 (H7-2/H7-5). Başarılı (200) yanıt gerçek HTTP ile ölçülmedi; başarılı turlar n8n'de elle çalıştırıldı (R1–R6, D3'te R1 #516). |
| AI adımı | AI Agent + araç seçimi + teklif özeti | Desen var | ✅ n8n elle çalıştırmada: AI Agent (gpt-4.1-mini), regresyon R1–R6 geçti (`asama-5-final-asistan-plan.md` §8) |
| RAG | İki Qdrant koleksiyonu | Ürün koleksiyonu var; sigorta koleksiyonu yok | ✅ n8n elle çalıştırmada: Product Documents (Qdrant) R1 #516'da kullanıldı; Sigorta Şartları alt workflow'u (Q8hr) 5. aşama testlerinde çağrıldı. Q8hr yanıt kalitesindeki sınırlar §8'de. |
| Hafıza | Redis Chat Memory (oturum kimliği BizCard'dan) | Desen var | ✅ Redis Chat Memory (`atolyekart-final:<sessionId>`, 7 gün). Önceki testlerin anahtarları Redis'te liste türünde (7. aşama H7-0). Hafıza sorusunun içerik ölçütü elle regresyonda (`asama-5-final-asistan-plan.md` §8). |
| Hata ağı | Retry + Respond to Webhook hata yanıtı + error workflow + bildirim | Kısmen (bildirim ve retry yok) | ◐ Gerçek production isteğinde doğrulananlar: retry (Agent 3 × 2 sn), 503 yanıtı, `errorWorkflow` → IlJ0, bildirim metni, 10 dakikalık sınır (7. aşama). **Bildirim gönderilmiyor:** Telegram düğümü devre dışı (karar bekliyor). **Bilinen sınırlama:** Alt workflow hatasında Agent hatayı yakalar; "Yanıt (200)" düğümündeki metin güvenli ve prim tutarı içermiyor (elle test, 25.11; gerçek ziyaretçi yoktu). Production'da IlJ0 bildirimi beklenmez; bu, production testiyle doğrulanmadı (`asama-7-hata-agi-plan.md` bulgu 4). |
| Sektöre özel | Kargo sigortası örnek teklifi | Yok | ✅ n8n elle çalıştırmada: Prim Hesapla (14IY) ve Sigorta Şartları (Q8hr) yayında; prim tutarları regresyonda doğrulandı (`asama-5-final-asistan-plan.md` §8) |
| BizCard bağlantısı | bizcard2 → `/api/chat` → n8n | Arayüz var, bağlantı yok | ⏸ İsteğe bağlı (PDF: "Önerilen ek"). Yapılmadı; adım E beklemede. |
| BizCard tasarımı/işlevi | Mevcut kart + sohbet + demo uyarısı | Kart yayında; sohbet bağlı değil | Bağlantıdan ayrı bir puanlama maddesi. Bu aşamalarda BizCard'da çalışılmadı; değerlendirilmedi. |

## 5. Kabul ölçütleri

1. BizCard'da üç mesajlık demo (bakım sorusu → teklif → hafıza sorusu) 3 provada kesintisiz çalışır.
2. Prim her zaman alt workflow çıktısıyla aynıdır; 12 kupa gibi limit aşımında teklif verilmez.
3. Belgede olmayan sigorta sorusuna "bu bilgi demo şartlarında yok" denir (uydurma yok).
4. Bilerek bozulan bir adımda ziyaretçi anlaşılır bir hata görür, handler çalışır, bildirim metni üretilir.
5. REST script'i tüm workflow'ları listeler; final workflow'larının hepsi "uygun" çıkar.
6. Drive'da en az bir yedek dosyası vardır ve içindeki workflow sayısı REST listesiyle aynıdır.

Durum (23.11.2026):
- **Hata ağının n8n tarafı doğrulandı (24.11.2026):** Gerçek production isteğinde 503 ve sabit yanıt metni gözlendi; IlJ0 tetiklendi, bildirim metni üretildi ve 10 dakikalık sınır doğrulandı (`asama-7-hata-agi-plan.md`). BizCard arayüzünden uçtan uca demo yapılmadı; Telegram gönderimi kapalı.
  - Ek test (25.11.2026, elle çalıştırma; HTTP durum kodu ölçülmedi, gerçek ziyaretçi yoktu): Alt workflow hatasında "Yanıt (200)" düğümündeki metin güvenliydi ve prim tutarı içermiyordu; IlJ0 tetiklenmedi. Production'da bildirim üretilmemesi bilinen sınırlama olarak kaldı (`asama-7-hata-agi-plan.md` §8 ve bulgu 4).
- **Kabul ölçütü 1 açık:** Ölçüt "BizCard'da" demoyu tarif ediyor; BizCard bağlantısı isteğe bağlı olduğu için ölçütün kendisi de buna bağlı. Bağlantı yapılmazsa provaların hangi yoldan yapılacağı ve bu ölçütün nasıl yeniden yazılacağı ayrıca kararlaştırılır.
- **Kabul ölçütleri 2 ve 3:** Bu belgede ayrı bir durum kaydı yok. İlgili testler `asama-5-final-asistan-plan.md` dosyasında; burada karşılandı olarak işaretlenmedi.
- **Kabul ölçütü 5 karşılandı:** REST listesi 36 workflow, 10 final workflow'unun hepsi "uygun" (`isimlendirme-standardi.md` → "Kanıt").
- **Kabul ölçütü 6 karşılandı:** Yedek #514'te 36 workflow var, REST listesiyle aynı (`yedekleme-ve-hata-bildirimi.md` → "Uygulama sonucu").
- **Workflow sayısı (25.11.2026):** n8n'de 38 workflow var; 25.11'de yayınlanmamış iki test workflow'u eklendi (`asama-7-hata-agi-plan.md` §8). Ölçüt 5 ve 6'nın kanıtları 23.11 tarihlidir (36) ve o tarih için geçerlidir. REST script'i ve yedek 25.11'den sonra yeniden çalıştırılmadı.
- Yedekleme workflow'u yayınlanmadığı için günlük otomatik yedek henüz çalışmıyor (6. aşama).

## 6. İki haftalık plan

| Tarih | İş | Çıktı / kanıt |
| --- | --- | --- |
| 22.11 Pz | Denetim; kapsam, isimlendirme, yedekleme/hata ve tarife taslakları; REST script'i | `docs/final/*`, `scripts/n8n-workflow-listesi.mjs` + 8 test |
| 23.11 Pt | REST script'inin canlı çalıştırılması (kullanıcı); tarife onayı; Drive credential'ı (kullanıcı) | Script çıktısı; onaylı tarife |
| 24.11 Sa | `atolyekart-final-yedekleme-test` + ilk elle yedek → Drive | Drive'da dosya, sayım eşleşmesi |
| 25.11 Ça | `atolyekart-final-hata-yakalayici-test` (Telegram kapalı) ve retry deseni | Pin verili çalışma çıktısı |
| 26.11 Pe | Sigorta şartları dokümanı → `atolyekart_sigorta_demo`; `prim-hesapla` alt workflow'u + birim testleri | Koleksiyon parça sayısı; test sonuçları |
| 27.11 Cu | `atolyekart-final-asistan-test`: webhook + agent + iki RAG aracı + prim aracı + Redis | Test çalışmaları |
| **≤ 27.11** | ~~n8n API anahtarı 28.11'de doluyor~~ Güncel değil (23.11.2026): `.env.local`'deki anahtar 28.11'de dolan anahtar değil, yedekleme credential'ının anahtarı 22.12.2026'ya kadar geçerli. REST listesi ve yedekleme 23.11'de tamamlandı. | ✅ |
| 28.11 Ct | Sigorta RAG soru seti (8–10 soru), hafıza ve hata yolu testleri; düzeltmeler | Test tablosu |
| 29.11 Pz | bizcard2 `/api/chat` proxy'si + arayüz bağlantısı + güvenlik testleri (yerelde) | Testler; yerel uçtan uca |
| 30.11 Pz | Onayla: final workflow'larının yayını, bizcard2 Vercel değişkenleri (kullanıcı) ve deploy | Production uçtan uca |
| 1.12 Sa | 3 tam prova; OpenAI bakiyesi kontrolü; demo öncesi kontrol listesi (Docker, tunnel) | Prova notları |
| 2.12 Ça | Video: Demo (~2 dk) → Mimari (~2 dk) → Kararlar (~1 dk) | Video |
| 3.12 Pe | Teslim (Drive klasörü) | |

## 7. Riskler

- **OpenAI bakiyesi (~2 USD):** provalar bakiyeyi bitirebilir; bitince asistan 502 döner. Testler kısa tutulur, bakiye 1.12'de kontrol edilir.
- **Mac/tunnel:** yeniden başlatmada Docker Desktop ve `cloudflared tunnel run n8n-bootcamp` elle açılmalı. Demo kontrol listesine eklenir.
- **AtölyeKart production'ı Vercel Authentication ile korunuyor** (`ssoProtection: all`): giriş yapmamış ziyaretçi Vercel giriş sayfasına yönlenir. Final demosu bizcard2 üzerinden ve n8n'e doğrudan proxy ile yapıldığı için bu koruma demoyu engellemez.
- **T14 tipi model davranışı:** öneriyi kesin hükme çevirme; sigorta yanıtlarında kesin ifade riskine karşı sabit uyarı satırı ve RAG soru setinde ayrı kontrol.
- **Hukuki:** sigorta satışı lisansa tabidir; sabit demo uyarısı hem her sigorta yanıtının sonunda (workflow şablonu) hem BizCard arayüzünde görünür.
- **Alt workflow hatası sessiz kalır:** Prim Hesapla alt workflow'u hata verirse ya da yayından kalkarsa asistan "hesaplanamıyor" türünde bir yanıt verir ve bildirim gelmez (bilinen sınırlama; elle testten ve n8n davranışından çıkarım, `asama-7-hata-agi-plan.md` bulgu 4). Sigorta Şartları için aynı davranış test edilmedi.
- **Prova öncesi kontrol:** 14IY (`atolyekart-final-prim-hesapla-test`) ve Q8hr (`atolyekart-final-sigorta-sartlari-test`) yayında mı (salt okuma). Bu yalnızca bir kontrol maddesidir; workflow'larda değişiklik ya da yayınlama içermez.
- **Katalog sabitleri iki yerde:** `atolyekart-final-prim-hesapla` ürün ID, ad, kategori, fiyat ve stok bilgisini Code node içinde sabit taşır (`server/lib/catalog.js` ve `src/products.js` ile aynı). Sitede fiyat ya da stok değişirse alt workflow'daki Code node da elle güncellenmeli; aksi halde teklif eski değerle hesaplanır.

## 8. Gelecek çalışma (backlog)

Bu bölüm yalnızca not; final kapsamında uygulanmaz.

### Model kaynaklı gözlemler – gelecekte DeepSeek karşılaştırması

- Mevcut OpenAI mini modeli (`gpt-4.1-mini`, temperature 0.2), kaynak bağlamında tam olarak bulunan belge alternatiflerini ve fotoğraf niteleyicilerini yanıt oluştururken kısaltabiliyor ya da atlayabiliyor. Örnek: "kargo takip numarası ya da teslim tutanağı", "birden fazla açıdan", "ambalajın ve kutunun fotoğrafları (iç koruyucu malzeme dahil)".
- Doğrudan cevap cümlesi prompt'ta istenmesine rağmen model bazen yalnızca başlıklı yanıtla başlayabiliyor.
- Bu davranışlar retrieval kaynaklı değil: T1 #448 çalışmasında ilgili ayrıntıların LLM'e giden bağlamda (bölüm 7 parçası) tam metniyle bulunduğu kontrol edildi.
- İleride test workflow'unda (`atolyekart-final-sigorta-sartlari-test`) DeepSeek modeliyle, aynı test soruları ve aynı prompt kullanılarak karşılaştırma yapılabilir. Sonuçlar doğruluk, kaynak sadakati, yanıt formatı ve maliyet açısından değerlendirilir.
- T1 v4 (#449 → #450, alt workflow sürümü `5a097ba6`, kural 25/26 sonrası) kalan kusurlar: belge alternatifi ve fotoğraf niteleyicileri yine kısaltıldı; giriş cümlesine teminat koşulu eklendi (başlıkta tekrar ediyor); soruyla ilgisiz "katalog dışı ürünler" istisnası eklendi ve kaynaktaki "ve limit dışı gönderiler" kısmı düştü. T1 bu haliyle kabul edildi; prompt ve kodda ek değişiklik yapılmadı.
- T2 (#455 → #456, alt workflow sürümü `5f9edfd1`) kalan kusur: sıcaktan erime "Kapsam dışı durumlar"ın yanında "Teminat kapsamı" başlığında da yazıldı (kural 21'e rağmen); soruyla doğrudan ilgili olmayan "Diğer yükümlülükler" başlığı eklendi. İç parça etiketi sızıntısı kodla giderildi (`icEtiketTemizlendi: 1`). 2. aşama bu haliyle kapatıldı (22.11.2026).
- DeepSeek ücretli yeni bir servis olduğu için bu karşılaştırma ayrıca onay gerektirir.

### 5. aşama (final asistan) gözlemleri

- `atolyekart-final-asistan-test` (`ruOvhJ8EtfHvpkrt`) içindeki "Yanıtı tamamla" kodu, modelin yazdığı TL tutarlarını dar bir izin listesiyle denetler. Listede yalnızca aynı turdaki başarılı prim hesabının prim ve sigorta bedeli, limit aşımında sigorta bedeli ve azami bedel, bir de muafiyetin "en az 50 TL" tutarı vardır. Bu yüzden `faca77f7`'den önce, sigorta şartları yanıtındaki "azami bedel 5.000 TL" cümlesi limit aşımı olmayan turlarda yanıttan siliniyordu. F6/F7 sonuçlarına göre kod `faca77f7` ve `400e98ef` sürümlerinde değiştirildi; izin listesinin kendisi değişmedi.
  **Durum (23.11.2026):** `faca77f7`'den itibaren Sigorta Şartları aracı okunabilir bir yanıt döndürürse (`ok: true` ve boş olmayan `yanitGovdesi`), o turda modelin metni kullanılmaz. Aracın `yanitGovdesi` ve `kaynakSatiri` alanları birebir aktarılır ve bu metin tutar denetimine girmez; bu yüzden aracın metnindeki "azami bedel 5.000 TL" artık silinmez. Bu düzeltme yalnızca o durumu kapsar:
  - Araç okunamazsa sabit metin konur.
  - Çelişki koruması devreye girerse (`400e98ef`) sabit tarafsız metin konur.
  - Sigorta aracının çağrılmadığı turlarda dar izin listesi aynen geçerlidir.
  Q8hr'nin yanıt kalitesi ve filtrenin sınırları aşağıda ayrı maddelerde.
- F1 testi prim aracının çıktı biçimini (`intermediateSteps` içindeki `observation` yapısı) doğrulamaz, çünkü F1'de prim aracı çağrılmaz. Bu doğrulama prim aracının çağrıldığı F2 #486'da yapıldı: `observation` `{type:'text', text}` biçiminde gözlemlendi. Bu sarmal `831a7987`'de ele alınmıştı ve kod tutarları (840,00 / 33,60) aracın sonucundan üretti. Kod, son sürümde de tutarı yalnızca araç sonucu okunup bütün alanlar kontrolden geçtiğinde gösterir, aksi halde hiç göstermez.
- **Hafıza: araç sonuçları da saklanıyor.** Redis'e araç çağrıları ve araç sonuçları da yazılıyor (`insuredValue`, `premium` dahil); `asama-5-final-asistan-plan.md` §3'teki varsayım yanlıştı. Kod koruması yine de geçerli, çünkü araç çağrılmayan turda izin verilen tek tutar 50 TL.
- **Hafıza: sigorta turlarında modelin metni saklanıyor.** Ziyaretçi aracın birebir metnini görüyor, ama Redis'e modelin kısalttığı ya da hüküm eklediği metin yazılıyor. Sonraki turlar bu metne dayanabilir.
- **Q8hr yanıt kalitesi:** `Q8hrWLrDUCixAEfn` aynı soruya farklı çalıştırmalarda farklı yanıt veriyor (F6 #493 ile #495) ve dayanaksız hüküm üretebiliyor (F7'de iki kez). Kök neden Q8hr'deki model; final asistan yalnızca filtreliyor, sorunu kaynağında düzeltmiyor.
- **Çelişki korumasının sınırları (`400e98ef`):**
  - Kalıp listesinde olmayan ifadeler yakalanmıyor (ör. "yer almamakla birlikte", "kapsamda değildir"). #499'u yalnızca B kuralı yakaladı.
  - Farklı konular için yazılmış tutarlı metinler de gereksiz yere sabit metne düşebilir.
- **Disclaimer kalıbının sınırları (`7ed1c0d7`):**
  - "prim" için tanınan ekler sınırlı.
  - Büyük ASCII "I" ile yazılan mesajlar ("PRIM", "SIGORTA") eşleşmiyor.
  - Sigortayla ilgisi olmayan "fiyat teklifi" ve "satış primi" de disclaimer ekletiyor; bu kabul edildi.
- **Katalog dışı ürün (F8 #502):** Model Prim Hesapla'yı çağırmadan "katalogda yok" diyor (prompt kural 4). Aracı zorunlu kılmak ayrı bir karar; uygulanmadı.
- **T14 benzeri (F1 #484):** "tercih edilir" ifadesi "kullanın" diye kesinleştirildi. Regresyon R1 (#503, `7ed1c0d7`): "tercih edilir" bu kez korundu, ama "üfleyerek söndürmek … neden olabilir" ifadesi "üfleyerek söndürmeyin" diye kesinleştirildi ve bağlamdaki iki madde atlandı. Kesinleştirilen ifade çalıştırmadan çalıştırmaya değişiyor; kaynak model, kod değil.
- **İz alanı `intermediateStepsBicimi`:** `7ed1c0d7`'de bu alan hâlâ sabit `'dogrulanmadi'` değerini yazıyor; kod alanı hiçbir çalışmada güncellemiyor. Fiilen yapılan iki gözlem ayrı konulardır:
  - **Prim aracı:** F2 #486'da `observation` `{type:'text', text}` biçiminde gözlemlendi ve kod tutarları bundan üretti.
  - **Sigorta aracı:** F6 #495'te dönüştürülmüş ad (`Sigorta_artlar_`) tanındı. Bu, araç adının tanınmasıyla ilgilidir; `intermediateStepsBicimi` alanını doğrulamaz.
  Alanın sabit değeri test raporlarında yanıltıcı olabilir; kod değiştirilmedi.
  Regresyon kontrolünde de alan sabit `'dogrulanmadi'` kaldı:
  - Ana çalışmalar: R1 #503, R2 #504, R3 #506, R4 #507, R5 #509.
  - Prim Hesapla'nın alt çalışmaları (#505, #508, #510) bu alanı üretmez.
  Aynı turda kod araç adlarını (`Product_Documents`, `Prim_Hesapla`) tanıdı ve prim aracının sonucunu ayrıştırdı (`okunamadi: false`); alanın değeri bu durumu yansıtmıyor.
- **Belge tutarsızlıkları** (24.11.2026, 8. aşama: ilgili dosyalara güncel durum notları eklendi; asama-5'teki çelişkinin nedeni doğrulanmadı; 14IY ve Q8hr'nin n8n açıklamaları değişmedi):
  - `asama-3-prim-hesapla-plan.md` §2'deki "errorWorkflow 4. aşamada bağlanır" satırı güncel değil.
  - 14IY ve Q8hr'nin n8n açıklamalarında ve plan dosyalarında "yayınlanmaz" yazıyor, ama ikisi de artık yayınlı.
  - `asama-5-final-asistan-plan.md` §7'deki "taslak alt workflow'lar elle çalıştırmada çağrılabiliyor" notu, F2 #485'in başarısızlık nedeniyle (alt workflow yayınlanmamıştı) çelişiyor.
