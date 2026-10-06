import assert from 'node:assert/strict'
import { beforeEach, mock, test } from 'node:test'
import { productSlug } from '../src/webhook/payload.js'
import { products } from '../src/products.js'
import { findProduct, productIds } from './lib/catalog.js'
import { signJwt, verifyJwt } from './lib/jwt.js'
import { clearOrders } from './lib/orders.js'
import { LIMIT, rateLimit, resetRateLimit } from './lib/rate-limit.js'
import { sign } from './lib/webhook.js'
import { handleApi } from './router.js'

const JWT_SECRET = 'test-icin-uydurma-anahtar-0123456789abcdef'
const WEBHOOK_SECRET = 'test-icin-uydurma-webhook-anahtari'

const order = { name: 'Ayşe Yılmaz', productId: 'luna-seramik-kupa', quantity: 2, phone: '0532 123 45 67', email: '', consent: true, source: 'react' }
const stock = { name: 'Ayşe Yılmaz', productId: 'terra-minimal-kolye', email: 'ayse@ornek.com', consent: true, source: 'react' }

function call(path, { method = 'POST', body, headers = {}, ip = '203.0.113.1' } = {}) {
  return handleApi(
    new Request(`https://example.test${path}`, {
      method,
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip, ...headers },
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )
}

let delivered
beforeEach(() => {
  resetRateLimit()
  clearOrders()
  delivered = []
  process.env.WEBHOOK_URL = 'https://webhook.test/hook'
  process.env.WEBHOOK_SECRET = WEBHOOK_SECRET
  process.env.JWT_SECRET = JWT_SECRET
  delete process.env.VERCEL_ENV
  mock.restoreAll()
  mock.method(globalThis, 'fetch', async (url, init) => {
    delivered.push({ url, headers: init.headers, body: init.body })
    return new Response('ok')
  })
  mock.method(console, 'error', () => {})
  mock.method(console, 'info', () => {})
})

test('sunucu kataloğu vitrindeki ürünlerle eşleşir', () => {
  assert.deepEqual(productIds, products.map(productSlug))
  for (const product of products) assert.equal(findProduct(productSlug(product)).name, product.name)
})

test('geçerli sipariş: 200, webhook imzalı gider, productName sunucudan gelir', async () => {
  const response = await call('/api/order', { body: { ...order, productName: 'Bedava Ürün', event: 'hack' } })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true })
  assert.equal(delivered.length, 1)
  assert.deepEqual(JSON.parse(delivered[0].body), {
    event: 'order.requested',
    name: 'Ayşe Yılmaz',
    productId: 'luna-seramik-kupa',
    productName: 'Luna Seramik Kupa',
    phone: '+905321234567',
    email: null,
    quantity: 2,
    consent: true,
    source: 'react',
  })
  assert.equal(delivered[0].headers['X-Atolyekart-Event'], 'order.requested')
  assert.equal(delivered[0].headers['X-Atolyekart-Signature'], sign(delivered[0].body, WEBHOOK_SECRET))
})

test('geçerli stok bildirimi: 200', async () => {
  const response = await call('/api/stock-request', { body: stock })
  assert.equal(response.status, 200)
  assert.equal(JSON.parse(delivered[0].body).productName, 'Terra Minimal Kolye')
  assert.equal(JSON.parse(delivered[0].body).event, 'stock_alert.requested')
})

test('doğrulama hataları 400 döner ve webhook çağrılmaz', async () => {
  const cases = [
    ['/api/order', { ...order, email: 'ad@ornek' }, 'email'],
    ['/api/order', { ...order, consent: false }, 'consent'],
    ['/api/order', { ...order, consent: 'true' }, 'consent'],
    ['/api/order', { ...order, consent: undefined }, 'consent'],
    ['/api/order', { ...order, quantity: 0 }, 'quantity'],
    ['/api/order', { ...order, quantity: 100 }, 'quantity'],
    ['/api/order', { ...order, quantity: 1.5 }, 'quantity'],
    ['/api/order', { ...order, quantity: [2] }, 'quantity'],
    ['/api/order', { ...order, phone: '12345' }, 'phone'],
    ['/api/order', { ...order, name: { $ne: '' } }, 'name'],
    ['/api/order', { ...order, name: 'a'.repeat(81) }, 'name'],
    ['/api/order', { ...order, productId: 'olmayan-urun' }, 'product'],
    ['/api/order', { ...order, source: 'baska' }, 'source'],
    ['/api/stock-request', { ...stock, email: '' }, 'email'],
    ['/api/stock-request', { ...stock, consent: false }, 'consent'],
  ]
  for (const [path, body, field] of cases) {
    resetRateLimit()
    const response = await call(path, { body })
    assert.equal(response.status, 400, `${path} ${field}`)
    assert.ok((await response.json()).errors[field], `${path} ${field}`)
  }
  assert.equal(delivered.length, 0)
})

test('bozuk gövde 400 döner', async () => {
  for (const body of ['{bozuk', '[]', '"metin"', 'null', JSON.stringify({ name: 'x'.repeat(20_000) })]) {
    resetRateLimit()
    assert.equal((await call('/api/order', { body })).status, 400)
  }
})

test('stok kuralları sunucuda uygulanır', async () => {
  const outOfStock = await call('/api/order', { body: { ...order, productId: 'terra-minimal-kolye' } })
  assert.equal(outOfStock.status, 409)
  assert.equal((await outOfStock.json()).error, 'out_of_stock')

  const inStock = await call('/api/stock-request', { body: { ...stock, productId: 'amber-soya-mum' } })
  assert.equal(inStock.status, 409)
  assert.equal((await inStock.json()).error, 'in_stock')
  assert.equal(delivered.length, 0)
})

