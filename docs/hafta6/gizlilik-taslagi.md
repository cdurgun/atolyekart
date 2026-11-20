# gizlilik.html — önerilen değişiklikler (TASLAK v2, uygulanmadı)

Durum: `gizlilik.html` hukukçu incelemesi tamamlanana kadar **değiştirilmez**. Hukuki sorular ayrıca `hukuki-degerlendirme.md` içinde listelenmiştir.

Bu bir taslaktır, nihai hukuki metin değildir. Sayfanın kendisi de "hukukçu tarafından incelenmemiştir" diyor; bu not kalmalı.
⚖️ işaretli maddeler KVKK açısından hukukçu değerlendirmesi gerektirir; metin önerisi yalnızca teknik gerçeği anlatır.
Köşeli parantezler mevcut sayfadaki gibi yer tutucudur.

## v1 → v2 düzeltmeleri (kodla/altyapıyla karşılaştırma sonucu)

| v1 ifadesi | Gerçek durum | Düzeltme |
|---|---|---|
| "IP … asistanda en fazla bir saat" | `server/lib/rate-limit.js`: süresi dolan kayıt hemen silinmez; yalnızca sayaç 5000 anahtara ulaşınca ya da sunucu örneği kapanınca temizlenir. Süre sınırı garanti edilemez. (Aynı durum mevcut "formlarda yaklaşık bir dakika" cümlesi için de geçerli.) | "Sayaç süresi dolunca kullanılmaz; sunucu örneği kapanınca bellekten silinir; diske yazılmaz" |
| Saklama yalnızca "Redis'te 30 gün" | Mesajlar ayrıca n8n çalışma kayıtlarında (execution data) tutulur. Kurulumda budama ayarı açıkça verilmemiş; n8n varsayılanı kullanılıyor (dokümana göre 14 gün — ortamda ayrıca doğrulanmadı). | Ayrı madde eklendi + "Production geçiş planı"nda budama ayarını açıkça koyma önerisi |
| "[OTOMASYON SUNUCUSU SAĞLAYICISI] üzerinde çalışan otomasyon hizmeti … yurt dışında" | n8n, Redis ve Qdrant site sahibinin kendi bilgisayarında (Docker) çalışıyor; dışarıya n8n'in kendi alan adı alan adı üzerinden açılıyor. Dışarıya Cloudflare Tunnel ile açılıyor (21.11.2026'da çalışan süreçten doğrulandı). | Metin "kendi sunucumuz" + [TÜNEL/BAĞLANTI SAĞLAYICISI] yer tutucusu olarak düzeltildi |
| Paylaşım paragrafında yalnızca n8n ve OpenAI | Sohbet mesajları önce Vercel'deki `/api/chat` üzerinden geçer (Vercel zaten sayfada adı geçen barındırıcı). | Vercel cümleye eklendi |
| Sınırlar: "dakikada 6, saatte 60 mesaj" | Ayrıca tüm sohbet istekleri için dakikada 20 (`chatLimits.all`). | Eklendi |

## 1. Üst not (satır 20) — tarih
- "Son güncelleme: 6 Ekim 2026." → "Son güncelleme: [YAYIN TARİHİ]."

## 2. "Veri sorumlusu" (satır 23)
- "Bu sayfadaki formlar aracılığıyla toplanan" → "Bu sayfadaki formlar ve AtölyeKart Asistan aracılığıyla toplanan"

