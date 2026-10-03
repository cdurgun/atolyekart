# AtölyeKart — Luna Atelier

Luna Atelier için tek sayfalık bir atölye vitrini: el yapımı seramik, doğal mum ve aksesuar.

İki sürüm birlikte yaşar ve görsel olarak aynıdır:

| Sürüm | Nerede | Nasıl çalışır |
| --- | --- | --- |
| React + Vite | `src/`, `index.html` | `npm install` ardından `npm run dev` |
| Statik (build gerektirmez) | `cdn/` | `cdn/index.html` dosyasını tarayıcıda açın |

## Komutlar

```sh
npm install     # bağımlılıklar
npm run dev     # geliştirme sunucusu
npm run build   # üretim derlemesi
```

## Yapı

```
src/            React uygulaması (App, ProductList → ProductCard → ProductImage, CatalogQR)
cdn/            React'siz statik sürüm (HTML + CSS + QR için küçük bir script)
public/images/  ürün ve hero fotoğrafları (iki sürüm ortak kullanır)
public/fonts/   Brygada 1918 ve Hanken Grotesk (yerel, SIL OFL 1.1)
DESIGN.md       tasarım sistemi
CLAUDE.md       proje kapsamı ve kuralları
.claude/skills/atolyekart-standartlari/   bileşen standartları ve webhook formatı
```

## Katalog QR kodu

Ürünler bölümünün altındaki QR kod, sayfanın kendi adresini (`#urunler`) kodlar; adres sabit yazılmaz. Sabitlemek için React sürümünde `VITE_CATALOG_URL`, statik sürümde `<meta name="atolyekart:catalog-url">` kullanılır.

## Lisans notları

- Fontlar: Brygada 1918 ve Hanken Grotesk, SIL Open Font License 1.1 (`public/fonts/OFL-*.txt`).
- QR kod: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator), MIT.
