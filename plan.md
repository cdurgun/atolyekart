    # Luna Atelier — Tasarım Planı

    Durum: onaylandı ve uygulandı. Uygulanan sistem `DESIGN.md` içinde belgelidir.

    Plandan sapmalar:

    - Ürün kartında kategori, ürün adının üstünde değil altında durur (başlık üstü etiket kullanılmadı; DOM sırası da böyle).
    - 600–999px aralığında ürünler iki sütundur; tek kalan son ürün iki sütuna yayılır.
    - Hero yüksekliği ekran görüntüsüne göre `64svh` olarak ayarlandı.

    Impeccable'ın `shape` akışı kullanıldı; iki adımı bilerek atlandı:

    - **`PRODUCT.md` yazımı:** plan aşamasında dosya değişikliği istenmedi.
    - **Yön seçimi turu:** görsel yön brief'te zaten belirlendi.

    Yön tek noktada sıkılaştırıldı. "Krem zemin + kontrastlı serif + terracotta vurgu", bu tür bir brief için yapay zekânın en sık ürettiği görünüm; aşağıdaki palet ve tipografi bilerek oradan uzak duruyor.

    ## 1. Genel görsel yön

    Atölyenin basılı ürün föyü: bir seramikçinin sergi için bastırdığı tek sayfalık katalog. Kart yok, gölge yok, köşe yuvarlama yok, gradient yok. Yapıyı ince çizgiler, büyük tipografi ve boşluk kurar. Bölümler birbirinin kopyası değildir; her biri içeriğine göre farklı bir düzen alır. Hareket eklenmez.

    ## 2. Renk paleti

    Renkler atölyenin malzemelerinden gelir, strateji "tek renk alanı + nötr zemin":

    | Rol | Malzeme karşılığı | Yaklaşık değer |
    | --- | --- | --- |
    | Zemin | Sırsız taş çamuru (grimsi bej, krem değil) | `#DDD6C9` |
    | Metin | Demir oksitli koyu sır | `#2B211B` |
    | Renk alanı (hero + footer) | Fırınlanmış koyu umber | `#3A2A22` |
    | Alan üstü metin | Açık astar | `#EDE6DA` |
    | Vurgu | Bal mumu / amber | `#D9A441` |
    | Çizgiler | Metin renginin düşük opaklığı | — |

    Vurgu, koyu alan üstünde ve yalnızca birkaç yerde kullanılır. Açık zeminde vurgu rengiyle gövde metni yazılmaz (kontrast yetmez). Değerler uygulamada kontrast ölçümüyle kesinleşir.

    ## 3. Typography

    - **Başlık (serif):** Brygada 1918 — kesme harf karakterli, sıcak, katalog hissi veren bir yüz.
    - **Metin ve etiketler (sans):** Hanken Grotesk.
    - Playfair, Cormorant, Fraunces, Inter gibi her şablonda görülen yüzlerden bilerek kaçınıldı.
    - **Ön koşul:** İki yüzün de ğ, ş, ı, İ harflerini taşıdığı uygulamada doğrulanacak; taşımıyorsa aynı karakterde bir yedeğe geçilip bildirilecek.
    - Fontlar `public/fonts/` altında woff2 olarak projeden sunulur; npm bağımlılığı ve harici CDN isteği olmaz.
    - Ölçek adımları belirgin olur (başlıklar arası en az 1,25×); gövde 17–18px, satır uzunluğu en çok ~65 karakter.
    - Kategori ve "Sektör" gibi küçük bilgiler sans, küçük boy, hafif aralıklı.

    ## 4. Header / Hero

    Tam genişlikte koyu umber alan, ekran yüksekliğinin yaklaşık %70'i; altından "Atölye Hakkında" başlığı görünür. "Luna Atelier" çok büyük serif ile sola yaslı, alanın genişliğini doldurur. Slogan altında sans ile, amber renkte. Görsel, buton veya süs eklenmez: içerikte bunların karşılığı yok ve hero gücünü ölçekten alır.

    ## 5. Atölye Hakkında

    İki sütunlu dergi düzeni:

    - Solda dar sütunda bölüm başlığı.
    - Sağda tanıtım paragrafı, büyük serif ile "giriş paragrafı" olarak.
    - "Sektör" satırı, paragrafın altında küçük bir künye satırı.
    - "Hedef Kitle" listesi, madde imi yerine ince çizgilerle ayrılmış satırlar.

    ## 6. Kategoriler

    Kart değil, bir dizin satırı: üç kategori adı büyük serif ile yan yana, aralarında dikey ince çizgi; üstte ve altta tam genişlikte çizgi. Sayfanın en sade bölümü olur ve yoğun katalogdan önce nefes verir.

    ## 7. Ürün kataloğu / ProductCard

    - Masaüstünde üç sütun; sütunlar arasında dikey ince çizgi, kutu ve gölge yok.
    - Görsel kare, keskin köşeli, sütun genişliğinde.
    - Altında sırayla: kategori (küçük sans etiket), ürün adı (serif), açıklama, fiyat. Fiyat ad ile aynı ağırlıkta, sağa yaslı.
    - `ProductList`, `ProductCard`, `ProductImage` dosyalarına dokunulmaz; düzen mevcut `product-*` sınıfları üzerinden CSS ile kurulur. Sıra değişimi de CSS ile yapılır, DOM ve ekran okuyucu sırası aynı kalır.
    - Yer tutucu SVG'ler olduğu gibi kullanılır. Kendi açık zeminleri taş rengi zeminde "baskı levhası" gibi durur; yine de gerçek ürün fotoğrafı olmadıkça sitenin gerçekçiliğini en çok sınırlayan şey bunlar.

    ## 8. Footer

    Hero ile aynı koyu alan; sayfayı aynı renkle kapatır. Mevcut tek satır, küçük sans ile.

    ## 9. Responsive davranış

    - **Geniş (≥1000px):** yukarıdaki düzen.
    - **Orta (600–1000px):** Hakkında tek sütuna iner. Ürünler alt alta satır olur (görsel solda, metin sağda), böylece üçüncü ürün yetim kalmaz.
    - **Dar (<600px):** her şey tek sütun; kategoriler alt alta çizgili satırlar; hero başlığı ekrana göre küçülür ama taşmaz.
    - Yatay kaydırma olmaz; boşluklar ve başlık boyutları akışkan ölçeklenir.

    ## 10. Accessibility

    - Gövde metni için en az 4,5:1 kontrast, ölçülerek doğrulanır.
    - Tek `h1` ve mevcut başlık sırası korunur; görsel boyut başlık seviyesini değiştirmez.
    - `alt` metinleri, `lang="tr"` ve anlamsal etiketler aynen kalır.
    - Boyutlar `rem` ile; %200 yakınlaştırmada içerik kırılmadan akar.
    - Listelerin madde imi kaldırılsa da liste anlamı korunur.
    - Hareket olmadığı için `prefers-reduced-motion` gereği doğmaz.

    ## 11. Kullanılacak Impeccable / design skills

    - `shape`: bu plan.
    - `craft-floor` başvurusu: ilk CSS satırından önce okunur.
    - `typeset`, `layout`, `colorize`: uygulama sırasında tipografi, düzen ve renk kararları için.
    - `adapt`: responsive geçişler.
    - `audit` ve tasarım dedektörü: bitince tek tur; masaüstü ve mobil ekran görüntüsüyle birlikte.
    - `frontend-design` skill'i ayrıca kullanılmaz; aynı işi Impeccable görüyor.

    ## 12. Değiştirilecek dosyalar

    **Yeni**
    - `src/styles.css` (tek stil dosyası)
    - `public/fonts/` altında woff2 dosyaları

    **Değişen**
    - `src/main.jsx`: stil dosyasının import satırı.
    - `src/App.jsx`: yalnızca `header`, `section` ve `footer` etiketlerine `className`; metin ve yapı aynı.
    - `index.html`: font ön yükleme satırları.
    - `CLAUDE.md`: Current Scope, "CSS yok" ifadeleri ve Design Principles notu.
    - `.impeccable/config.json`: daha önce eklenen `flat-type-hierarchy` yok sayma kaydı kaldırılır.

    **Dokunulmayan**
    - `ProductList.jsx`, `ProductCard.jsx`, `ProductImage.jsx`, `products` dizisi, SVG'ler, `package.json`.

    ## Uygulanacak / Uygulanmayacak

    **Uygulanacak**
    - Palet, tipografi, hero, bölüm düzenleri, ürün gridi, footer, responsive geçişler
    - Kontrast ve erişilebilirlik doğrulaması
    - Masaüstü ve mobil ekran görüntüsüyle tek tur kontrol

    **Uygulanmayacak**
    - Bileşen mimarisinde, ürün verisinde veya metinlerde değişiklik
    - Yeni bölüm, buton, navigasyon, ikon, süs öğesi
    - Animasyon, gradient, glassmorphism, gölgeli/yuvarlak kart
    - Yeni npm bağımlılığı, CSS çatısı
    - SVG'lerin yeniden çizimi
    - Stage 1.3 ve sonrası

    ## Açık kararlar

    1. **Fontlar:** İki font dosyasının indirilip `public/fonts/` altına konması gerekiyor. Onaylanmazsa sistem fontlarıyla (serif + sans yığını) ilerlenir; özgünlük belirgin biçimde düşer.
    2. **Impeccable dosyaları:** Skill normalde `PRODUCT.md` ve iş bitince `DESIGN.md` yazar. Öneri: yalnızca `DESIGN.md`, tasarım bittikten sonra; sonraki aşamalarda stilin tutarlı kalmasını sağlar. İstenmezse ikisi de oluşturulmaz.

    Sonuç: fontlar yerel woff2 olarak onaylandı; yalnızca `DESIGN.md` istendi ve tasarım bittikten sonra yazıldı.

    ---

    # Uygulama Raporu

    Tasarım uygulandı ve `DESIGN.md` yazıldı. Sayfa `npm run dev` ile http://localhost:5173/ adresinde açılır.

    ## 1. Değiştirilen dosyalar

    **Yeni**
    - `src/styles.css`
    - `public/fonts/`: dört woff2 dosyası (her font için latin ve latin-ext) ile iki OFL lisans metni
    - `DESIGN.md`

    **Değişen**
    - `src/main.jsx`: stil dosyasının import satırı.
    - `src/App.jsx`: `header`, üç `section` ve `footer` etiketine `className`; metin ve yapı aynı.
    - `index.html`: iki font ön yükleme satırı.
    - `CLAUDE.md`: Current Scope, Design Principles notu ve kural 2 güncellendi.
    - `.impeccable/config.json`: Stage 1.1'de eklenen `flat-type-hierarchy` yok sayma kaydı kaldırıldı.
    - `plan.md`: durum satırı, plandan sapmalar ve bu rapor eklendi.

    **Dokunulmayan:** `ProductList.jsx`, `ProductCard.jsx`, `ProductImage.jsx`, `products` dizisi, SVG'ler, `package.json`.

    ## 2. Tasarım kararları

    - **Renk:** taş çamuru zemin (`#ddd6c9`), koyu umber header ve footer (`#3a2a22`), tek vurgu olarak sloganda bal mumu rengi (`#d9a441`).
    - **Tipografi:** başlık ve ürün adlarında Brygada 1918, gövde ve etiketlerde Hanken Grotesk. İkisi de SIL OFL 1.1 lisanslı ve yerelden sunuluyor; CDN yok.
    - **Hero:** `64svh`. Masaüstü ekran görüntüsünde başlık alanı ile altta görünen "Atölye Hakkında" arasındaki dengeye göre bu değerde bırakıldı.
    - **Bölümler:** Hakkında iki sütunlu dergi düzeni, Kategoriler çizgili tek satır dizin, Ürünler sütun çizgili katalog. Kart kutusu, gölge, köşe yuvarlama, gradient, animasyon yok.
    - **600–999px ürün düzeni:** iki sütun uygulandı. Üçüncü ürün tek kalmasın diye iki sütuna yayılıyor (görsel solda, metin sağda).

    **Plandan bir sapma:** Kategori etiketi ürün adının üstünde değil altında duruyor. Impeccable'ın kalite tabanı başlık üstü küçük etiketi yasaklıyor; ayrıca DOM sırası da zaten böyle.

    ## 3. Impeccable kontrolleri

    - Tasarım dedektörü `styles.css`, `App.jsx` ve `index.html` üzerinde bulgu vermedi; eski yok sayma kaydı kaldırıldıktan sonra tekrar çalıştırıldı, sonuç yine boş.
    - `craft-floor` başvurusu CSS'ten önce okundu. Plandaki `typeset`, `layout`, `colorize`, `adapt`, `audit` adımları ayrı komutlar olarak çalıştırılmadı; aynı kontroller uygulama ve doğrulama sırasında yapıldı.
    - **Atlananlar:**
    - Yön seçimi turu: yön brief'te belirlenmişti.
    - Bitiş incelemesi ve belgeleme alt ajanları: aynı oturumda elle yapıldı.
    - `PRODUCT.md` ve `.impeccable/design.json` yan dosyası: yalnızca `DESIGN.md` istendi.

    ## 4. Accessibility / contrast

    | Çift | Oran |
    | --- | --- |
    | Metin / zemin | 10,88 |
    | İkincil metin / zemin | 5,85 |
    | Açık metin / umber | 11,04 |
    | Slogan (amber) / umber | 6,09 |
    | Metin seçimi | 6,99 |

    - Hepsi 4,5:1 eşiğinin üstünde.
    - Tek `h1`; başlık sırası h1 → h2 → h3 olarak korunuyor.
    - Üç görselin `alt` metni ve `lang="tr"` yerinde.
    - En küçük yazı 15px.
    - Türkçe glifler (ğ Ğ ş Ş ı İ ö Ö ü Ü ç Ç) iki fontta da mevcut; tarayıcıda ölçülerek doğrulandı.
    - **Doğrulanmayan:** ekran okuyucuyla test ve %200 yakınlaştırma denemesi yapılmadı.

    ## 5. Masaüstü ve mobil doğrulama

    - **Masaüstü (~1490px):** hero, Hakkında, Kategoriler, üç sütunlu ürün gridi ve footer düzgün; yatay taşma yok.
    - **Mobil (390px):** tek sütun, yatay taşma yok, fontlar yüklü.
    - **Tablet (800px):** iki sütun ve yayılan üçüncü ürün. İlk turda üçüncü ürünün metni görselin altına hizalanıyordu; düzeltildi ve tekrar bakıldı, artık görselin üstüyle hizalı.
    - `npm run build` hatasız.

    ## 6. DESIGN.md özeti

    Yalnızca uygulanan sistemi belgeliyor:

    - **Üst bilgi:** renk, tipografi, boşluk ve bileşen token'ları.
    - **Overview:** "Atölye Föyü" ana fikri (ad uygulama sırasında konuldu).
    - **Colors:** rol rol renkler, ölçülen kontrastlar ve iki kural (koyu alan yalnızca header/footer'da; amber açık zeminde metin olmaz).
    - **Typography:** sekiz kademeli ölçek ve font kaynağı.
    - **Layout:** üç kırılım noktasındaki davranış.
    - **Elevation, Shapes:** gölge yok, köşeler keskin, ayrım 1px çizgiyle.
    - **Components:** header, çizgili liste, kategori dizini, ürün kartı, footer.
    - **Do's and Don'ts:** uygulanan kurallar.

    Yer tutucu SVG'ler aynen duruyor; sitenin "gerçek atölye" hissini en çok sınırlayan şey hâlâ onlar.

    ---

    # Stage 1.2 Görsel İnce Ayar Planı

    Durum: onay bekliyor. Henüz hiçbir dosya değiştirilmedi.

    Amaç: mevcut görsel dili koruyarak ölçeği küçültmek. Sayfa "büyük afiş" gibi değil, sanat yönetmenliği yapılmış bir butik atölye sitesi gibi görünmeli. İçerik çıkarılmıyor; yalnızca boyut ve boşluklar ayarlanıyor.

    Not: Hero bugün ~70vh değil `64svh`; aşağıdaki oranlar mevcut gerçek değerlerden hesaplandı.

    ## 1. Hero

    | Öğe | Şimdi | Önerilen |
    | --- | --- | --- |
    | Yükseklik | `64svh` | `50svh` (45–55 aralığında, ekran görüntüsüne göre son ayar) |
    | Üst boşluk | `clamp(5rem, 12vw, 9rem)` | `clamp(3.5rem, 8vw, 6rem)` |
    | Alt boşluk | `clamp(2rem, 5vw, 4rem)` | `clamp(1.75rem, 4vw, 3rem)` |
    | "Luna Atelier" | `clamp(3.25rem, 12.5vw, 12rem)` (1440px'te ~180px) | `clamp(2.75rem, 7vw, 6rem)` (1440px'te 96px, ~%47 küçük) |
    | Slogan | `clamp(1.0625rem, 1.6vw, 1.375rem)` | `clamp(1rem, 1.3vw, 1.1875rem)` |

    Başlık hâlâ sayfanın en büyük öğesi olarak kalır, ancak 1440px'te hero genişliğinin yarısından azını kaplar. 6rem üst sınırı Impeccable kalite tabanındaki display sınırıyla da uyumlu.

    ## 2. Başlıklar ve giriş paragrafı (~%20–30 küçültme)

    | Öğe | Şimdi | Önerilen |
    | --- | --- | --- |
    | Bölüm başlıkları (`h2`) | `clamp(1.75rem, 3vw, 2.5rem)` | `clamp(1.375rem, 2.25vw, 1.875rem)` (−%25) |
    | Hakkında giriş paragrafı | `clamp(1.375rem, 2.6vw, 2.125rem)` | `clamp(1.1875rem, 1.9vw, 1.625rem)` (−%24) |
    | Kategori adları | `clamp(1.375rem, 2.4vw, 2.25rem)` | `clamp(1.25rem, 1.9vw, 1.75rem)` (−%22) |
    | "Hedef Kitle" (`h3`) | `1.375rem` | `1.25rem` |
    | Ürün adı ve fiyat | `1.5rem` | `1.3125rem` |

    Ürün adı da biraz küçülüyor; aksi halde bölüm başlıklarıyla arasındaki fark 1,25×'in altına düşer ve hiyerarşi düzleşir. Gövde metni (17px) ve küçük etiketler (15px) değişmez.

    ## 3. Dikey boşluklar (~%25–35 azaltma)

    | Öğe | Şimdi | Önerilen |
    | --- | --- | --- |
    | Bölüm üst/alt boşluğu | `clamp(4rem, 9vw, 8rem)` | `clamp(2.75rem, 6vw, 5.5rem)` (−%31) |
    | "Hedef Kitle" üst boşluğu | `clamp(3rem, 6vw, 4.5rem)` | `clamp(2rem, 4vw, 3rem)` |
    | Ürünler başlığı alt boşluğu | `clamp(2rem, 4vw, 3.5rem)` | `clamp(1.5rem, 3vw, 2.5rem)` |
    | Kategori satırı iç boşluğu | `clamp(1.5rem, 3vw, 2.75rem)` | `clamp(1.125rem, 2.2vw, 2rem)` |
    | Ürün satırları arası (mobil/tablet) | `clamp(2.5rem, 5vw, 3.5rem)` | `clamp(2rem, 4vw, 2.75rem)` |
    | Footer iç boşluğu | `clamp(2.5rem, 6vw, 4.5rem)` | `clamp(2rem, 4vw, 3rem)` |

    ## 4. Korunanlar

    - Hakkında bölümünün iki sütunlu düzeni (1000px ve üstü)
    - İnce çizgili kategori dizini
    - Üç sütunlu ürün düzeni ve dikey ayırıcı çizgiler; 600–999px iki sütun, mobil tek sütun
    - Umber / taş / amber paleti ve ölçülen kontrastlar
    - Fontlar, editoryal/katalog karakteri
    - Kart, gölge, köşe yuvarlama, gradient, animasyon, buton, ikon, süs yok

    ## 5. Ürün görselleri: fotoğrafa hazırlık

    SVG'ler kaldırılmaz; görsel yuvaları ve yapı aynen kalır. Değişiklikler yalnızca `src/styles.css` içinde:

    - **Tek ayar noktası:** görsel oranı bir CSS değişkenine bağlanır (`--product-image-ratio`). Bugün kare SVG'ler için `1 / 1`. Gerçek fotoğraflar gelince yalnızca bu değer değiştirilir (ör. butik ürün fotoğrafçılığında yaygın olan `4 / 5`).
    - **Kırpma:** `object-fit: cover` ve `object-position: center`. Farklı oranda çekilmiş fotoğraflar yuvayı bozmadan doldurur. `ProductImage`'ın `width="300" height="300"` öznitelikleri CSS oranı tarafından ezilir, bileşen değişmez.
    - **Yükleme zemini:** görsel yüklenene kadar yuva, taş zeminden bir ton koyu düz bir renkle (`#d3cbbd` civarı) görünür. Fotoğraflar yüklenirken düzen zıplamaz ve boş kutu görünmez.
    - **Belgeleme:** `DESIGN.md` içine "fotoğrafla değiştirme" notu eklenir: önerilen oran, minimum çözünürlük (görüntülenen genişliğin en az 2 katı, ~900px), düz ve nötr arka plan, tek ışık yönü.

    Fotoğraflar gelince değişecek tek şey `products` dizisindeki `image` yollarıdır (ör. `.svg` → `.jpg`). Bu bir veri değişikliği olduğu için bu ince ayarda yapılmaz.

    **Önerilen ama kararınıza bağlı ek adım:** SVG'lerin içine gömülü ürün adı yazıları "demo" hissinin en güçlü kaynağı; ürün adı zaten kartta yazıyor. İsterseniz bu yazıları SVG dosyalarından çıkarırım ve üç SVG'nin arka plan tonunu taş paletine yaklaştırırım. Görseller, dosya adları ve yollar aynı kalır. Onay olmadan SVG'lere dokunulmaz.

    ## 6. Değişecek dosyalar

    - `src/styles.css`: yukarıdaki ölçek, boşluk ve görsel yuvası ayarları
    - `DESIGN.md`: yeni token değerleri (Typography, Layout, spacing) ve fotoğraf hazırlık notu
    - `plan.md`: uygulama sonrası sonuç notu
    - (Yalnızca onaylanırsa) `public/images/*.svg`: gömülü yazıların çıkarılması

    **Dokunulmayanlar:** bileşenler, `App.jsx`, `products` dizisi, metinler, `index.html`, `package.json`, Stage 1.3 kapsamı.

    ## 7. Doğrulama

    - Dev sunucusu yeniden başlatılır (önceki oturum zaman sınırında durdu).
    - Masaüstü (~1440px), tablet (800px) ve mobil (390px) ekran görüntüsüyle tek tur kontrol; gerekirse bir düzeltme turu.
    - Hero yüksekliği bu görüntülere göre 45–55svh aralığında kesinleşir.
    - Impeccable dedektörü, `npm run build`, yatay taşma kontrolü; renkler değişmediği için kontrast oranları aynı kalır, yine de yeniden ölçülür.

    ## Uygulanacak / Uygulanmayacak

    **Uygulanacak**
    - Hero yüksekliği ve başlık ölçeğinin küçültülmesi
    - Başlık, giriş paragrafı ve kategori yazılarının ~%20–30 küçültülmesi
    - Dikey boşlukların ~%25–35 azaltılması
    - Görsel yuvalarının fotoğrafa hazırlanması (oran değişkeni, kırpma, yükleme zemini)
    - `DESIGN.md` güncellemesi

    **Uygulanmayacak**
    - Ürün verisi, metin, bileşen mimarisi değişikliği
    - Görsellerin kaldırılması veya yollarının değiştirilmesi
    - Kart, gölge, köşe yuvarlama, gradient, animasyon, buton, ikon, süs öğesi
    - Stage 1.3 ve sonrası
    - SVG yazılarının çıkarılması (ayrı onay gerekir)

---

# Stage 1.2 Kompakt Revizyon Planı

Durum: onaylandı ve uygulandı (rapor bu bölümün sonunda). Bu plan, bir önceki "Stage 1.2 Görsel İnce Ayar Planı"nın yerine geçer.

## Mevcut durum analizi

Ölçüm Chrome'da 1600×732 masaüstü pencerede yapıldı:

| Bölüm | Yükseklik | Neden büyük |
| --- | --- | --- |
| Hero | 468px | Başlık 192px; hero 64svh |
| Atölye Hakkında | 718px | 128px üst/alt boşluk, 34px giriş paragrafı; "Hedef Kitle" paragrafın altına iniyor |
| Kategoriler | 211px | 36px yazı ve geniş satır boşluğu |
| Ürünler | 880px | 128px boşluklar, 378px kare görsel |
| Footer | 168px | — |
| **Toplam** | **2446px (~3,3 ekran)** | |

Ana sorunlar:

- **Ölçek:** Başlık ölçeği afiş boyutunda.
- **Bölüm boşlukları:** 128px, içeriğe göre fazla.
- **Hakkında'da boşa giden alan:** Sağ sütunda her şey alt alta dizildiği için sol sütunun büyük kısmı boş kalıyor.
- **SVG'ler:** İçlerindeki ürün adı yazıları ve çizimler demo hissi veriyor.

## Karar gerektiren çelişki: SVG'leri kaldırmak

SVG'ler kaldırılmak isteniyor ama bileşen yapısı ve metinler değişmeyecek. Görseller ürün verisinden (`image` alanı) geliyor ve `ProductImage` her zaman bir `<img>` çiziyor. Bu yüzden SVG'yi kaldırıp yuvayı temiz tutmak, en az bir küçük kod değişikliği gerektiriyor:

**A (önerilen):**
- `products` dizisindeki üç `image` değeri `null` olur; alan yerinde kalır, fotoğraf gelince yol buraya yazılır.
- `ProductImage`'a tek bir koşul eklenir: `src` varsa bugünkü `<img>`, yoksa aynı sınıfta boş bir görsel yuvası.
- Bileşenlerin sorumlulukları, prop'ları ve hiyerarşisi aynı kalır; hiçbir metin değişmez. Üç SVG dosyası silinir, `public/images/` fotoğraflar için boş klasör olarak kalır.

**B (sıfır React değişikliği):** Üç SVG dosyasının içi boşaltılır; çizim ve yazı yerine tek renkli düz bir alan kalır. Kod ve veri hiç değişmez, ama teknik olarak hâlâ SVG kullanılır ve tarayıcı boş görseller indirir.

**Önerilmeyen C:** SVG'leri yalnızca CSS ile gizlemek. Dosyalar yine indirilir ve ekran okuyucu görünmeyen bir görseli okur.

Aşağıdaki plan A'ya göre yazıldı. B seçilirse yalnızca bu kısım değişir.

## 1. Ürün görsel yuvası (fotoğrafa hazır)

- **Boş yuva:** taş zeminden bir ton koyu, düz bir alan (~`#d3cbbd`). Çizgi, ikon veya yazı yok. Ürün adı zaten başlıkta yazdığı için ekran okuyucudan gizlenir.
- **Oran:** tek bir CSS değişkenine bağlanır (`--product-image-ratio`). Kompaktlık için varsayılan **4:3**; bugünkü 378px yerine 1600px'te ~280px yükseklik. Fotoğraflar dikey çekilirse yalnızca bu değer `4 / 5` yapılır.
- **Fotoğraf gelince:** `object-fit: cover` ile farklı oranlar yuvayı bozmadan doldurur; yükleme sırasında aynı zemin rengi görünür, düzen zıplamaz.
- **Belgeleme:** `DESIGN.md`'ye kısa bir fotoğraf notu eklenir: oran, en az ~900px genişlik, düz ve nötr arka plan.

## 2. Hero

| Öğe | Şimdi | Önerilen |
| --- | --- | --- |
| Yükseklik | `64svh` | `46svh` (45–50 aralığı, ekran görüntüsüne göre son ayar) |
| "Luna Atelier" | 192px (1600px'te) | `clamp(2.5rem, 6vw, 5.5rem)` → 88px |
| Slogan | 22px | `clamp(1rem, 1.2vw, 1.125rem)` → 18px |
| Üst / alt boşluk | 144 / 64px | `clamp(3rem, 7vw, 5rem)` / `clamp(1.5rem, 3.5vw, 2.5rem)` |

Başlık hâlâ sayfanın açık ara en büyük öğesi kalır, ama genişliğin yaklaşık üçte birini kaplar.

## 3. Tipografi

| Öğe | Şimdi | Önerilen |
| --- | --- | --- |
| Bölüm başlıkları | 40px | `clamp(1.25rem, 2vw, 1.625rem)` → 26px |
| Giriş paragrafı | 34px | `clamp(1.125rem, 1.6vw, 1.375rem)` → 22px |
| Kategori adları | 36px | `clamp(1.125rem, 1.6vw, 1.375rem)` → 22px |
| "Hedef Kitle" | 22px | 18px |
| Ürün adı / fiyat | 24px | 19px |
| Gövde / etiket | 17 / 15px | değişmez |

Başlık → ürün adı oranı 1,37 olur; hiyerarşi düzleşmez.

## 4. Dikey boşluklar

| Öğe | Şimdi | Önerilen |
| --- | --- | --- |
| Bölüm üst/alt boşluğu | 128px | `clamp(2.5rem, 4.5vw, 4rem)` → 64px |
| Ürünler başlığı altı | 56px | `clamp(1.25rem, 2vw, 1.75rem)` |
| Kategori satırı iç boşluğu | 44px | `clamp(0.875rem, 1.6vw, 1.25rem)` |
| Görsel → ürün adı | 20px | 16px |
| Footer | 72px | `clamp(1.75rem, 3vw, 2.5rem)` |

## 5. Hakkında: masaüstünde daha az dikey alan

Sitenin dili değişmeden en büyük kazanç buradan gelir. 1000px ve üstünde bölüm üç alana ayrılır:

- **Solda:** bölüm başlığı (bugünkü gibi).
- **Ortada:** giriş paragrafı ve "Sektör" satırı.
- **Sağda:** "Hedef Kitle" ve çizgili liste.

Bugün alt alta duran iki blok yan yana gelir. Bu yalnızca CSS grid yerleşimidir; DOM ve okuma sırası aynı kalır. 1000px altında bugünkü gibi tek sütun.

İki sütunda da kalabilir; o zaman Hakkında yaklaşık 150px daha uzun olur.

## 6. Korunanlar

- Ürün gridi: masaüstünde 3 sütun ve dikey çizgiler; 600–999px'te 2 sütun ve yayılan üçüncü ürün; mobilde tek sütun
- İnce çizgili kategori dizini
- Umber / taş / amber paleti, Brygada 1918 + Hanken Grotesk, editoryal/katalog karakteri
- Kart, gölge, gradient, yuvarlak köşe, animasyon, buton, ikon, süs yok
- Tüm metinler

## 7. Beklenen sonuç

1600×732 masaüstünde, tahmini:

| Bölüm | Şimdi | Sonra |
| --- | --- | --- |
| Hero | 468px | ~340px |
| Hakkında | 718px | ~300px |
| Kategoriler | 211px | ~110px |
| Ürünler | 880px | ~600px |
| Footer | 168px | ~110px |
| **Toplam** | **~3,3 ekran** | **~2 ekran (~1460px)** |

Kesin değerler uygulamada ölçülüp raporlanır.

## 8. Değişecek dosyalar

- `src/styles.css`: ölçek, boşluk, Hakkında yerleşimi, görsel yuvası
- `src/components/ProductImage.jsx`: boş yuva koşulu (yalnızca A)
- `src/App.jsx`: üç `image` değeri `null` (yalnızca A; metinler aynı)
- `public/images/*.svg`: silinir (A) veya içi boşaltılır (B)
- `DESIGN.md`: yeni token değerleri, Hakkında yerleşimi, fotoğraf notu
- `CLAUDE.md`: görsel yuvası ve klasör açıklaması
- `plan.md`: sonuç raporu

**Dokunulmayanlar:** `ProductList.jsx`, `ProductCard.jsx`, metinler, `index.html`, `package.json`, Stage 1.3 kapsamı.

## 9. Doğrulama

- Masaüstü, tablet (800px) ve mobil (390px) ekran görüntüsüyle bir tur kontrol, gerekirse bir düzeltme turu.
- Bölüm yüksekliklerinin ölçümü ve önce/sonra karşılaştırması.
- Impeccable dedektörü, kontrast yeniden ölçümü, yatay taşma kontrolü, `npm run build`.

## Uygulanacak / Uygulanmayacak

**Uygulanacak**
- SVG'lerin kaldırılması ve fotoğrafa hazır boş görsel yuvası
- Hero 45–50svh ve küçük başlık
- Tipografi ve boşluk küçültmesi
- Hakkında'nın masaüstünde üç alana yerleşmesi
- `DESIGN.md` ve `CLAUDE.md` güncellemesi

**Uygulanmayacak**
- Metin değişikliği, bileşen hiyerarşisi değişikliği
- Kart, gölge, gradient, yuvarlak köşe, animasyon, süs
- Stage 1.3 ve sonrası

## Onay bekleyen üç nokta

1. **SVG yöntemi:** A (önerilen) mı, B mi?
2. **Varsayılan görsel oranı:** 4:3 (kompakt) mı, ileride çekilecek fotoğraflara göre 4:5 mi?
3. **Hakkında yerleşimi:** masaüstünde üç alan mı, iki sütun mu?

Onay mesajı bu üç noktayı ayrıca yanıtlamadı. Plan onaylandığı için planın varsayılanları uygulandı: **A** (SVG'ler silindi, boş yuva), **4:3** oran ve masaüstünde **üç alanlı** Hakkında. Her biri tek noktadan geri alınabilir (oran için `--product-image-ratio`).

---

# Uygulama Raporu — Kompakt Revizyon

## Sonuç

Sayfa aynı tasarım diliyle belirgin biçimde kompaktlaştı. Masaüstünde (1600×732) toplam yükseklik **2446px → 1470px (−%40)**, yani ~3,3 ekrandan ~2 ekrana indi.

| Bölüm | Önce | Sonra |
| --- | --- | --- |
| Hero | 468px | 337px (46svh) |
| Atölye Hakkında | 718px | 303px |
| Kategoriler | 211px | 122px |
| Ürünler | 880px | 604px |
| Footer | 168px | 104px |
| **Toplam** | **2446px** | **1470px** |

Mobilde (390px) sayfa 3337px → 2472px (−%26). Mobilde ürün yuvaları tam genişlikte olduğu için Ürünler bölümü hâlâ sayfanın en uzun kısmı.

## Değiştirilen dosyalar

- `src/styles.css`:
  - Tipografi ve boşluk değerleri artık `:root` içinde rol adlı değişkenler (`--type-*`, `--section`, `--heading-gap`, `--product-image-ratio`).
  - Hero, başlıklar, boşluklar ve Hakkında'nın üç alanlı yerleşimi.
  - Görsel yuvası.
- `src/components/ProductImage.jsx`: `src` yoksa ekran okuyucudan gizli boş bir `div.product-image`, varsa bugünkü `<img>`. Prop'lar ve bileşen hiyerarşisi aynı.
- `src/App.jsx`: üç ürünün `image` değeri `null`. Metinler aynı.
- `public/images/*.svg`: üç dosya silindi; klasör fotoğraflar için boş duruyor.
- `DESIGN.md`:
  - Token'lar ve hiyerarşi yeniden yazıldı.
  - Görsel yuvası bileşeni ve fotoğraf ekleme yönergesi eklendi.
  - İki yeni kural eklendi: "Tek Büyük Ses" ve "yuvaya placeholder koyma".
- `CLAUDE.md`: ürün tablosu, `public/images/` açıklaması ve `ProductImage` satırı güncellendi.

**Dokunulmayan:** `ProductList.jsx`, `ProductCard.jsx`, tüm metinler, `index.html`, `package.json`, Stage 1.3 kapsamı.

## Tipografi ölçeği

1600px / 390px değerleri:

| Rol | Önce | Sonra |
| --- | --- | --- |
| "Luna Atelier" | 192px | 88 / 40px |
| Bölüm başlıkları | 40px | 26 / 22px |
| Giriş paragrafı ve kategoriler | 34–36px | 22 / 18px |
| Ürün adı, fiyat, "Hedef Kitle" | 24 / 22px | 19 / 17px |
| Slogan | 22px | 18 / 16px |
| Gövde | 17px | 17 / 16px |
| Etiket | 15px | 15px |

- Display, sayfanın açık ara en büyük öğesi olarak kaldı.
- Başlık → ürün adı oranı masaüstünde 1,37, mobilde 1,29; hiyerarşi düzleşmedi.
- "Hedef Kitle" ile ürün adı aynı rol (title) oldu; ayrı bir ara boyut kalmadı.

## Dikey ritim

- Bölüm boşluğu 128px → 64px (mobilde 40px).
- Başlık → içerik arası 16–24px.
- Ürün içinde görsel → ad 16px, ad → kategori 3px, kategori → açıklama ~10px.

Sıkı (ürün içi) ve geniş (bölüm arası) aralıklar arasındaki fark korundu.

## Ürün gridi ve görsel yuvası

- Masaüstünde 3 sütun ve dikey çizgiler korunuyor; 600–999px'te 2 sütun ve yayılan üçüncü ürün, mobilde tek sütun.
- Yuva 4:3, masaüstünde 291px yüksek (önce 378px kare SVG).
- Boş yuva, taş zeminden bir ton koyu düz bir alan (`#d2c9b9`). İkon, çizim veya yapay görsel yok.
- Fotoğraf eklemek için: dosyayı `public/images/` altına koyup ürünün `image` alanına yolunu yazmak yeterli; görsel `object-fit: cover` ile yuvayı doldurur. Dikey fotoğraflarda yalnızca `--product-image-ratio` değeri `4 / 5` yapılır.

## Impeccable kontrolleri

- **typeset / layout:** düzenlemeden önce `--scope type` ve `--scope layout` taramaları temizdi. Sorunlar ölçümle tespit edildi (afiş ölçeğinde başlık, 128px boşluklar, Hakkında'daki boş sol sütun). Rol adlı tipografi ve boşluk değişkenleri kuruldu.
- **colorize:** palet korundu. Yuva için tek bir nötr ton (`stone-deep`) eklendi, metin taşımıyor. Tüm metin kontrastları yeniden ölçüldü.
- **adapt:** 390, 800 ve 1600px'te ekran görüntüsü ve ölçüm. Mobilde değerler `clamp()` ile doğal olarak küçülüyor (gövde 16px, başlık 22px).
- **Final audit (dedektör):**
  - İlk çalıştırmada bir uyarı çıktı: sloganın boyutu `DESIGN.md` ölçeğinde yoktu. Slogan için bir token (`--type-tagline`) tanımlandı ve `DESIGN.md`'ye eklendi; tekrar çalıştırıldı, bulgu yok.
  - `npm run build` hatasız.
  - Sayfada SVG'ye kalan referans ve başarısız istek yok.

## Accessibility / contrast

| Çift | Oran |
| --- | --- |
| Metin / zemin | 10,88 |
| İkincil metin / zemin | 5,85 |
| Açık metin / umber | 11,04 |
| Slogan / umber | 6,09 |

- Hepsi 4,5:1'in üstünde.
- Boş yuva metin taşımadığı ve `aria-hidden` olduğu için kontrast eşiğine tabi değil (zemine karşı 1,14, bilinçli olarak sessiz).
- Başlık sırası h1 → h2 → h3 korunuyor. Ürün adı başlıkta yazdığı için boş yuvalar ekran okuyucuda tekrar okunmuyor.
- Yatay taşma yok (390 / 800 / 1600px).
- **Doğrulanmayan:** ekran okuyucuyla test ve %200 yakınlaştırma yapılmadı.

## Masaüstü ve mobil doğrulama

- **Masaüstü (1600px):**
  - İlk ekranda hero ile birlikte Hakkında'nın tamamı ve Kategoriler başlığı görünüyor.
  - İkinci ekranda kategori dizini, üç ürün ve footer var.
  - Hakkında'nın üç alanı dengeli: giriş paragrafı 3 satır, "Hedef Kitle" listesi yanında.
- **Tablet (800px):** iki sütun ve yayılan üçüncü ürün düzgün; metin yuvanın üstüyle hizalı.
- **Mobil (390px):** başlık 40px ve tek satır; hero ekranın %46'sı; kategoriler çizgili satırlar; ürünler alt alta.
- Tek düzeltme turu gerekmedi; ilk turda düzen sorunu görülmedi.

## Kalan konu

Boş yuvalar, gerçek fotoğraflar gelene kadar katalogda üç sade ton alanı olarak görünecek; sayfanın son kalitesi bu fotoğraflara bağlı. Mobilde ürün listesini daha da kısaltmak istenirse bir sonraki adım, mobilde görseli metnin yanına almak olabilir. Bu yeni bir düzen kararı olduğu için uygulanmadı.

---

# Fotoğrafa Hazırlık Planı

Durum: onaylandı (A seçeneği) ve uygulandı.

## Mevcut durum kontrolü

- `public/images/` boş; kodda ve belgelerde `.svg` referansı yok.
- Üç ürünün `image` değeri `null`.
- `ProductImage`, `src` yoksa boş yuva, varsa `<img>` çiziyor.
- Yuva 4:3 ve `object-fit: cover`.

Sonuç: yapı fotoğraflara zaten hazır; kod veya CSS değişikliği gerekmiyor.

## Karar: A — koda dokunmamak

`image` alanına şimdiden `.jpg` yolu yazılmadı. Dosya yokken yazılan yol her yüklemede 404'e ve kartta kırık görsel ikonuna yol açardı. `image: null` korunur. Fotoğraf gelince dosya `public/images/` altına konur ve `null` yerine yol yazılır.

Seçilmeyen B: yolları şimdi yazıp `ProductImage`'a yükleme hatasında boş yuvaya dönen bir state eklemek. Bu kod değişikliği ve gereksiz 404 istekleri demekti.

## Uygulanan değişiklikler (yalnızca belgeler)

- **`CLAUDE.md`:**
  - Ürün tablosuna "Hedef fotoğraf dosyası" sütunu eklendi: `/images/luna-seramik-kupa.jpg`, `/images/amber-soya-mum.jpg`, `/images/terra-minimal-kolye.jpg`.
  - Fotoğraf ekleme adımları ve "dosya yokken yol yazma" notu eklendi.
- **`DESIGN.md`** (Components → Product Image Slot):
  - Hedef dosya adları eklendi.
  - **Ürün fotoğrafı görsel dili:** doğal yumuşak ışık, minimalist kompozisyon, taş/keten gibi doğal yüzeyler, sıcak ama abartısız ton, palete uyum, ürünün net öne çıkması, katalog/editoryal his, üç fotoğrafın tek seri gibi görünmesi.
  - **4:3 teknik yönergeleri:** yatay 4:3 kadraj (ör. 1800×1350px), en az 1200×900px, her kenardan en az %10 boşluk (kırpma ürünü kesmesin), üç fotoğrafta aynı ölçek ve kamera açısı, JPEG/sRGB, dikey seride yalnızca oran değişkeninin değişmesi.
- **`plan.md`:** bu bölüm.

## Dokunulmayanlar

`src/` altındaki tüm dosyalar (CSS, bileşenler, `App.jsx`, ürün verileri), fontlar, renkler, `public/images/`. Fotoğraf dosyası oluşturulmadı.

## Sonraki adım

Üç ürün fotoğrafının bu yönergeye göre hazırlanması. Fotoğraflar gelince yapılacak tek kod değişikliği, `App.jsx` içinde üç `image` değerinin hedef yollarla değiştirilmesi.

---

# Stage 1.5 — Skill + MCP + QR + Sub-agent

Durum: uygulandı. Alt ajanın tasarım önerileri onay bekliyor; hiçbiri uygulanmadı.

## Yapılanlar

- **Skill:** `.claude/skills/atolyekart-standartlari/` (`SKILL.md` + `webhook-format.md`). BizCard'daki `bizcard-metin-yazari` skill'inin yapısı (kısa frontmatter, ne zaman kullanılır, kurallar, çıktı formatı, örnek) AtölyeKart'ın bileşen, adlandırma, görsel, stil, responsive ve React↔CDN kurallarına uyarlandı. Webhook payload formatı ayrı dosyada; Stage 1.6'da uygulanacak sözleşmedir.
- **QR:** `qrcode-generator` 2.0.4. React'te `CatalogQR` bileşeni, CDN'de `cdn/script.js` + jsDelivr (sabit sürüm, SRI). Adres sayfanın kendi adresinden üretilir (`#urunler`); `VITE_CATALOG_URL` ya da `<meta name="atolyekart:catalog-url">` ile sabitlenebilir.
- **GitHub:** depo GitHub MCP ile oluşturuldu; ayrıntı `CLAUDE.md` ve commit geçmişinde.
- **Sub-agent:** art director incelemesi (aşağıda).

## Alt ajan incelemesi (art director)

**Genel hüküm:** Sayfa gerçek bir butik atölye sitesine yaklaşık %80 yakın; şablon hissi yok. Kalan mesafe üslupta değil hassasiyette: alt alta üç bölüm üç farklı sütun ızgarası kullanıyor, çizgiler ve metin kenarları birbirini 2–18px ıskalıyor. En zayıf tasarım bölümü Kategoriler satırı. En zayıf içerik "Sektör:" ve "Hedef Kitle" ifadeleri (müşteriye değil, brief'e ait dil).

### Öneriler ve değerlendirme

| # | Öneri | Boyut | Değerlendirme |
| --- | --- | --- | --- |
| 1 | `.product-description`'a `text-wrap: balance`: üç kartta da tek kelimelik son satırları ("kupa.", "kolye.") giderir | Çok küçük | **Önerilir.** Kilitli kararlarla çelişmiyor; en görünür tipografi kusurunu çözüyor |
| 2 | Kategoriler satırını ürün ızgarasıyla hizalamak (dikey çizgiler ~10px, metin kenarları 2–18px kayık) | Küçük–orta | **Önerilir.** "Basılı föy" hissini doğrudan güçlendirir; görünüm aynı kalır, yalnızca hizalar oturur |
| 3 | 600–999px'te yayılan üçüncü ürün kartını üstteki iki kartın ızgarasına oturtmak | Çok küçük | **Önerilir.** Görsel ~43px dar, metin ~44px solda başlıyor |
| 4 | 1000px altında "Hedef Kitle" çizgisinin `max-width: 36rem` sınırını kaldırmak | Çok küçük | **Önerilir.** Çizgi keyfi bir yerde bitiyor |
| 5 | Hakkında'nın üçüncü kolonunu ürünlerin üçüncü sütunuyla hizalamak | Orta | **Kararınıza bağlı.** Hakkında yerleşimi son turda onaylandı; fark 12–18px |
| 6 | Kategorileri tek dizin satırına çevirmek (başlık solda, adlar yanında) ya da adları küçültmek | Orta | **Kararınıza bağlı.** "Kategoriler bölümünü değiştirme" demiştiniz; öneri bununla çelişiyor |
| 7 | Ürünler bölümünün alt boşluğunu artırmak | Çok küçük | **Geçersiz kaldı.** QR satırı artık ürünlerle footer arasında duruyor |
| 8 | Ürün açıklamasını `ink-soft` yapmak ya da küçültmek | Çok küçük | **Önerilmez.** Zevk meselesi; ajan da güveni düşük verdi |
| 9 | "Sektör:" ve "Hedef Kitle" metinlerini müşteriye dönük yazmak | Metin | **Uygulanmaz** (metinler değişmez kuralı). Yine de ajanın en güçlü tespiti; ödev kapsamı izin verirse en büyük kazanç burada |
| 10 | Hero ile footer tonunu yakınlaştırmak | Orta | **Uygulanmaz** (hero ve palet kilitli) |

**Sonuç:** 1–4 numaralı öneriler onaylandı ve hem React hem CDN sürümüne uygulandı (yalnızca `src/styles.css`; `cdn/styles.css` ondan üretildi). Ölçüm: 1600px'te kategori ve ürün dikey çizgileri aynı konumda (569,8 ve 1015,2px); 800px'te üçüncü kartın görseli 336px ve metni 409px'ten başlıyor; "Hedef Kitle" çizgisi kategori çizgileriyle aynı uzunlukta; üç açıklamada da tek kelimelik son satır yok. 5–10 uygulanmadı.

### Ajanın "sorun yok" dediği noktalar

Hero'nun üç genişlikte kadrajı ve yazı okunabilirliği; Türkçe glifler ve fiyatlardaki rakamlar; ad–fiyat satırı hizası; ürün fotoğraflarının seri tutarlılığı; 1600px'te Hakkında yerleşimi; 48px bölüm ritmi; mobilde kategoriler ve ürün ayraçları; gölge, köşe, gradient, ikon kurallarına uyum.

### Doğrulanması istenen iki nokta

- 600–680px arasında başlığın bitkiye/rafa yaklaşıp kontrast kaybedebileceği (çıkarım; ekran görüntüsü yok).
- 800px ekran görüntüsünün sağındaki ~15px beyaz şerit: kaydırma çubuğu boşluğu. Ölçümde yatay taşma yok.