test('yalnızca izin verilen yöntemler kabul edilir', async () => {
  for (const method of ['GET', 'PUT', 'DELETE', 'PATCH']) {
    const response = await call('/api/order', { method })
    assert.equal(response.status, 405)
    assert.equal(response.headers.get('allow'), 'POST')
  }
  assert.equal((await call('/api/stock-request', { method: 'GET' })).status, 405)
  assert.equal((await call('/api/admin/orders', { method: 'POST', body: {} })).status, 405)
  assert.equal((await call('/api/yok', { method: 'GET' })).status, 404)
})

test('rate limit: IP başına dakikada 10 istek, 11. istek 429 ve Retry-After', async () => {
  for (let i = 0; i < LIMIT; i++) assert.equal((await call('/api/order', { body: order })).status, 200)
  const blocked = await call('/api/order', { body: order })
  assert.equal(blocked.status, 429)
  const retryAfter = Number(blocked.headers.get('retry-after'))
  assert.ok(retryAfter >= 1 && retryAfter <= 60)
  assert.equal((await blocked.json()).error, 'rate_limited')
  // Sınır uç noktalar arasında ortaktır, IP'ler arasında ayrıdır.
  assert.equal((await call('/api/stock-request', { body: stock })).status, 429)
  assert.equal((await call('/api/order', { body: order, ip: '203.0.113.2' })).status, 200)
})

test('rate limit penceresi dolunca sayaç sıfırlanır', () => {
  for (let i = 0; i < LIMIT; i++) assert.ok(rateLimit('a', 1000).allowed)
  assert.equal(rateLimit('a', 1000).allowed, false)
  assert.equal(rateLimit('a', 1000).retryAfter, 60)
  assert.ok(rateLimit('a', 61_000).allowed)
})

test('webhook teslim edilemezse 502 döner ve ayrıntı sızmaz', async () => {
  mock.method(globalThis, 'fetch', async () => {
    throw new Error('connect ECONNREFUSED 10.0.0.1:443 gizli-ayrinti')
  })
  const response = await call('/api/order', { body: order })
  const text = await response.text()
  assert.equal(response.status, 502)
  assert.doesNotMatch(text, /ECONNREFUSED|gizli|stack|webhook\.test/)
})

test('beklenmeyen hata 500 döner, yanıtta teknik bilgi yoktur', async () => {
  const request = new Request('https://example.test/api/order', { method: 'POST', headers: { 'x-forwarded-for': '203.0.113.9' } })
  mock.method(request, 'text', async () => {
    throw new TypeError('gizli iç hata /var/task/server/routes/order.js:12')
  })
  const response = await handleApi(request)
  const text = await response.text()
  assert.equal(response.status, 500)
  assert.doesNotMatch(text, /gizli|var\/task|TypeError|at /)
})

test('canlıda webhook yapılandırması eksikse talep kabul edilmez', async () => {
  process.env.VERCEL_ENV = 'production'
  delete process.env.WEBHOOK_SECRET
  assert.equal((await call('/api/order', { body: order })).status, 502)
  assert.equal(delivered.length, 0)
})

test('ziyaretçi formları JWT istemez', async () => {
  assert.equal((await call('/api/order', { body: order })).status, 200)
  assert.equal((await call('/api/stock-request', { body: stock })).status, 200)
})

test('admin uç noktası: Bearer JWT, admin rolü ve geçerlilik süresi', async () => {
  const now = Math.floor(Date.now() / 1000)
  const get = (token) => call('/api/admin/orders', { method: 'GET', headers: token === undefined ? {} : { authorization: token } })
  const admin = signJwt({ sub: 't', role: 'admin', exp: now + 60 }, JWT_SECRET)

  const missing = await get()
  assert.equal(missing.status, 401)
  assert.equal(missing.headers.get('www-authenticate'), 'Bearer')
  assert.equal((await get('Bearer bozuk.token.degeri')).status, 401)
  assert.equal((await get(`Basic ${admin}`)).status, 401)
  assert.equal((await get(`Bearer ${signJwt({ role: 'admin', exp: now + 60 }, 'baska-bir-anahtar-0123456789abcdefgh')}`)).status, 401)
  assert.equal((await get(`Bearer ${signJwt({ role: 'admin', exp: now - 1 }, JWT_SECRET)}`)).status, 401)
  assert.equal((await get(`Bearer ${signJwt({ role: 'admin' }, JWT_SECRET)}`)).status, 401)
  assert.equal((await get(`Bearer ${signJwt({ role: 'user', exp: now + 60 }, JWT_SECRET)}`)).status, 403)

  resetRateLimit()
  await call('/api/order', { body: order })
  const ok = await get(`Bearer ${admin}`)
  assert.equal(ok.status, 200)
  const { orders } = await ok.json()
  assert.equal(orders.length, 1)
  assert.equal(orders[0].productName, 'Luna Seramik Kupa')
})

test('JWT: "alg: none" ve değiştirilmiş gövde reddedilir', () => {
  const now = Math.floor(Date.now() / 1000)
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const none = `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ role: 'admin', exp: now + 60 })}.`
  assert.ok(verifyJwt(none, JWT_SECRET).error)

  const [header, , signature] = signJwt({ role: 'user', exp: now + 60 }, JWT_SECRET).split('.')
  assert.equal(verifyJwt(`${header}.${encode({ role: 'admin', exp: now + 60 })}.${signature}`, JWT_SECRET).error, 'bad_signature')
})

test('JWT_SECRET yoksa admin uç noktası 503 döner', async () => {
  delete process.env.JWT_SECRET
  assert.equal((await call('/api/admin/orders', { method: 'GET' })).status, 503)
})
