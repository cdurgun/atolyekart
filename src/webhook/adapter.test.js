import assert from 'node:assert/strict'
import { afterEach, mock, test } from 'node:test'
import { WEBHOOK_TIMEOUT_MS } from '../../server/lib/webhook.js'
import { REQUEST_TIMEOUT_MS as MOBILE_TIMEOUT_MS, sendRequest as mobileSend } from '../../mobile/api.js'
import { createHttpAdapter, REQUEST_TIMEOUT_MS } from './adapter.js'

afterEach(() => mock.restoreAll())

// fetch taklidi: iptal sinyali gelene kadar bekler, gelince AbortError fırlatır.
function hangingFetch(calls) {
  return async (url, init) => {
    calls.push(init)
    return new Promise((resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(init.signal.reason ?? new DOMException('aborted', 'AbortError')))
    })
  }
}

test('istemci zaman aşımları 20 sn; web ve mobil aynı, sunucunun n8n sınırından uzun', () => {
  assert.equal(REQUEST_TIMEOUT_MS, 20_000)
  assert.equal(MOBILE_TIMEOUT_MS, REQUEST_TIMEOUT_MS)
  assert.equal(WEBHOOK_TIMEOUT_MS, 15_000)
  // Sunucu n8n'i bekleyip yanıtını döndürecek pay (ağ ve işlev süresi) kalmalı.
  assert.ok(REQUEST_TIMEOUT_MS - WEBHOOK_TIMEOUT_MS >= 5_000)
})

test('web: zaman aşımı aşılınca istek iptal edilir ve { ok: false } döner', async () => {
  const calls = []
  mock.method(globalThis, 'fetch', hangingFetch(calls))
  const result = await createHttpAdapter('https://ornek.test', { timeoutMs: 20 }).send('/api/order', { a: 1 })
  assert.deepEqual(result, { ok: false })
  assert.equal(calls.length, 1)
  assert.ok(calls[0].signal.aborted)
})

test('web: varsayılan adapter isteğe iptal sinyali verir; 2xx dışı yanıt başarı sayılmaz', async () => {
  const calls = []
  mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push(init)
    return new Response(JSON.stringify({ ok: false, message: 'Talebiniz şu anda iletilemedi.' }), { status: 502 })
  })
  const result = await createHttpAdapter('https://ornek.test').send('/api/order', {})
  assert.equal(result.ok, false)
  assert.equal(result.message, 'Talebiniz şu anda iletilemedi.')
  assert.ok(calls[0].signal instanceof AbortSignal)
  assert.equal(calls[0].signal.aborted, false)
})

test('mobil: istek 20 sn dolmadan iptal edilmez, 20. saniyede iptal edilir', async () => {
  mock.timers.enable({ apis: ['setTimeout'] })
  const calls = []
  mock.method(globalThis, 'fetch', hangingFetch(calls))
  const pending = mobileSend('/api/order', {})
  await Promise.resolve()
  mock.timers.tick(REQUEST_TIMEOUT_MS - 1)
  assert.equal(calls[0].signal.aborted, false)
  mock.timers.tick(1)
  assert.equal(calls[0].signal.aborted, true)
  assert.deepEqual(await pending, { ok: false })
})
