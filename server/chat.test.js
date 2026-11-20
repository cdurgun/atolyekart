// /api/chat proxy testleri. n8n çağrısı fetch taklidiyle yakalanır; gerçek ağ isteği yapılmaz.
import assert from 'node:assert/strict'
import { beforeEach, mock, test } from 'node:test'
import { chatConfig, chatLimits, HISTORY_TIMEOUT_MS, SEND_TIMEOUT_MS } from './routes/chat.js'
import { resetRateLimit } from './lib/rate-limit.js'
import { handleApi } from './router.js'

const N8N_URL = 'https://n8n.example.test/webhook/test-id/chat'
const USER = 'test-kullanici'
const PASSWORD = 'test-icin-uydurma-parola-0123456789'
const SESSION = '3f2b8c1e-5a4d-4e8f-9b7a-1c2d3e4f5a6b'

const send = (chatInput = 'Kupa bulaşık makinesine girer mi?', extra = {}) => ({ action: 'sendMessage', sessionId: SESSION, chatInput, ...extra })
const load = (sessionId = SESSION) => ({ action: 'loadPreviousSession', sessionId })

function chat(body, { headers = {}, ip = '203.0.113.7', method = 'POST' } = {}) {
  return handleApi(
    new Request('https://atolyekart.test/api/chat', {
      method,
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip, ...headers },
      body: method === 'GET' ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )
}

const lc = (className, kwargs) => ({ lc: 1, type: 'constructor', id: ['langchain_core', 'messages', className], kwargs })
const N8N_HISTORY = {
  data: [
    lc('HumanMessage', { content: 'Adım Deniz. Amber Soya Mum kaç saat yanar?' }),
    lc('AIMessage', { content: [], tool_calls: [{ name: 'Products', args: {}, id: 'c1' }] }),
    lc('ToolMessage', { content: '[{"row_number":3,"product_id":"mum","stock":12}]', tool_call_id: 'c1' }),
    lc('AIMessage', { content: 'Doğrulanmış bir yanma süresi bulunmuyor.' }),
    lc('SystemMessage', { content: 'gizli sistem talimatı' }),
  ],
}

let upstream // n8n'e giden istekler
let respond // n8n'in vereceği yanıt
beforeEach(() => {
  resetRateLimit()
  upstream = []
  respond = () => new Response(JSON.stringify({ output: 'Elde yıkama önerilir.' }), { status: 200 })
  process.env.N8N_CHAT_URL = N8N_URL
  process.env.N8N_CHAT_USER = USER
  process.env.N8N_CHAT_PASSWORD = PASSWORD
  mock.restoreAll()
  mock.method(globalThis, 'fetch', async (url, init) => {
    upstream.push({ url, init })
    return respond(url, init)
  })
  mock.method(console, 'error', () => {})
})

// --- Protokol ---

test('sendMessage: n8n\'e aynı protokolle, Basic Auth ile gider; yanıt { output }', async () => {
  const response = await chat(send())
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { output: 'Elde yıkama önerilir.' })

  assert.equal(upstream.length, 1)
  const { url, init } = upstream[0]
  assert.equal(url, N8N_URL)
  assert.equal(init.method, 'POST')
  assert.equal(init.headers.Authorization, `Basic ${Buffer.from(`${USER}:${PASSWORD}`).toString('base64')}`)
  assert.equal(init.redirect, 'error')
  assert.deepEqual(JSON.parse(init.body), { action: 'sendMessage', sessionId: SESSION, chatInput: 'Kupa bulaşık makinesine girer mi?' })
})

test('n8n\'e yalnızca izin verilen alanlar gider; metadata vb. ek alanlar atılır, mesaj kırpılır', async () => {
  await chat(send('  merhaba  ', { metadata: { admin: true }, productName: 'x', sessionKey: 'baska' }))
  assert.deepEqual(JSON.parse(upstream[0].init.body), { action: 'sendMessage', sessionId: SESSION, chatInput: 'merhaba' })
})

test('loadPreviousSession: geçmiş sunucuda süzülür; araç sonucu ve sistem mesajı tarayıcıya gitmez', async () => {
  respond = () => new Response(JSON.stringify(N8N_HISTORY), { status: 200 })
  const response = await chat(load())
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.deepEqual(body, {
    data: [
      { type: 'human', data: { content: 'Adım Deniz. Amber Soya Mum kaç saat yanar?' } },
      { type: 'ai', data: { content: 'Doğrulanmış bir yanma süresi bulunmuyor.' } },
    ],
  })
  const raw = JSON.stringify(body)
  assert.ok(!raw.includes('row_number') && !raw.includes('gizli sistem'))
  assert.deepEqual(JSON.parse(upstream[0].init.body), { action: 'loadPreviousSession', sessionId: SESSION })
})

