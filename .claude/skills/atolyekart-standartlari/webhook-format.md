# AtölyeKart Webhook Formatı

AtölyeKart'tan dışarı giden form bildirimlerinin sözleşmesi. Gövde, ödevde tanımlanan sözleşmeyle birebir aynıdır: yalnızca aşağıdaki alanları taşır, başka alan eklenmez. Gönderen ya da alan her kod bu şekle uyar.

Gerçek adres bağlanana kadar mock adapter çalışır; adres verilince aynı gövde HTTP ile gönderilir.

## İstek

- **Yöntem:** `POST`, gövde UTF-8 JSON.
- **Başlıklar:**

| Başlık | Değer |
| --- | --- |
| `Content-Type` | `application/json; charset=utf-8` |
| `X-Atolyekart-Event` | olay adı, gövdedeki `event` ile aynı |

- **Başarı:** alıcı 5 saniye içinde `2xx` döner. Diğer her yanıt başarısız teslimat sayılır; ziyaretçi formu yeniden gönderebilir.
- **Tarayıcıdan gelen istekler imzasızdır.** React ve CDN sürümleri isteği doğrudan tarayıcıdan gönderir; gizli anahtar istemci kodunda saklanamayacağı için imza başlığı gönderilmez. İleride araya bir sunucu katmanı girerse imza orada üretilir (server-side signing; `X-Atolyekart-Signature: sha256=<hex>`, ham gövdenin HMAC-SHA256 özeti).
- **CORS:** özel başlık ve JSON içerik türü ön kontrol (`OPTIONS`) isteği doğurur; alıcı CORS başlıklarını döndürmelidir.

## Olaylar

| `event` | Ne zaman | Gövde alanları (bu sırayla) |
| --- | --- | --- |
| `order.requested` | "Sipariş Ver" formu geçerli değerlerle gönderildiğinde | `event`, `name`, `productId`, `productName`, `phone`, `email`, `quantity`, `source` |
| `stock_alert.requested` | "Stok Bildirimi İste" formu geçerli değerlerle gönderildiğinde | `event`, `name`, `productId`, `productName`, `email`, `source` |

Gövde düzdür: sarmalayıcı nesne (`data`, `customer`, `product`) ve `id`, `version`, `occurred_at`, `page_url`, kategori, fiyat ya da görsel adresi gibi ek alanlar yoktur.

## Alanlar

| Alan | Tip | Kural |
| --- | --- | --- |
| `event` | metin | `order.requested` ya da `stock_alert.requested` |
| `name` | metin | Baştaki ve sondaki boşluklar atılmış, ardışık boşluklar teke indirilmiş ad; en az 2 karakter |
| `productId` | metin | Ürünün slug'ı: görsel dosya adının uzantısız hali (ör. `amber-soya-mum`). Ürün modelinde ayrı bir `id` alanı yoktur |
| `productName` | metin | Ürün adı, veriden olduğu gibi (Türkçe) |
| `phone` | metin | Yalnızca siparişte. Türkiye cep numarası, E.164 biçiminde (`+905XXXXXXXXX`); ziyaretçi `0532 123 45 67` yazsa da bu biçimde girer |
| `email` | metin ya da `null` | Boşlukları atılmış, küçük harfe çevrilmiş adres. Stok bildiriminde zorunludur. Siparişte isteğe bağlıdır; boş bırakılırsa alan atlanmaz, `null` gönderilir |
| `quantity` | sayı | Yalnızca siparişte. Tam sayı, 1–99; varsayılan 1. Metin değil sayı olarak gönderilir |
| `source` | metin | İsteği üreten sürüm: `"react"` ya da `"cdn"`. İki sürümün gövdesi arasındaki tek fark budur |

Talep başına tek ürün vardır: bir `productId`, bir `productName`, siparişte bir `quantity`.

## Örnekler

Sipariş:

```http
POST /webhooks/atolyekart HTTP/1.1
Content-Type: application/json; charset=utf-8
X-Atolyekart-Event: order.requested

{
  "event": "order.requested",
  "name": "Ayşe Yılmaz",
  "productId": "amber-soya-mum",
  "productName": "Amber Soya Mum",
  "phone": "+905321234567",
  "email": "ayse@ornek.com",
  "quantity": 3,
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
  "source": "cdn"
}
```

## Sözleşmeyi değiştirme

Alan adları, sırası ve kümesi ödev sözleşmesinden gelir; alan eklenmez, silinmez, yeniden adlandırılmaz. Sözleşme yalnızca payload katmanında (`src/webhook/payload.js` içindeki `requestKinds` ve `buildRequestEvent`; CDN'de `cdn/forms.js` içindeki karşılığı) tanımlıdır. Adapter gövdeyi olduğu gibi gönderir, alan üretmez.

## Gizlilik

Kişisel veri yalnızca ziyaretçinin kendi gönderdiği form olaylarında taşınır; görüntüleme olaylarında taşınmaz. Gövde yalnızca ziyaretçinin forma yazdığı alanları (ad, telefon, e-posta) ve seçtiği ürünü içerir. IP adresi ya da cihaz kimliği gönderilmez.
