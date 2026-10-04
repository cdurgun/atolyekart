// Bir proje kopyasında React (vite preview) ve CDN sürümlerini 1600 / 800 / 390px'te ölçer.
// Kullanım: node duzen_olc.mjs <proje-kopyası> <çıktı-klasörü>
// Çıktı: <çıktı-klasörü>/layout.json  ->  { ok, evidence }
// ok: iki sürümde yatay taşma yok ve sayfa yükseklikleri eşit. Google Chrome ve kurulu node_modules gerekir.
import { spawn, execSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const repo = resolve(process.argv[2])
const out = resolve(process.argv[3])
const PORT = 5191
const DEBUG_PORT = 9341
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const procs = []
const stop = (code) => { procs.forEach((p) => p.kill()); process.exit(code) }
process.on('uncaughtException', (error) => { console.error(error); stop(1) })

execSync('npm run build', { cwd: repo, stdio: 'ignore' })
procs.push(spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: repo, stdio: 'ignore' }))
procs.push(spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'atolyekart-'))}`,
  '--no-first-run', '--hide-scrollbars', 'about:blank',
], { stdio: 'ignore' }))

let targets
for (let i = 0; i < 40; i++) {
  try {
    targets = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`)).json()
    await fetch(`http://localhost:${PORT}/`)
    break
  } catch { await sleep(500) }
}

const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let seq = 0
const pending = new Map()
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id) { pending.get(d.id)(d.result ?? d); pending.delete(d.id) } }
const send = (method, params = {}) => new Promise((r) => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })) })
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.value
await send('Page.enable')
await send('Runtime.enable')

async function measure(url, width) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url })
  for (let i = 0; i < 30; i++) {
    await sleep(400)
    if (await evaluate(`document.querySelectorAll('.product-card').length > 0`)) break
  }
  await sleep(600)
  await evaluate('document.fonts.ready.then(() => 1)')
  return evaluate(`({ page: document.documentElement.scrollHeight, overflow: document.documentElement.scrollWidth > innerWidth })`)
}

let ok = true
const rows = []
for (const width of [1600, 800, 390]) {
  const react = await measure(`http://localhost:${PORT}/`, width)
  const cdn = await measure(`file://${repo}/cdn/index.html`, width)
  ok = ok && !react.overflow && !cdn.overflow && react.page === cdn.page
  rows.push(`${width}px: React ${react.page} / CDN ${cdn.page}${react.overflow || cdn.overflow ? ' TAŞMA' : ''}`)
}

writeFileSync(join(out, 'layout.json'), JSON.stringify({ ok, evidence: rows.join(' · ') }))
console.log(rows.join('\n'))
ws.close()
stop(0)
