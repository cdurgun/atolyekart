import assert from 'node:assert/strict'
import { test } from 'node:test'
import { handleApi } from '../../../../server/router.js'
import { clearOrders, listOrders } from '../../../../server/lib/orders.js'
import { resetRateLimit } from '../../../../server/lib/rate-limit.js'
import {
  cartTotals,
  FAILURE_TEXT,
  isOrderable,
  NOT_ORDERABLE_TEXT,
  OUT_OF_STOCK_TEXT,
  SKIPPED_TEXT,
  submitOrder,
  validateContact,
} from './submitOrder.js'

const contact = { name: 'Defne Akıncı', phone: '0532 890 44 21', email: '', consent: true }
const kupa = { id: 'luna-seramik-kupa', qty: 2, price: 420 }
const mum = { id: 'amber-soya-mum', qty: 1, price: 350 }
const kolye = { id: 'terra-minimal-kolye', qty: 1, price: 290 }

function validValues() {
  const { values, errors } = validateContact(contact)
  assert.deepEqual(errors, {})
  return values
}

// Sahte gönderici: çağrıları kaydeder, yanıtı sıradaki fonksiyondan alır.
function fakeSend(respond = () => ({ ok: true })) {
  const calls = []
  const send = async (path, body) => {
    calls.push({ path, body })
    return respond(body, calls.length)
  }
  return { send, calls }
}

// Gerçek sunucu koduna (server/router.js) giden gönderici; ağ ve webhook kullanılmaz.
async function apiSend(path, body) {
  const response = await handleApi(
    new Request(`http://localhost${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.7' },
      body: JSON.stringify(body),
    }),
  )
  const data = await response.json()
  return { ok: response.ok, message: data.message, errors: data.errors }
}

test('iletişim doğrulaması: eksik ad, geçersiz telefon ve onaysız rıza reddedilir', () => {
  const { errors } = validateContact({ name: '', phone: '12345', email: '', consent: false })
  assert.deepEqual(Object.keys(errors).sort(), ['consent', 'name', 'phone'])
})

test('iletişim doğrulaması: telefon +905 biçimine çevrilir, boş e-posta null olur', () => {
  assert.deepEqual(validValues(), { name: 'Defne Akıncı', phone: '+905328904421', email: null, consent: true })
})

test('tüm satırlar başarılı: her satır için mevcut sözleşmeyle bir /api/order isteği', async () => {
  const { send, calls } = fakeSend()
  const results = await submitOrder([kupa, mum], validValues(), send)
  assert.deepEqual(results, [
    { id: kupa.id, ok: true },
    { id: mum.id, ok: true },
  ])
  assert.equal(calls.length, 2)
  assert.deepEqual(calls[0], {
    path: '/api/order',
    body: {
      name: 'Defne Akıncı',
      productId: 'luna-seramik-kupa',
      phone: '+905328904421',
      email: null,
      quantity: 2,
      consent: true,
      source: 'react',
    },
  })
  // Fiyat, ürün adı ve adres gönderilmez.
  assert.deepEqual(Object.keys(calls[1].body), ['name', 'productId', 'phone', 'email', 'quantity', 'consent', 'source'])
})

test('kısmi başarı: bir satır başarılı, diğeri sunucu mesajıyla başarısız', async () => {
  const { send } = fakeSend((body) =>
    body.productId === 'terra-minimal-kolye' ? { ok: false, message: 'Bu ürün şu anda stokta yok. Stok bildirimi isteyebilirsiniz.' } : { ok: true },
  )
  const results = await submitOrder([mum, kolye], validValues(), send)
  assert.deepEqual(results, [
    { id: mum.id, ok: true },
    { id: kolye.id, ok: false, message: OUT_OF_STOCK_TEXT, errors: undefined },
  ])
})

test('ağ ya da webhook hatası: mesajsız başarısızlık ve fırlatılan hata Türkçe genel mesaja döner', async () => {
  const failing = fakeSend(() => ({ ok: false }))
  const thrown = { send: async () => { throw new Error('ağ') } }
  assert.equal((await submitOrder([kupa], validValues(), failing.send))[0].message, FAILURE_TEXT)
  assert.equal((await submitOrder([kupa], validValues(), thrown.send))[0].message, FAILURE_TEXT)
})

test('sunucu alan hatası dönerse kalan satırlar gönderilmez', async () => {
  const { send, calls } = fakeSend(() => ({ ok: false, message: 'Lütfen işaretli alanları düzeltin.', errors: { phone: 'x' } }))
  const results = await submitOrder([kupa, mum], validValues(), send)
  assert.equal(calls.length, 1)
  assert.equal(results[1].skipped, true)
  assert.equal(results[1].message, SKIPPED_TEXT)
})

test('konsept ürünler siparişe gönderilemez', async () => {
  const { send, calls } = fakeSend()
  const results = await submitOrder([{ id: 'benekli-stoneware-amfora', qty: 1, price: 0 }], validValues(), send)
  assert.equal(isOrderable('benekli-stoneware-amfora'), false)
  assert.equal(isOrderable('amber-soya-mum'), true)
  assert.equal(calls.length, 0)
  assert.deepEqual(results, [{ id: 'benekli-stoneware-amfora', ok: false, message: NOT_ORDERABLE_TEXT }])
})

test('sepet toplamı: adet × fiyat toplanır', () => {
  assert.deepEqual(cartTotals([kupa, mum, kolye]), { count: 4, total: 420 * 2 + 350 + 290 })
  assert.deepEqual(cartTotals([]), { count: 0, total: 0 })
})

test('gerçek sunucu kodu: stoktaki satırlar kabul edilir, Terra Minimal Kolye 409 ile reddedilir', async (t) => {
  // Webhook adresi boşken olay yalnızca günlüğe yazılır; dış istek yapılmaz.
  const saved = { url: process.env.WEBHOOK_URL, env: process.env.VERCEL_ENV }
  delete process.env.WEBHOOK_URL
  delete process.env.VERCEL_ENV
  t.mock.method(console, 'info', () => {})
  resetRateLimit()
  clearOrders()
  t.after(() => {
    if (saved.url !== undefined) process.env.WEBHOOK_URL = saved.url
    if (saved.env !== undefined) process.env.VERCEL_ENV = saved.env
    resetRateLimit()
    clearOrders()
  })

  const results = await submitOrder([kupa, kolye, mum], validValues(), apiSend)
  assert.deepEqual(
    results.map((r) => [r.id, r.ok]),
    [[kupa.id, true], [kolye.id, false], [mum.id, true]],
  )
  // Sunucunun "stok bildirimi isteyebilirsiniz" önerisi önizlemede gösterilmez.
  assert.equal(results[1].message, OUT_OF_STOCK_TEXT)
  assert.deepEqual(
    listOrders().map((o) => [o.productId, o.quantity, o.source]),
    [[mum.id, 1, 'react'], [kupa.id, 2, 'react']],
  )
})
