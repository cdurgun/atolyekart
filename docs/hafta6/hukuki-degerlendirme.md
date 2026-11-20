# AtölyeKart Asistan: hukukçu değerlendirmesi gereken konular

Bu liste teknik gözlemlere dayanır; hukuki görüş değildir. Her madde hukukçu tarafından yanıtlanana kadar açık kalır. Metin önerileri için `gizlilik-taslagi.md` dosyasına bakın. `gizlilik.html` bu inceleme bitmeden değiştirilmez.

| # | Konu | Teknik gerçek | Hukukçuya soru | Durum |
|---|---|---|---|---|
| H1 | Sohbetin hukuki dayanağı | Sohbet penceresinde onay kutusu yok. Mevcut sayfa "formdaki onay kutusuyla verdiğiniz açık rıza" diyor; bu sohbet için geçerli değil. | Dayanak açık rıza mı, sözleşme mi, meşru menfaat mi? Açık rıza gerekiyorsa sohbet başlamadan onay alınmalı mı? | Açık |
| H2 | Yurt dışına aktarım (KVKK m.9) | Mesajlar Vercel (barındırma) üzerinden geçer ve yanıt için OpenAI'a gönderilir. | Aktarım hangi şartla yapılabilir? Aydınlatma metninde nasıl anlatılmalı? | Açık |
| H3 | OpenAI'ın saklama süresi | OpenAI'ın API verisini ne kadar sakladığı bu çalışmada doğrulanmadı. | Sözleşme/DPA kontrolü; metinde ne yazılmalı? | Açık |
| H4 | localStorage oturum kimliği | Tarayıcıda rastgele bir oturum kimliği tutuluyor; sayfa "çerez kullanılmaz" diyor. | localStorage çerez benzeri teknoloji sayılır mı? Bilgilendirme yeterli mi, onay gerekir mi? | Açık |
| H5 | Saklama süreleri | Redis'te son mesajdan itibaren 30 gün (kayan). n8n çalışma kayıtlarında ayrı bir süre: şu an n8n varsayılanı, açıkça ayarlanmadı. IP sayacı bellek içi, kalıcı değil. | Süreler orantılı mı? Hepsi aydınlatma metnine yazılmalı mı? | Açık; n8n süresi teknik olarak sabitlenmeli |
| H6 | İlgili kişinin silme talebi (KVKK m.11) | Ziyaretçinin sohbetini bulmak için oturum kimliği gerekir; arayüz bunu göstermiyor; "sohbeti sil" düğmesi yok. | Talep nasıl karşılanmalı? Arayüzde silme düğmesi gerekli mi? | Açık; çözüm kod değişikliği gerektirir |
| H7 | "Rızanızı geri aldığınızda silinir" cümlesi | Sohbet rızaya dayanmıyorsa bu cümle sohbete uymaz. | Sohbet için doğru ifade ne olmalı? | Açık |
| H8 | Vercel istek günlükleri | Vercel'in kendi günlükleri IP içerebilir. | Sayfada belirtilmeli mi? | Açık |
| H9 | Ziyaretçinin sohbete kişisel veri yazması | Uyarı metni öneriliyor ("ad, telefon, adres yazmayın"); teknik engel yok. | Uyarı yeterli mi? | Açık |
| H10 | Bağlantı/tünel sağlayıcısı | n8n kendi bilgisayarımızda çalışıyor ve dışarıya bir Cloudflare tüneli üzerinden açılıyor (`cloudflared`). | Tünel sağlayıcısı veri işleyen sayılır mı? Metinde adı geçmeli mi? | Açık |
| H11 | Veri sorumlusu bilgileri | Sayfadaki şirket bilgileri yer tutucu. | Gerçek bilgiler. | Açık |
