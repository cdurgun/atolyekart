# AtölyeKart Webhook Formatı

AtölyeKart sunucusundan (`/api`) dışarı giden form bildirimlerinin sözleşmesi. Gövde yalnızca aşağıdaki alanları taşır. Gönderen ya da alan her kod bu şekle uyar.

Webhook'u **tarayıcı değil sunucu** gönderir: form `/api/order` ya da `/api/stock-request` adresine istek atar; sunucu doğrular, olayı üretir, imzalar ve `WEBHOOK_URL` adresine iletir. Adres ve gizli anahtar yalnızca sunucu ortam değişkenlerindedir.

## İstek

- **Yöntem:** `POST`, gövde UTF-8 JSON.
- **Başlıklar:**

| Başlık | Değer |
| --- | --- |
| `Content-Type` | `application/json; charset=utf-8` |
| `X-Atolyekart-Event` | olay adı, gövdedeki `event` ile aynı |
| `X-Atolyekart-Signature` | `sha256=<hex>`: ham gövdenin `WEBHOOK_SECRET` ile HMAC-SHA256 özeti |

- **Başarı:** alıcı 5 saniye içinde `2xx` döner. Diğer her yanıt başarısız teslimat sayılır; API ziyaretçiye `502` döner ve ziyaretçi formu yeniden gönderebilir.
- **İmza doğrulama (alıcıda):** ham gövdenin HMAC-SHA256 özeti aynı gizli anahtarla hesaplanır ve başlıktaki değerle sabit zamanlı karşılaştırılır. Canlıda `WEBHOOK_URL` ya da `WEBHOOK_SECRET` eksikse olay gönderilmez. Yerelde adres boşsa olay sunucu günlüğüne `[webhook:mock]` ile yazılır.
- **CORS gerekmez:** istek sunucudan sunucuya gider.

## Olaylar

| `event` | Ne zaman | Gövde alanları (bu sırayla) |
| --- | --- | --- |
| `order.requested` | "Sipariş Ver" formu geçerli değerlerle gönderildiğinde | `event`, `name`, `productId`, `productName`, `phone`, `email`, `quantity`, `consent`, `source` |
| `stock_alert.requested` | "Stok Bildirimi İste" formu geçerli değerlerle gönderildiğinde | `event`, `name`, `productId`, `productName`, `email`, `consent`, `source` |

Gövde düzdür: sarmalayıcı nesne (`data`, `customer`, `product`) ve `id`, `version`, `occurred_at`, `page_url`, kategori, fiyat ya da görsel adresi gibi ek alanlar yoktur.

## Alanlar

| Alan | Tip | Kural |
| --- | --- | --- |
| `event` | metin | `order.requested` ya da `stock_alert.requested` |
| `name` | metin | Baştaki ve sondaki boşluklar atılmış, ardışık boşluklar teke indirilmiş ad; 2–80 karakter |
| `productId` | metin | Ürünün slug'ı (ör. `amber-soya-mum`). Sunucu kataloğunda (`server/lib/catalog.js`) bulunmalıdır |
| `productName` | metin | Ürün adı. İstemciden alınmaz; sunucu kataloğundan yazılır |
| `phone` | metin | Yalnızca siparişte. Türkiye cep numarası, E.164 biçiminde (`+905XXXXXXXXX`); ziyaretçi `0532 123 45 67` yazsa da bu biçimde girer |
| `email` | metin ya da `null` | Boşlukları atılmış, küçük harfe çevrilmiş, yalnızca ASCII adres. Stok bildiriminde zorunludur. Siparişte isteğe bağlıdır; boş bırakılırsa alan atlanmaz, `null` gönderilir |
| `quantity` | sayı | Yalnızca siparişte. Tam sayı, 1–99; varsayılan 1. Metin değil sayı olarak gönderilir |
| `consent` | boolean | Her zaman `true`: ziyaretçi açık rıza kutusunu işaretlemeden olay üretilmez |
| `source` | metin | İsteği üreten istemci: `"react"` ya da `"mobile"` |

Talep başına tek ürün vardır: bir `productId`, bir `productName`, siparişte bir `quantity`.

## Örnekler

Sipariş:

```http
POST /webhooks/atolyekart HTTP/1.1
Content-Type: application/json; charset=utf-8
X-Atolyekart-Event: order.requested
X-Atolyekart-Signature: sha256=<hex>

{
  "event": "order.requested",
  "name": "Ayşe Yılmaz",
  "productId": "amber-soya-mum",
  "productName": "Amber Soya Mum",
  "phone": "+905321234567",
  "email": "ayse@ornek.com",
  "quantity": 3,
  "consent": true,
  "source": "react"
}
```

E-postasız sipariş: aynı gövde, `"email": null`.

Stok bildirimi:

```json
{
  "event": "stock_alert.requested",
  "name": "Ayşe Yılmaz",
  "productId": "terra-minimal-kolye",
  "productName": "Terra Minimal Kolye",
  "email": "ayse@ornek.com",
  "consent": true,
  "source": "mobile"
}
```

## İstemci → API gövdesi

Formların `/api`'ye gönderdiği gövde olayın bir alt kümesidir; `event` ve `productName` taşımaz (istemci gönderse de yok sayılır):

| Uç nokta | Gövde alanları | Stok kuralı |
| --- | --- | --- |
| `POST /api/order` | `name`, `productId`, `phone`, `email`, `quantity`, `consent`, `source` | Ürün stokta olmalı; değilse `409 out_of_stock` |
| `POST /api/stock-request` | `name`, `productId`, `email`, `consent`, `source` | Ürün stokta olmamalı; stoktaysa `409 in_stock` |

Yanıt: başarıda `{ "ok": true }`; hatada `{ "ok": false, "error": "<kod>", "message": "<Türkçe metin>", "errors": { "<alan>": "<metin>" } }` (`errors` yalnızca `400 validation` yanıtında). Yanıtta teknik ayrıntı ya da stack trace bulunmaz.

## Sözleşmeyi değiştirme

Olay gövdesi yalnızca `server/lib/webhook.js` içinde (`eventBody`, `buildEvent`), istemci gövdesi yalnızca `src/webhook/payload.js` içinde (`requestKinds`, `buildRequestBody`) tanımlıdır. Adapter gövdeyi olduğu gibi gönderir, alan üretmez.

## Gizlilik

Kişisel veri yalnızca ziyaretçinin kendi gönderdiği ve açık rıza verdiği form olaylarında taşınır. Gövde yalnızca ziyaretçinin forma yazdığı alanları (ad, telefon, e-posta) ve seçtiği ürünü içerir. IP adresi ya da cihaz kimliği webhook'a gönderilmez; IP yalnızca rate limit için sunucu belleğinde yaklaşık bir dakika tutulur.
