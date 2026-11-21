# Hafta 6 teslim özeti

Zorunlu teknik maddeler (ödev PDF'si) tamamlandı. MCP bağlantısı PDF'de ileri seviye ve zorunlu olmayan pratik olarak geçer; projede ayrıca kullanıldı.

- [x] **1. Redis ile ziyaretçi bazlı Chat History**: n8n Redis Chat Memory, anahtar `<sessionId>__Redis_Chat_Memory`, 30 gün kayan TTL. Oturum kimliği tarayıcıda (`localStorage['atolyekart-chat-session']`); pencere açılınca geçmiş yüklenir, "Yeni sohbet" yeni kimlik üretir. Testler: `src/features/luna-atelier-preview/chat/chatClient.test.js`, `server/chat.test.js`. Commit'ler: `fa84552`, `6430b94`, `af7fae7`.
  - Canlıda doğrulandı (21.11.2026): yerel `/api/chat` → Basic Auth → canlı n8n; aynı `sessionId` ile iki mesaj 200 döndü, ikinci mesajda ilk mesajdaki test kodu hatırlandı, `loadPreviousSession` 4 mesaj döndürdü, Redis anahtarının TTL'i ≈ 30 gün. Ayrıntı: `uretim-hazirlik.md` bölüm 6.
- [x] **2. n8n API ile haftalık sipariş sorgusu**: `scripts/haftalik-siparis-api.mjs` (yalnızca GET). Sonuç aşağıda.
- [x] **3. CLAUDE.md güncellemesi**: Hafta 6 kapsamı, Asistan bölümü ve script komutu.

## Haftalık sipariş sorgusu (16–22 Kasım 2026, Europe/Istanbul)

Komut: `node --env-file=.env.local scripts/haftalik-siparis-api.mjs` (kullanıcı terminalinde, 21.11.2026). Çıktıda anahtar, n8n adresi ve kişisel veri yoktur.

```
Workflow       : atolyekart-siparis (UwG1w0v0h9ekh8u6)
Aralık (İst.)  : 16.11.2026 00:00:00 – 22.11.2026 23:59:59
Uç nokta       : GET /api/v1/executions?workflowId=…&status=success (1 sayfa, 2 kayıt tarandı)
Başarılı çalışma sayısı: 1
  - ID 136 | başlangıç 17.11.2026 17:07:42 | bitiş 17.11.2026 17:07:52 | mod webhook

Karşılaştırma:
  MCP sorgusu    : 1 çalışma (ID 136) → AYNI
  Google Sheets  : 1 satır (satır 12, 17.11.2026 17:07:45) → ID 136 ile eşleşiyor

Sipariş sayımı: ham kayıt 1 | gerçek olduğu doğrulanmış 0 | test olma ihtimali yüksek, doğrulanmamış 1 (satır 12)
```

| Kaynak | Sonuç |
| --- | --- |
| n8n REST API | 1 başarılı çalışma (ID 136) |
| n8n MCP (`search_workflow_executions`) | 1 çalışma (ID 136) |
| Google Sheets `siparisler` | 1 satır (satır 12), ID 136 ile eşleşir |

- Ham kayıt: 1. Gerçek olduğu doğrulanmış sipariş: 0. Test olma ihtimali yüksek, doğrulanmamış kayıt: 1 (satır 12; silinmedi, değiştirilmedi).
- Ürün dağılımı (ham kayıt): Luna Seramik Kupa, 1 sipariş, 1 adet.
- REST API tarih filtresi sunmaz; aralık script içinde uygulanır ve sabittir.

## Kapanış notları (zorunlu maddelerin dışında)

- n8n canlı geçişi tamamlandı (21.11.2026; `uretim-hazirlik.md` bölüm 6):
  - Canlı yükleme workflow'u Qdrant'a geçti, iki PDF yeniden yüklendi (21 parça, çift kayıt yok) ve workflow yayından kaldırıldı.
  - Canlı RAG `7126796b`: Basic Auth (kimliksiz 401, yanlış kimlik 403), Redis bellek, Qdrant ve v4 sistem mesajı. 14 soruluk test: 11 geçti, 3 kısmi (biçim), 0 başarısız.
  - Yerel uçtan uca test (`/api/chat`, aynı `sessionId`, 200, geçmiş hatırlandı) geçti.
- Production'a geçildi (21.11.2026; `uretim-hazirlik.md` bölüm 6, "Production deploy"):
  - Vercel Production değişkenleri (`N8N_CHAT_*`) kullanıcı tarafından girildi; `855a533` push edildi; GitHub entegrasyonunun başlattığı deploy READY.
  - Production testleri geçti: geçersiz gövde 400; aynı oturumla iki gerçek mesaj 200 ve test kodu hatırlandı; geçmiş yükleme 4 mesaj; Redis TTL ≈ 30 gün; arayüz, "Yeni sohbet" ve 390px; runtime günlüğünde hata ve sır yok. Rollback gerekmedi.
  - WAF rate limit kuralının host koşulu kaldırıldı; `/api/chat` POST için IP başına dakikada 30 istek sınırı artık production ve Preview'da geçerli (bölüm 3, doğrulandı).
- n8n API anahtarı 28.11.2026 00:00 (İstanbul) itibarıyla geçersiz olur; ödevden sonra silinmesi ve `.env.local` içindeki `N8N_API_*` satırlarının kaldırılması önerilir.
- Hukuki maddeler (`hukuki-degerlendirme.md`) açık; `gizlilik.html` değiştirilmedi.
- n8n bağlantısını kapatma planı: `uretim-hazirlik.md` bölüm 7.