test('loadPreviousSession: boş geçmiş { data: [] } döner ve rate limit sayacına mesaj olarak yazılmaz', async () => {
  respond = () => new Response('{"data":[]}', { status: 200 })
  for (let i = 0; i < chatLimits.sendMinute.limit + 2; i++) {
    const response = await chat(load())
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { data: [] })
  }
})

test('zaman aşımları: sendMessage 85 sn, geçmiş 15 sn', () => {
  assert.equal(SEND_TIMEOUT_MS, 85_000)
  assert.equal(HISTORY_TIMEOUT_MS, 15_000)
})

// --- Doğrulama ---

test('geçersiz session ID reddedilir (400) ve n8n çağrılmaz', async () => {
  for (const sessionId of ['', 'kisa', 'a b c d e f', '../../etc/passwd', '<script>1</script>', 'x'.repeat(65), 12345678, null, undefined, { id: 1 }]) {
    const response = await chat({ action: 'sendMessage', sessionId, chatInput: 'merhaba' })
    assert.equal(response.status, 400, String(sessionId))
    assert.equal((await response.json()).error, 'invalid_body')
  }
  assert.equal(upstream.length, 0)
})

test('uzun, boş ya da metin olmayan mesaj reddedilir; 1000 karakter sınırda kabul edilir', async () => {
  for (const chatInput of ['', '    ', 'x'.repeat(1001), 42, null, ['a']]) {
    assert.equal((await chat(send(chatInput))).status, 400)
  }
  assert.equal(upstream.length, 0)
  assert.equal((await chat(send('x'.repeat(1000)))).status, 200)
})

test('bilinmeyen action, bozuk JSON, dizi gövde ve 4 KB üstü gövde reddedilir', async () => {
  for (const body of [{ action: 'deleteSession', sessionId: SESSION }, { sessionId: SESSION, chatInput: 'x' }, 'not json', '[1,2]', JSON.stringify({ ...send(), pad: 'x'.repeat(4_100) })]) {
    assert.equal((await chat(body)).status, 400)
  }
  assert.equal(upstream.length, 0)
})

test('JSON olmayan Content-Type 415 alır (başka sitelerin ön kontrolsüz "basit istek" göndermesi engellenir)', async () => {
  for (const type of ['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data']) {
    const response = await chat(send(), { headers: { 'content-type': type } })
    assert.equal(response.status, 415)
  }
  assert.equal(upstream.length, 0)
})

test('yalnızca POST kabul edilir', async () => {
  const response = await chat(undefined, { method: 'GET' })
  assert.equal(response.status, 405)
  assert.equal(response.headers.get('allow'), 'POST')
})

// --- Origin / CORS ---

test('başka origin ya da cross-site tarayıcı isteği 403 alır; n8n çağrılmaz', async () => {
  for (const headers of [
    { origin: 'https://kotu-site.example' },
    { origin: 'https://atolyekart.test.kotu-site.example' },
    { origin: 'null' },
    { 'sec-fetch-site': 'cross-site' },
    { 'sec-fetch-site': 'same-site', origin: 'https://atolyekart.test' },
  ]) {
    const response = await chat(send(), { headers })
    assert.equal(response.status, 403, JSON.stringify(headers))
  }
  assert.equal(upstream.length, 0)
})

test('aynı origin ve Origin başlığı olmayan istek kabul edilir; yanıtta CORS başlığı yoktur', async () => {
  for (const headers of [{ origin: 'https://atolyekart.test', 'sec-fetch-site': 'same-origin' }, {}]) {
    const response = await chat(send(), { headers })
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('access-control-allow-origin'), null)
    assert.equal(response.headers.get('cache-control'), 'no-store')
  }
})

// --- Rate limit ---

test('sendMessage dakikada 6: 7. istek 429 + Retry-After; başka IP etkilenmez', async () => {
  for (let i = 0; i < 6; i++) assert.equal((await chat(send())).status, 200)
  const blocked = await chat(send())
  assert.equal(blocked.status, 429)
  assert.ok(Number(blocked.headers.get('retry-after')) > 0)
  assert.equal((await blocked.json()).error, 'rate_limited')
  assert.equal(upstream.length, 6)
  assert.equal((await chat(send(), { ip: '198.51.100.9' })).status, 200)
})