## 3. "Hangi verileri topluyoruz" — satır 29'dan sonra eklenecek madde
```html
<li>AtölyeKart Asistan: sohbet penceresine yazdığınız mesajlar ve asistanın yanıtları; tarayıcınızda saklanan rastgele bir sohbet oturum kimliği. Lütfen sohbete ad, telefon, adres gibi kişisel bilgi yazmayın.</li>
```
- Satır 30 (Teknik veri: IP) → değişmez.
- Satır 32 yerine: ⚖️ (localStorage'ın çerez benzeri teknoloji sayılıp sayılmadığı ve "çerez kullanılmaz" ifadesinin yeterliliği hukukçuya sorulmalı)
```html
<p>Sitede çerez, reklam ya da izleme aracı kullanılmaz; ödeme bilgisi toplanmaz. Asistan, önceki konuşmanızı yeniden gösterebilmek için tarayıcınızın yerel depolamasında (localStorage) yalnızca rastgele bir oturum kimliği tutar; tarayıcınızın site verilerini silerek bunu kaldırabilirsiniz.</p>
```

## 4. "Verileri neden topluyoruz" — eklenecek madde
```html
<li>Ürünlerimizle ilgili sorularınızı yanıtlamak ve aynı tarayıcıdan döndüğünüzde önceki sohbetinizi gösterebilmek.</li>
```
- Satır 38: "(IP başına dakikada en çok 10 istek)" → "(formlarda IP başına dakikada en çok 10 istek; asistanda IP başına dakikada en çok 20 istek, bunların içinde dakikada en çok 6 ve saatte en çok 60 mesaj)"
- Satır 40 ⚖️: Mevcut cümle "formdaki onay kutusuyla verdiğiniz açık rızaya dayanarak" der. Sohbette onay kutusu yoktur; bu cümle sohbet için **doğru değildir**. Asistan için ayrı bir dayanak cümlesi gerekir:
```html
<p>Asistan sohbetleri [HUKUKİ DAYANAK — hukukçu belirlemeli] dayanağıyla işlenir.</p>
```
  Hukukçuya sorulacaklar: açık rıza mı (o zaman sohbet başlamadan onay alınması gerekir — şu an arayüzde yok), sözleşmenin kurulması/meşru menfaat mi; yurt dışına aktarım (OpenAI, Vercel) için KVKK m.9 kapsamındaki şartlar.

## 5. "Verileri kimlerle paylaşıyoruz" (satır 43) — sonuna eklenecek ⚖️ (yurt dışı aktarım)
```html
<p>Asistana yazdığınız mesajlar, sitenin barındırıldığı Vercel altyapısı üzerinden kendi işlettiğimiz otomasyon sunucusuna iletilir; bu sunucuya bağlantı [TÜNEL/BAĞLANTI SAĞLAYICISI] üzerinden sağlanır. Yanıt üretmek için mesajlarınız yapay zekâ modeli sağlayıcısı OpenAI'a gönderilir; OpenAI bu verileri kendi saklama politikasına göre tutabilir. Bu sağlayıcıların sunucuları yurt dışında bulunabilir.</p>
```
- Teknik not (sayfaya yazılmaz): OpenAI API'nin saklama süresi bu çalışmada doğrulanmadı; hukukçu/OpenAI sözleşmesi üzerinden kontrol edilmeli.

## 6. "Verileri ne kadar süre saklıyoruz" — eklenecek / değişecek maddeler
```html
<li>Asistan sohbet geçmişi: son mesajınızdan itibaren 30 gün. Bu süre içinde yeni bir mesaj yazarsanız süre yeniden başlar; 30 gün boyunca yazmazsanız konuşma otomatik olarak silinir.</li>
<li>Asistanın teknik işlem kayıtları (hata ayıklama için tutulan, mesajlarınızı da içeren kayıtlar): en fazla [N8N KAYIT SÜRESİ — ayar netleşince yazılacak, ör. 14 gün].</li>
<li>Tarayıcınızdaki sohbet oturum kimliği: siz tarayıcınızın site verilerini silene kadar.</li>
```
- Satır 49 yerine:
```html
<li>IP adresi: yalnızca istek sınırını uygulamak için sunucu belleğinde tutulur; sayaç süresi dolunca (formlarda bir dakika, asistanda en fazla bir saat) kullanılmaz ve sunucu kapandığında bellekten silinir. Diske ya da kalıcı bir kayda yazılmaz.</li>
```
  (Not: Vercel'in kendi istek günlükleri IP içerebilir; bu Vercel'in politikasına tabidir. ⚖️ sayfada belirtilip belirtilmeyeceği hukukçuya sorulmalı.)
- Satır 51 "Süre dolduğunda ya da rızanızı geri aldığınızda verileriniz silinir." ⚖️ Sohbet için açık rıza yoksa "rızanızı geri aldığınızda" ifadesi sohbete uymaz.

## 7. "Haklarınız" — ⚖️ operasyonel boşluk
- Ziyaretçi sohbetinin silinmesini isterse sohbeti bulabilmemiz için oturum kimliğini bilmemiz gerekir; arayüz bu kimliği göstermiyor ve "sohbeti sil / yeni sohbet" düğmesi yok. Öneri (onay gerektirir, kod değişikliği): sohbet penceresine "Sohbeti sil" düğmesi ya da başvuru için kimliği gösteren bir alan. Hukukçu, silme talebinin nasıl karşılanacağını metinde nasıl anlatacağımızı belirlemeli.

## Doğrulanan teknik dayanak
- Redis Chat Memory `sessionTTL` = 2592000 sn (30 gün), her yazmada yenilenir; ölçülen anahtarların tamamında TTL var.
- Oturum kimliği: `localStorage['atolyekart-chat-session']`, `/^[A-Za-z0-9-]{8,64}$/` (`chatClient.js:51-57`).
- Sohbet sınırları: `server/routes/chat.js:23-26` → tüm istekler 20/dk; mesaj 6/dk ve 60/saat.
- IP sayacı: `server/lib/rate-limit.js` — süresi dolan kayıt yalnızca 5000 anahtar sınırında ya da süreç kapanınca temizlenir.
- Proxy n8n'e yalnızca `action`, `sessionId`, `chatInput` gönderir; IP'yi iletmez (`chat.js` `callN8n`). Sunucu günlüğüne mesaj içeriği yazılmaz (yalnızca durum kodu/hata türü).
- n8n çalışma kaydı budama ayarı ortam değişkeni olarak verilmemiş (`EXECUTIONS_*` yok) → n8n varsayılanı.
