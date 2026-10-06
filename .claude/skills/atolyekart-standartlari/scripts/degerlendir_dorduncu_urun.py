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
app, catalog, claude, design = read('src/products.js'), read('server/lib/catalog.js'), read('CLAUDE.md'), read('DESIGN.md')
out = []
def check(text, passed, evidence): out.append({'text': text, 'passed': bool(passed), 'evidence': evidence})

b = sh('npm run build')
check('npm run build hatasız', b.returncode == 0, (b.stdout + b.stderr).strip().splitlines()[-1] if (b.stdout + b.stderr).strip() else 'çıktı yok')
t = sh('npm test')
check('npm test hatasız (sunucu kataloğu vitrindeki ürünlerle eşleşiyor)', t.returncode == 0, next((l for l in t.stdout.splitlines() if l.startswith('# fail')), 'çıktı yok'))

m = re.search(r"\{[^{}]*Sedir Ahşap Tepsi[^{}]*\}", app)
block = m.group(0) if m else ''
check('Ürün products dizisine image: null ile eklendi (olmayan dosyaya yol yazılmadı)', 'image: null' in block, block.replace('\n', ' ')[:200] or 'src/products.js içinde ürün yok')

texts = ['Sedir Ahşap Tepsi', 'El Yapımı Aksesuarlar', '520 TL', 'Sedir ağacından, elde oyulmuş servis tepsisi.']
missing = [t for t in texts if t not in block]
check('Ad, kategori, fiyat ve açıklama verildiği gibi', not missing, 'eksik: ' + ', '.join(missing) if missing else 'dört metin de var')

st = sh('git status --porcelain').stdout
new_assets = [l for l in st.splitlines() if re.search(r'\.(jpg|jpeg|png|svg|webp|gif)$', l)]
check('Yapay görsel, SVG ya da placeholder dosyası eklenmedi', not new_assets, '; '.join(new_assets) or 'yeni görsel dosyası yok')

comp = sh('git diff --stat -- src/components/ProductCard.jsx src/components/ProductList.jsx src/components/ProductImage.jsx').stdout.strip()
check('Kart bileşenleri değişmedi (yalnızca veri eklendi)', not comp, comp or 'ProductCard / ProductList / ProductImage aynı')

in_catalog = re.search(r"id: 'sedir-ahsap-tepsi', name: 'Sedir Ahşap Tepsi'", catalog) is not None
check("server/lib/catalog.js: ürün slug'ı ve adıyla eklendi", in_catalog, 'katalogda ' + ('var' if in_catalog else 'yok'))

check('CLAUDE.md ürün tablosu güncellendi', 'Sedir Ahşap Tepsi' in claude, 'CLAUDE.md içinde ürün ' + ('var' if 'Sedir Ahşap Tepsi' in claude else 'yok'))
dd = sh('git diff --stat -- DESIGN.md').stdout.strip()
check('DESIGN.md yeni durumu anlatıyor (dört ürün / yeni sayfa yükseklikleri)', bool(dd), dd or 'DESIGN.md değişmedi')

lay = run / 'layout.json'
if lay.exists():
    L = json.loads(lay.read_text())
    check('1600 / 800 / 390px: yatay taşma yok', L['ok'], L['evidence'])

passed = sum(o['passed'] for o in out)
(run / 'grading.json').write_text(json.dumps({'expectations': out, 'summary': {'passed': passed, 'failed': len(out) - passed, 'total': len(out), 'pass_rate': round(passed / len(out), 2)}}, ensure_ascii=False, indent=1))
print(f'{passed}/{len(out)} beklenti karşılandı')
for o in out: print(' ', 'OK ' if o['passed'] else 'XX ', o['text'], '—', o['evidence'])
