# AtölyeKart Webhook Formatı

AtölyeKart'tan dışarı giden olay bildirimlerinin sözleşmesi. Stage 1.6'da form olayları (`order.requested`, `stock_alert.requested`) bu sözleşmeyle üretilir ve bir webhook adapter'ına verilir; gerçek adres bağlanana kadar mock adapter çalışır. Gönderen ya da alan her kod bu şekle uyar.

## İstek

- **Yöntem:** `POST`, gövde UTF-8 JSON.
- **Başlıklar:**

| Başlık | Değer |
| --- | --- |
| `Content-Type` | `application/json; charset=utf-8` |
| `X-Atolyekart-Event` | olay adı, gövdedeki `event` ile aynı |
| `X-Atolyekart-Delivery` | gövdedeki `id` ile aynı |
| `X-Atolyekart-Signature` | `sha256=<hex>`; ham gövdenin paylaşılan gizli anahtarla HMAC-SHA256 özeti. Yalnızca sunucudan gönderilen isteklerde bulunur (aşağıya bakın) |

- **Tarayıcıdan gelen istekler imzasızdır.** React ve CDN sürümleri isteği doğrudan tarayıcıdan gönderir; gizli anahtar istemci kodunda saklanamayacağı için `X-Atolyekart-Signature` başlığı gönderilmez. Alıcı bu isteklerde imza beklemez. İleride araya bir sunucu katmanı girerse imza orada üretilir (server-side signing) ve alıcı doğrulamayı o zaman açar.

- **Başarı:** alıcı 5 saniye içinde `2xx` döner. Diğer her yanıt başarısız teslimat sayılır.
- **Tekrar:** başarısız teslimat aynı `id` ile yeniden gönderilir. Alıcı `id`'yi daha önce gördüyse olayı yeniden işlemeden `2xx` döner.

## Zarf

Her olay aynı zarfı taşır; olaya özgü içerik `data` altındadır.

```json
{
  "id": "evt_0f8c2a4e-6b1d-4c3a-9e57-2d1b7a9c4f10",
  "event": "product.viewed",
  "version": "1",
  "occurred_at": "2026-10-03T18:42:07Z",
  "source": "react",
  "page_url": "https://ornek-alan-adi.com/#urunler",
  "data": {}
}
```

| Alan | Tip | Kural |
| --- | --- | --- |
| `id` | metin | `evt_` + UUID v4. Olay başına benzersiz; tekrar gönderimde aynı kalır |
| `event` | metin | `nesne.eylem`, küçük harf (aşağıdaki listeden) |
| `version` | metin | Format sürümü. Geriye uyumsuz değişiklikte artar |
| `occurred_at` | metin | ISO 8601, UTC, saniye hassasiyeti, `Z` ile biter |
| `source` | metin | Olayı üreten sürüm: `"react"` ya da `"cdn"` |
| `page_url` | metin | Olayın gerçekleştiği sayfanın tam adresi |
| `data` | nesne | Olaya özgü içerik; boş olabilir, `null` olmaz |

## Adlandırma

- Alan adları `snake_case` ve İngilizcedir.
- Değerler veriden olduğu gibi gelir: ürün adı ve kategori Türkçe kalır.
- Bilinmeyen değer için alan gönderilir ve `null` verilir; alan atlanmaz.
- Yeni alan eklemek geriye uyumludur (`version` değişmez). Alan silmek, yeniden adlandırmak ya da tip değiştirmek `version`'ı artırır.

## Ürün nesnesi

Ürün geçen her olayda aynı şekil kullanılır.

```json
{
  "slug": "luna-seramik-kupa",
  "name": "Luna Seramik Kupa",
  "category": "Seramik",
  "price": { "amount": 420, "currency": "TRY" },
  "image_url": "https://ornek-alan-adi.com/images/luna-seramik-kupa.jpg"
}
```

