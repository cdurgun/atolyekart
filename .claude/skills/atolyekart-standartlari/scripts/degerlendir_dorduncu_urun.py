"""evals/evals.json içindeki 1. senaryonun (dorduncu-urun) beklentilerini bir proje kopyasında denetler.

Kullanım:
  python3 degerlendir_dorduncu_urun.py <proje-kopyası> [<çıktı-klasörü>]

Proje kopyasında senaryo uygulanmış ve node_modules kurulu olmalı. Çıktı klasöründe duzen_olc.mjs'in
yazdığı layout.json varsa düzen beklentisi de denetlenir; sonuç aynı klasöre grading.json olarak yazılır.
"""
import json, re, subprocess, sys, pathlib

repo = pathlib.Path(sys.argv[1]).resolve()
run = pathlib.Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else repo
def sh(cmd): return subprocess.run(cmd, shell=True, cwd=repo, capture_output=True, text=True)
def read(p):
    f = repo / p
    return f.read_text() if f.exists() else ''
app, cdn, claude, design = read('src/App.jsx'), read('cdn/index.html'), read('CLAUDE.md'), read('DESIGN.md')
out = []
def check(text, passed, evidence): out.append({'text': text, 'passed': bool(passed), 'evidence': evidence})

b = sh('npm run build')
check('npm run build hatasız', b.returncode == 0, (b.stdout + b.stderr).strip().splitlines()[-1] if (b.stdout + b.stderr).strip() else 'çıktı yok')

m = re.search(r"\{[^{}]*Sedir Ahşap Tepsi[^{}]*\}", app)
block = m.group(0) if m else ''
check('Ürün products dizisine image: null ile eklendi (olmayan dosyaya yol yazılmadı)', 'image: null' in block, block.replace('\n', ' ')[:200] or 'App.jsx içinde ürün yok')

texts = ['Sedir Ahşap Tepsi', 'El Yapımı Aksesuarlar', '520 TL', 'Sedir ağacından, elde oyulmuş servis tepsisi.']
missing = [t for t in texts if t not in block] + [f'cdn: {t}' for t in texts if t not in cdn]
check('Ad, kategori, fiyat ve açıklama React ve CDN sürümünde verildiği gibi', not missing, 'eksik: ' + ', '.join(missing) if missing else 'dört metin iki sürümde de var')

st = sh('git status --porcelain').stdout
new_assets = [l for l in st.splitlines() if re.search(r'\.(jpg|jpeg|png|svg|webp|gif)$', l)]
check('Yapay görsel, SVG ya da placeholder dosyası eklenmedi', not new_assets, '; '.join(new_assets) or 'yeni görsel dosyası yok')

comp = sh('git diff --stat -- src/components/ProductCard.jsx src/components/ProductList.jsx src/components/ProductImage.jsx').stdout.strip()
check('Kart bileşenleri değişmedi (yalnızca veri eklendi)', not comp, comp or 'ProductCard / ProductList / ProductImage aynı')

cards = re.findall(r'<article class="product-card">(.*?)</article>', cdn, re.S)
# Yalnızca sınıf sırası karşılaştırılır: fotoğrafsız kartta yuva <img> değil <div> olur, bu doğru davranıştır.
shape = lambda c: re.findall(r'class="(product-[\w-]+)"', c)
same = len(cards) == 4 and all(shape(c) == shape(cards[0]) for c in cards)
empty_slot = len(cards) == 4 and re.search(r'<div class="product-image" aria-hidden="true">\s*</div>', cards[3]) is not None
check('cdn/index.html: dördüncü kart var ve işaretlemesi diğer kartlarla aynı', same, f'{len(cards)} kart; ' + ('yapılar aynı' if same else 'yapılar farklı ya da kart eksik'))
check('cdn/index.html: fotoğrafsız kartta boş, ekran okuyucudan gizli görsel yuvası', empty_slot, 'div.product-image[aria-hidden] bulundu' if empty_slot else 'boş yuva bulunamadı')

opts = len(re.findall(r'<option value="sedir-ahsap-tepsi">Sedir Ahşap Tepsi</option>', cdn))
check('cdn/index.html: iki formdaki ürün seçeneklerine eklendi (value = slug)', opts == 2, f'{opts} / 2 seçenek')

gen = sh("{ sed -n '1,8p' cdn/styles.css; sed -e \"s#url('/fonts/#url('fonts/#g\" -e \"s#url('/images/#url('../public/images/#g\" src/styles.css; } | cmp -s - cdn/styles.css")
check('cdn/styles.css, src/styles.css ile eşit (elle düzenlenmedi, eski kalmadı)', gen.returncode == 0, 'yeniden üretilen dosya ile aynı' if gen.returncode == 0 else 'yeniden üretilen dosyadan farklı')

check('CLAUDE.md ürün tablosu güncellendi', 'Sedir Ahşap Tepsi' in claude, 'CLAUDE.md içinde ürün ' + ('var' if 'Sedir Ahşap Tepsi' in claude else 'yok'))
dd = sh('git diff --stat -- DESIGN.md').stdout.strip()
check('DESIGN.md yeni durumu anlatıyor (dört ürün / yeni sayfa yükseklikleri)', bool(dd), dd or 'DESIGN.md değişmedi')

lay = run / 'layout.json'
if lay.exists():
    L = json.loads(lay.read_text())
    check('1600 / 800 / 390px: yatay taşma yok, React ve CDN sayfa yükseklikleri eşit', L['ok'], L['evidence'])

passed = sum(o['passed'] for o in out)
(run / 'grading.json').write_text(json.dumps({'expectations': out, 'summary': {'passed': passed, 'failed': len(out) - passed, 'total': len(out), 'pass_rate': round(passed / len(out), 2)}}, ensure_ascii=False, indent=1))
print(f'{passed}/{len(out)} beklenti karşılandı')
for o in out: print(' ', 'OK ' if o['passed'] else 'XX ', o['text'], '—', o['evidence'])