test('tüm /api/chat istekleri dakikada 20 ile sınırlı; geçersiz istekler de sayılır', async () => {
  for (let i = 0; i < 20; i++) assert.equal((await chat('bozuk')).status, 400)
  assert.equal((await chat(load())).status, 429)
})

test('saatlik sınır: 60 mesajdan sonra pencere dolana kadar kapalı', () => {
  const now = 1_000_000
  for (let i = 0; i < 60; i++) assert.ok(chatLimits.sendHour.check('ip', now + i * 61_000).allowed)
  const blocked = chatLimits.sendHour.check('ip', now + 3_599_999)
  assert.equal(blocked.allowed, false)
  assert.ok(chatLimits.sendHour.check('ip', now + 3_600_000).allowed)
})

test('sohbet ve formlar ayrı sayaç kullanır: biri dolunca diğeri çalışır', async () => {
  for (let i = 0; i < 6; i++) await chat(send())
  assert.equal((await chat(send())).status, 429)
  // Aynı IP'den form uç noktası hâlâ açık (rate limit değil, doğrulama hatası döner).
  const form = await handleApi(
    new Request('https://atolyekart.test/api/order', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.7' }, body: '{}' }),
  )
  assert.equal(form.status, 400)
})

// --- Yapılandırma, n8n hataları ve sır güvenliği ---

test('yapılandırma eksik ya da güvensizse 503 ve n8n çağrılmaz', async () => {
  for (const env of [{ N8N_CHAT_URL: '' }, { N8N_CHAT_USER: '' }, { N8N_CHAT_PASSWORD: '' }, { N8N_CHAT_URL: 'http://n8n.example.test/chat' }, { N8N_CHAT_URL: 'ftp://x' }]) {
    resetRateLimit()
    Object.assign(process.env, { N8N_CHAT_URL: N8N_URL, N8N_CHAT_USER: USER, N8N_CHAT_PASSWORD: PASSWORD }, env)
    const response = await chat(send())
    assert.equal(response.status, 503, JSON.stringify(env))
    assert.equal((await response.json()).error, 'chat_unavailable')
  }
  assert.equal(upstream.length, 0)
  assert.ok(chatConfig({ N8N_CHAT_URL: 'http://localhost:5678/webhook/x/chat', N8N_CHAT_USER: 'u', N8N_CHAT_PASSWORD: 'p' }))
})

test('n8n hataları: 401/403/404/500 → 502, zaman aşımı → 504, ağ hatası → 502, boş yanıt → 502', async () => {
  const cases = [
    [() => new Response('Authorization is required!', { status: 401 }), 502],
    [() => new Response('Authorization data is wrong!', { status: 403 }), 502],
    [() => new Response('not found', { status: 404 }), 502],
    [() => new Response('{"message":"Error in workflow"}', { status: 500 }), 502],
    [() => Promise.reject(new DOMException('timed out', 'TimeoutError')), 504],
    [() => Promise.reject(new TypeError('fetch failed')), 502],
    [() => new Response('{"output":""}', { status: 200 }), 502],
    [() => new Response('x'.repeat(500_001), { status: 200 }), 502],
  ]
  for (const [handler, status] of cases) {
    resetRateLimit()
    respond = handler
    const response = await chat(send())
    assert.equal(response.status, status)
  }
})

test('hiçbir yanıtta ve günlükte n8n adresi, kullanıcı adı ya da parola görünmez', async () => {
  const logged = []
  console.error.mock.mockImplementation((...args) => logged.push(args.join(' ')))
  const bodies = []
  for (const handler of [() => new Response('nope', { status: 401 }), () => Promise.reject(new TypeError('fetch failed')), () => new Response('{"output":"ok"}')]) {
    resetRateLimit()
    respond = handler
    bodies.push(await (await chat(send())).text())
  }
  process.env.N8N_CHAT_PASSWORD = ''
  bodies.push(await (await chat(send())).text())
  const everything = [...bodies, ...logged].join('\n')
  for (const secret of [PASSWORD, USER, N8N_URL, 'n8n.example.test', Buffer.from(`${USER}:${PASSWORD}`).toString('base64')]) {
    assert.ok(!everything.includes(secret), `sızıntı: ${secret}`)
  }
})
