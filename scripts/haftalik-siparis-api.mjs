// Hafta 6 / 6.3 — n8n REST API ile bu haftanın başarılı "atolyekart-siparis" çalışmaları.
//
// Çalıştırma (atolyekart klasöründe):
//   node --env-file=.env.local <bu dosyanın yolu>
//
// .env.local içinde gereken iki satır (değerler yalnızca orada durur):
//   N8N_API_URL=https://<n8n alan adı>      (yalnızca kök adres; /api/v1 eklenmez)
//   N8N_API_KEY=<n8n Settings → n8n API'de oluşturulan anahtar>
//
// Güvenlik:
// - Anahtar komut satırına yazılmaz; Node onu .env.local'den ortam değişkeni olarak okur.
// - Anahtar ve n8n adresi hiçbir zaman ekrana yazdırılmaz.
// - Yalnızca GET isteği yapılır. Yönlendirme takip edilmez (anahtar başka bir alan adına gitmesin).
// - https zorunludur (yalnızca localhost/127.0.0.1 için http).

const WORKFLOW_ID = 'UwG1w0v0h9ekh8u6' // atolyekart-siparis
const EXPECTED_NAME = 'atolyekart-siparis'
// Europe/Istanbul: Türkiye 2016'dan beri yaz saati uygulamıyor, ofset sabit +03:00.
const RANGE_START = new Date('2026-11-16T00:00:00.000+03:00')
const RANGE_END = new Date('2026-11-22T23:59:59.999+03:00')
const PAGE_LIMIT = 100
const TIMEOUT_MS = 15_000

const fmt = (d) =>
  new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'short', timeStyle: 'medium' }).format(d)

function fail(message) {
  console.error(`HATA: ${message}`)
  process.exit(1)
}

function readConfig() {
  const rawUrl = (process.env.N8N_API_URL ?? '').trim()
  const key = (process.env.N8N_API_KEY ?? '').trim()
  if (!rawUrl || !key) fail('N8N_API_URL ve N8N_API_KEY .env.local içinde tanımlı olmalı (node --env-file=.env.local ile çalıştırın).')
  let url
  try {
    url = new URL(rawUrl)
  } catch {
    fail('N8N_API_URL geçerli bir adres değil.')
  }
  const local = ['localhost', '127.0.0.1'].includes(url.hostname)
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) fail('N8N_API_URL https olmalı.')
  return { base: url.origin, key }
}

async function apiGet(base, key, path, params = {}) {
  const url = new URL(`/api/v1${path}`, base)
  for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, String(v))
  let res
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: { 'X-N8N-API-KEY': key, accept: 'application/json' },
      redirect: 'error',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (err) {
    fail(`İstek başarısız (${err?.name ?? 'ağ hatası'}).`)
  }
  // Hata gövdesi yazdırılmaz; yalnızca durum kodu ve kısa açıklama.
  if (res.status === 401 || res.status === 403) fail(`n8n API ${res.status}: anahtar geçersiz, süresi dolmuş ya da yetkisi yok.`)
  if (!res.ok) fail(`n8n API ${res.status} döndü (${path}).`)
  return res.json()
}

const { base, key } = readConfig()

// 1) Workflow'un adını doğrula (yalnızca okuma).
const workflow = await apiGet(base, key, `/workflows/${WORKFLOW_ID}`, { excludePinnedData: true })
if (workflow?.name !== EXPECTED_NAME) fail(`Workflow adı beklenenden farklı: "${workflow?.name}".`)

// 2) Başarılı çalışmaları sayfa sayfa çek. API tarih filtresi sunmadığı için aralık burada uygulanır.
//    Sonuçlar en yeniden eskiye gelir; aralığın başlangıcından eski bir kayda ulaşınca durulur.
const inRange = []
let cursor
let pages = 0
let scanned = 0
outer: do {
  const page = await apiGet(base, key, '/executions', {
    workflowId: WORKFLOW_ID,
    status: 'success',
    includeData: false,
    limit: PAGE_LIMIT,
    cursor,
  })
  pages += 1
  for (const ex of page.data ?? []) {
    scanned += 1
    const started = new Date(ex.startedAt)
    if (started < RANGE_START) break outer
    if (started <= RANGE_END) inRange.push(ex)
  }
  cursor = page.nextCursor ?? undefined
} while (cursor)

inRange.sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt))

console.log(`Workflow       : ${workflow.name} (${WORKFLOW_ID})`)
console.log(`Aralık (İst.)  : ${fmt(RANGE_START)} – ${fmt(RANGE_END)}`)
console.log(`Uç nokta       : GET /api/v1/executions?workflowId=…&status=success (${pages} sayfa, ${scanned} kayıt tarandı)`)
console.log(`Başarılı çalışma sayısı: ${inRange.length}`)
for (const ex of inRange) {
  console.log(`  - ID ${ex.id} | başlangıç ${fmt(new Date(ex.startedAt))} | bitiş ${ex.stoppedAt ? fmt(new Date(ex.stoppedAt)) : '—'} | mod ${ex.mode}`)
}

// 3) Daha önceki iki kaynakla karşılaştırma (21.11.2026 01:07 itibarıyla).
const MCP_IDS = ['136']
const SHEETS = { row: 12, createdAt: '2026-11-17T17:07:45.683+03:00' }
const apiIds = inRange.map((ex) => String(ex.id))
const sameAsMcp = apiIds.length === MCP_IDS.length && MCP_IDS.every((id) => apiIds.includes(id))
console.log('\nKarşılaştırma:')
console.log(`  MCP sorgusu    : ${MCP_IDS.length} çalışma (ID ${MCP_IDS.join(', ')}) → ${sameAsMcp ? 'AYNI' : 'FARKLI'}`)
const match = inRange.find((ex) => Math.abs(new Date(ex.startedAt) - new Date(SHEETS.createdAt)) < 60_000)
console.log(`  Google Sheets  : 1 satır (satır ${SHEETS.row}, ${fmt(new Date(SHEETS.createdAt))}) → ${match ? `ID ${match.id} ile eşleşiyor` : 'eşleşen çalışma yok'}`)
if (apiIds.length !== MCP_IDS.length) {
  console.log('  Not: Fark varsa olası nedenler: 21.11 01:07 sonrasında yeni sipariş, n8n kayıt budaması ya da elle silinen çalışma.')
}
console.log('\nSipariş sayımı: ham kayıt 1 | gerçek olduğu doğrulanmış 0 | test olma ihtimali yüksek, doğrulanmamış 1 (satır 12)')