| Alan | Kural |
| --- | --- |
| `slug` | Ürünün kalıcı kimliği: görsel dosya adının uzantısız hali. Stage 1.3'te veri modeline `id` gelirse `slug` yine korunur |
| `price.amount` | Sayı. Sitedeki `"420 TL"` metninden sayıya çevrilir |
| `price.currency` | ISO 4217 kodu; `"TRY"` |
| `image_url` | Tam adres. Fotoğraf yoksa `null` |

## Olaylar

| `event` | Ne zaman | `data` |
| --- | --- | --- |
| `catalog.viewed` | Katalog sayfası açıldığında | `{ "product_count": 3, "entry": "direct" }` |
| `product.viewed` | Bir ürün kartı ekranda göründüğünde | `{ "product": <ürün nesnesi>, "position": 1 }` |
| `catalog.qr_displayed` | Katalog QR kodu üretildiğinde | `{ "target_url": "<QR'ın kodladığı adres>" }` |
| `order.requested` | "Sipariş Ver" formu geçerli değerlerle gönderildiğinde | `{ "product": <ürün nesnesi>, "customer": { "name": "Ayşe Yılmaz", "phone": "+905321234567" } }` |
| `stock_alert.requested` | "Stok Bildirimi İste" formu geçerli değerlerle gönderildiğinde | `{ "product": <ürün nesnesi>, "customer": { "name": "Ayşe Yılmaz", "email": "ayse@ornek.com" } }` |

- `entry`: sayfaya nasıl gelindiği; `"direct"` ya da `"qr"`. QR'dan gelişi ayırt etmek için QR adresine `?kaynak=qr` eklenir; bu parametre yoksa değer `"direct"` olur.
- `position`: ürünün listedeki sırası, 1'den başlar.
- `customer.name`: baştaki ve sondaki boşluklar atılmış, ardışık boşluklar teke indirilmiş ad; en az 2 karakter.
- `customer.phone`: Türkiye cep numarası, E.164 biçiminde (`+905XXXXXXXXX`). Ziyaretçi `0532 123 45 67` yazsa da payload'a bu biçimde girer.
- `customer.email`: boşlukları atılmış, küçük harfe çevrilmiş e-posta adresi.

Stage 1.6'da yalnızca iki form olayı üretilir; `catalog.*` ve `product.viewed` olayları tanımlıdır ama henüz gönderilmez.

Yeni olay eklerken: adı `nesne.eylem` biçiminde ve geçmiş zamanda yaz, bu tabloya ekle, `data` şeklini örnekle göster.

## Tam örnek

```http
POST /webhooks/atolyekart HTTP/1.1
Content-Type: application/json; charset=utf-8
X-Atolyekart-Event: product.viewed
X-Atolyekart-Delivery: evt_0f8c2a4e-6b1d-4c3a-9e57-2d1b7a9c4f10
X-Atolyekart-Signature: sha256=5d41402abc4b2a76b9719d911017c592ae8f3c1d0c2b7e6f4a1d9e8c7b6a5f40

{
  "id": "evt_0f8c2a4e-6b1d-4c3a-9e57-2d1b7a9c4f10",
  "event": "product.viewed",
  "version": "1",
  "occurred_at": "2026-10-03T18:42:07Z",
  "source": "cdn",
  "page_url": "https://ornek-alan-adi.com/#urunler",
  "data": {
    "product": {
      "slug": "amber-soya-mum",
      "name": "Amber Soya Mum",
      "category": "Doğal Mumlar",
      "price": { "amount": 350, "currency": "TRY" },
      "image_url": "https://ornek-alan-adi.com/images/amber-soya-mum.jpg"
    },
    "position": 2
  }
}
```

## Gizlilik

Kişisel veri yalnızca ziyaretçinin kendi gönderdiği form olaylarında taşınır; görüntüleme olaylarında taşınmaz. Form olayları yalnızca ziyaretçinin forma yazdığı alanları (ad ve telefon ya da e-posta) içerir. IP adresi ya da cihaz kimliği hiçbir olayda gönderilmez.
