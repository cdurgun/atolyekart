# n8n workflow isimlendirme standardı

Karar tarihi: 22.11.2026. Kontrol aracı: `scripts/n8n-workflow-listesi.mjs` (n8n REST API, yalnızca GET).

## Kural

```
atolyekart-<alan>-<işlev>[-<ayrıntı>][-test]
```

- Yalnızca küçük harf, rakam ve tire. Türkçe karakter yok (`ğ ü ş ı ö ç` → `g u s i o c`), boşluk ve alt çizgi yok.
- Kalıp (script'teki düzenli ifade): `^atolyekart-[a-z0-9]+(-[a-z0-9]+)*$`
- `<alan>`: workflow'un ait olduğu bölüm. Final için `final`.
- `<işlev>`: ne yaptığını söyleyen fiil ya da ad (`asistan`, `prim-hesapla`, `hata-yakalayici`, `yedekleme`).
- `-test`: yayınlanmayan deneme kopyası. Yayınlanan sürümde bu ek olmaz.
- Alt workflow'un adı tek başına anlaşılır olmalı; çağıran workflow'un adını tekrar etmez.
- Açıklama (description) alanı doldurulur: ne yapar, yayınlanır mı, neye yazar.

## Final için planlanan adlar

| Ad | Tür | Yayın |
| --- | --- | --- |
| `atolyekart-final-asistan` | Webhook girişi + AI Agent (RAG, Redis hafıza, araçlar) | Onayla |
| `atolyekart-final-prim-hesapla` | Alt workflow (deterministik prim hesabı, ajan aracı) | Çağrılarak çalışır |
| `atolyekart-final-hata-yakalayici` | Error Trigger + bildirim | Onayla |
| `atolyekart-final-yedekleme` | Zamanlanmış yedek → Google Drive | Onayla |
| `…-test` ekli kopyalar | Yukarıdakilerin deneme kopyaları | Yayınlanmaz |

## Belgelenmiş istisnalar

Standarttan önce oluşturuldular. Kullanıcı kararıyla (22.11.2026) **yeniden adlandırılmaz ve değiştirilmez**: canlı akışlar adlarına bağlı belgeler ve yedeklerle izlenir, testler ve yedekler kanıt olarak korunur. Script bunları kimliğe göre "istisna" diye gösterir. Yeni bir istisna eklemek bu tabloyu ve script'teki listeyi birlikte güncellemeyi gerektirir.

| ID | Ad | Neden istisna |
| --- | --- | --- |
| `UwG1w0v0h9ekh8u6` | `atolyekart-siparis` | Canlı sipariş/stok akışı (adı kalıba zaten uyuyor) |
| `mYsRTCYniOggXfSJ` | `AtolyeKart-RAG-Product-Knowledge` | Canlı RAG asistanı |
| `so5NEbMpmoCNzIcX` | `Atolyekart-Validation` | Canlı alt workflow |
| `LTWx3hv6EaaNCLeR` | `Atolyekart-Error-Handler` | Canlı hata ağı |
| `q2wFd40otvWmgkbH` | `atolyekart-siparisver` | Eski akış, korunuyor |
| `hkc6PGrM6o0aAvo8` | `Atolyekart-Product-Knowledge` | Eski yükleme formu (yayında değil) |
| `SiZzpm0BZ38hkiFD` | `Atolyekart-Gunluk-Siparis-Ozeti` | Önceki ödev |
| `PPj1rHXLx5B0CLDw` | `Atolyekart-Product-Knowledge-QDRANT-TEST` | Test |
| `PxbJha0DZvRy66wI` | `AtolyeKart-RAG-Product-Knowledge-REDIS-TEST` | Test |
| `FTvhjRLIm4JnHut8` | `Atolyekart-Products-OKUMA-TEST` | Test (salt okuma) |
| `MUjsDvhrYo1SaD3R` | `Atolyekart-Siparis-Dosyasi-YEDEK-OKUMA-TEST` | Test (salt okuma) |
| `dL9N60ouLvJNnyoA` | `atolyekart-siparis-TEST` | Test |
| `NKHoDKP4x9oVTl5O` | `Atolyekart-Stok-Bildirimleri-SAYFA-OLUSTUR` | Tek seferlik |
| `LbnmEn2CroBuIAHA` | `Atolyekart-Validation-TEST` | Test |
| `lPGQT4EB26IIoRfm` | `00 - Kurulum Testi` | Kurs alıştırması |
| `69F7xKMW91zz1Xkd` | `Chat-prompt` | Kurs alıştırması |
| `qiAwlI9T0yTI5lVH` | `mcp-trigger` | Kurs alıştırması |
| `MUmJj7xsYfYoKJ6I` | `n8-main-agent` | Kurs alıştırması |
| `scMMxwwJ6pO0VNev` | `n8n-sub-agent` | Kurs alıştırması |
| `dCcPqI9nsjq5EJuq` | `My workflow` | Kurs alıştırması |
| `BVSYReqrwk5PoeDg` | `My workflow 2` | Kurs alıştırması |
| `fcaUHAhuZ4P0Gztt` | `My workflow 3` | Kurs alıştırması |
| `D5o4LI3jkjNaaVl3` | `My workflow 4` | Kurs alıştırması |
| `d3KqMgnlR7gJP01b` | `test` | Kurs alıştırması |

Liste 22.11.2026'da n8n MCP `search_workflows` ile alınan 24 workflow'dur.

### Yayındaki `-test` adları (23.11.2026)

Bu iki ad kalıba uyar; script'in istisna listesi değişmez. Ancak "`-test` yayınlanmaz" kuralına aykırıdırlar ve kullanıcı kararıyla böyle kalırlar (`asama-6-yayin-ve-uctan-uca-plan.md` bölüm 4).

| ID | Ad | Neden |
| --- | --- | --- |
| `14IYDf3MyS889v0b` | `atolyekart-final-prim-hesapla-test` | Yayında (`2eba8392`); final asistanın Prim Hesapla aracı. Yayındaki workflow yeniden adlandırılmadı. |
| `Q8hrWLrDUCixAEfn` | `atolyekart-final-sigorta-sartlari-test` | Yayında (`5f9edfd1`); 2. aşama workflow'u, korunuyor. Final asistanın Sigorta Şartları aracı. |

n8n açıklamalarında ikisi için hâlâ "TEST, yayınlanmaz" yazıyor; düzeltilmedi (Q8hr için açık istisna onayı gerekir).

### 6. aşamada yeniden adlandırılanlar (23.11.2026)

Aynı ID ile; `-test` eki kaldırıldı (D1). Alt workflow'lar ID ile çağrıldığı için bağlantılar değişmedi.

| ID | Önceki ad | Yeni ad | Yayın |
| --- | --- | --- | --- |
| `ruOvhJ8EtfHvpkrt` | `atolyekart-final-asistan-test` | `atolyekart-final-asistan` | Yayında (`08e2d27a`); webhook yolu `atolyekart-final-asistan`, Basic Auth |
| `IlJ0nrSuexnU4Wx4` | `atolyekart-final-hata-yakalayici-test` | `atolyekart-final-hata-yakalayici` | Yayında (`53b87907`) |
| `jcH8s8nGulXET3bj` | `atolyekart-final-yedekleme-test` | `atolyekart-final-yedekleme` | Yayınlanmadı (karar açık) |

Bu değişiklikten sonra REST script'i yeniden çalıştırılmadı; 23.11'deki kanıttaki (aşağıda) adlar yeniden adlandırma öncesine aittir.

**Arşivlenmiş workflow'lar** (`My workflow 5` `pdpXzrUza88JBszR`, `My workflow 6` `A7nYNsV6wAirjDnF`) çalışmaz ve editör listesinde görünmez; MCP listesinde de yoktular. Script bunları "arşiv (kontrol dışı)" olarak ayrı sayar.

## Kanıt: REST API ile workflow listesi (DoD)

22.11.2026, kullanıcı terminalinde: `node --env-file=.env.local scripts/n8n-workflow-listesi.mjs`. Çıktıda anahtar ve n8n adresi yoktur.

```
Uç nokta : GET /api/v1/workflows (1 sayfa)
Toplam   : 26 workflow | aktif 8
İsim     : uygun 2 | belgelenmiş istisna 22 | ihlal 2
```

İlk çalıştırmada "ihlal 2" iki arşivlenmiş workflow'du; script aynı gün arşivdekileri kontrol dışı sayacak şekilde düzeltildi. Düzeltmeden sonraki çalıştırma (22.11.2026, kullanıcı terminalinde):

```
Toplam   : 26 workflow | aktif 8
İsim     : uygun 2 | belgelenmiş istisna 22 | ihlal 0 | arşiv (kontrol dışı) 2
```

Kalıba uyan iki ad: `atolyekart-siparis` ve `atolyekart-siparisver` (ikisi de korunuyor). 26 = MCP'deki 24 + 2 arşiv; aktif 8 MCP listesiyle aynı.

**23.11.2026 çalıştırması** (kullanıcı terminalinde, aynı komut; final workflow'ları eklendikten sonra):

```
Uç nokta : GET /api/v1/workflows (1 sayfa)
Toplam   : 36 workflow | aktif 10
İsim     : uygun 12 | belgelenmiş istisna 22 | ihlal 0 | arşiv (kontrol dışı) 2
```

Kalıba uyan 12 ad:
- 10 final workflow'u (`atolyekart-final-*-test`): asistan, hata-yakalayici, prim-hesapla, prim-hesapla-cagri, sigorta-arama, sigorta-asistan, sigorta-sartlari, sigorta-sartlari-cagri, sigorta-yukleme, yedekleme.
- `atolyekart-siparis` ve `atolyekart-siparisver`.

Aktif 10, MCP listesiyle aynı: 22.11'deki 8'e ek olarak yayınlanan `14IYDf3MyS889v0b` ve `Q8hrWLrDUCixAEfn`. Kabul ölçütü 5 karşılandı: bütün final workflow'ları "uygun". Yerel testler aynı gün 8/8 geçti (`node --test scripts/n8n-workflow-listesi.test.mjs`).

**25.11.2026 notu:** Yayınlanmamış iki test workflow'u eklendi: `atolyekart-final-alt-hata-test` ve `atolyekart-final-asistan-hata-test` (`asama-7-hata-agi-plan.md` §8). n8n'de toplam 38 workflow var (yerel n8n dışa aktarımından sayıldı). Adlar kalıpla elle karşılaştırıldı ve uyuyor. REST script'i yeniden çalıştırılmadı; yukarıdaki 23.11 sonuçları o tarih için geçerli.
