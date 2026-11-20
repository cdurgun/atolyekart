import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ChatError, ERROR_TEXTS, extractReply, resolveChatUrl, sendChatMessage, TIMEOUT_MS } from './chatClient.js'

const URL_OK = 'https://n8n.example.com/webhook/abc/chat'

function fakeFetch(handler) {
  const calls = []
  const fn = async (url, init) => {
    calls.push({ url, init })
    return handler(url, init)
  }
  fn.calls = calls
  return fn
}

const reply = (body, status = 200) => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status })

test('Chat Trigger gövdesini doğru biçimde gönderir ve output alanını döner', async () => {
  const fetchImpl = fakeFetch(() => reply({ output: 'Luna kupa stokta.' }))
  const text = await sendChatMessage({ url: URL_OK, sessionId: 's-1', message: 'Kupa var mı?', fetchImpl })

  assert.equal(text, 'Luna kupa stokta.')
  assert.equal(fetchImpl.calls.length, 1)
  assert.equal(fetchImpl.calls[0].url, URL_OK)
  assert.equal(fetchImpl.calls[0].init.method, 'POST')
  assert.deepEqual(JSON.parse(fetchImpl.calls[0].init.body), {
    action: 'sendMessage',
    sessionId: 's-1',
    chatInput: 'Kupa var mı?',
  })
})

test('adres yoksa ya da geçersizse istek yapmadan config hatası verir', async () => {
  for (const url of ['', '   ', undefined, 'n8n.example.com', 'javascript:alert(1)']) {
    const fetchImpl = fakeFetch(() => reply({ output: 'x' }))
    await assert.rejects(sendChatMessage({ url, sessionId: 's', message: 'm', fetchImpl }), (error) => {
      assert.ok(error instanceof ChatError)
      assert.equal(error.kind, 'config')
      assert.equal(error.message, ERROR_TEXTS.config)
      return true
    })
    assert.equal(fetchImpl.calls.length, 0)
  }
})

test('ağ hatası anlaşılır mesaja çevrilir', async () => {
  const fetchImpl = fakeFetch(() => {
    throw new TypeError('Failed to fetch')
  })
  await assert.rejects(sendChatMessage({ url: URL_OK, sessionId: 's', message: 'm', fetchImpl }), {
    kind: 'network',
    message: ERROR_TEXTS.network,
  })
})

test('sunucu hatası ve boş yanıt server hatasıdır', async () => {
  for (const response of [reply('Internal error', 500), reply({ output: '' }), reply('')]) {
    await assert.rejects(sendChatMessage({ url: URL_OK, sessionId: 's', message: 'm', fetchImpl: async () => response }), {
      kind: 'server',
      message: ERROR_TEXTS.server,
    })
  }
})

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Başlıkları hemen dönen ama gövdesi gecikmeli (ya da hiç) gelen sahte yanıt.
// İptal sinyalini bilerek dinlemez: zaman aşımının sinyalden bağımsız çalıştığını da sınar.
function slowBody(bodyDelayMs, body = JSON.stringify({ output: 'Geç gelen yanıt' })) {
  return {
    ok: true,
    status: 200,
    text: () => (bodyDelayMs === Infinity ? new Promise(() => {}) : sleep(bodyDelayMs).then(() => body)),
  }
}

test('fetch aşamasında zaman aşımı: istek iptal edilir, timeout hatası döner', async () => {
  let signal
  const fetchImpl = (url, init) => {
    signal = init.signal
    return new Promise((resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
    })
  }
  await assert.rejects(sendChatMessage({ url: URL_OK, sessionId: 's', message: 'm', fetchImpl, timeoutMs: 20 }), {
    kind: 'timeout',
    message: ERROR_TEXTS.timeout,
  })
  assert.equal(signal.aborted, true)
})

test('yanıt gövdesi okunurken zaman aşımı: başlıklar gelmiş olsa da timeout hatası döner', async () => {
  let signal
  const fetchImpl = async (url, init) => {
    signal = init.signal
    return slowBody(Infinity)
  }
  const started = Date.now()
  await assert.rejects(sendChatMessage({ url: URL_OK, sessionId: 's', message: 'm', fetchImpl, timeoutMs: 30 }), {
    kind: 'timeout',
    message: ERROR_TEXTS.timeout,
  })
  assert.ok(Date.now() - started < 1000, 'gövde sonsuza dek beklenmemeli')
  assert.equal(signal.aborted, true, 'gövde aşamasında da istek iptal edilmeli')
})

test('süre fetch ve gövde için ortaktır: iki aşamanın toplamı sınırı aşarsa timeout', async () => {
  // Her aşama tek başına sınırın altında (60 ms < 100 ms), toplamı üstünde (120 ms).
  const fetchImpl = () => sleep(60).then(() => slowBody(60))
  await assert.rejects(sendChatMessage({ url: URL_OK, sessionId: 's', message: 'm', fetchImpl, timeoutMs: 100 }), {
    kind: 'timeout',
  })
})

test('gövde sınırdan önce gelirse yanıt başarıyla döner', async () => {
  const fetchImpl = async () => slowBody(30)
  const text = await sendChatMessage({ url: URL_OK, sessionId: 's', message: 'm', fetchImpl, timeoutMs: 500 })
  assert.equal(text, 'Geç gelen yanıt')
})

test('gövde okunurken bağlantı koparsa network hatasıdır, timeout değil', async () => {
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    text: () => Promise.reject(new TypeError('network error')),
  })
  await assert.rejects(sendChatMessage({ url: URL_OK, sessionId: 's', message: 'm', fetchImpl, timeoutMs: 500 }), {
    kind: 'network',
    message: ERROR_TEXTS.network,
  })
})

test('HTTP hata yanıtı (502/504) server hatasıdır', async () => {
  for (const status of [502, 504]) {
    await assert.rejects(
      sendChatMessage({ url: URL_OK, sessionId: 's', message: 'm', fetchImpl: async () => reply('Gateway', status) }),
      { kind: 'server', message: ERROR_TEXTS.server },
    )
  }
})

test('zaman aşımı sonrası otomatik yeniden gönderim yok; ziyaretçi aynı mesajı yeniden gönderebilir', async () => {
  const fetchImpl = fakeFetch(async () => (fetchImpl.calls.length === 1 ? slowBody(Infinity) : reply({ output: 'İkinci denemede yanıt' })))

  await assert.rejects(sendChatMessage({ url: URL_OK, sessionId: 's-9', message: 'Kupa stokta mı?', fetchImpl, timeoutMs: 20 }), {
    kind: 'timeout',
  })
  await sleep(50)
  assert.equal(fetchImpl.calls.length, 1, 'zaman aşımından sonra kendiliğinden ikinci istek gitmemeli')

  // Arayüz mesajı kutuya geri koyar (ChatWidget); ziyaretçinin yeniden gönderimi aynı oturumla çalışır.
  const text = await sendChatMessage({ url: URL_OK, sessionId: 's-9', message: 'Kupa stokta mı?', fetchImpl, timeoutMs: 500 })
  assert.equal(text, 'İkinci denemede yanıt')
  assert.equal(fetchImpl.calls.length, 2)
  assert.deepEqual(JSON.parse(fetchImpl.calls[1].init.body), JSON.parse(fetchImpl.calls[0].init.body))
})

test('zaman aşımı mesajı isteğin n8n tarafında sürüyor olabileceğini söyler', () => {
  assert.match(ERROR_TEXTS.timeout, /hâlâ/)
  assert.match(ERROR_TEXTS.timeout, /yeniden gönderebilirsiniz/)
})

test('varsayılan süre 90 saniyedir', () => {
  assert.equal(TIMEOUT_MS, 90_000)
})

test('farklı yanıt biçimlerinden metni çıkarır', () => {
  assert.equal(extractReply('{"output":" Merhaba "}'), 'Merhaba')
  assert.equal(extractReply('[{"output":"Dizi"}]'), 'Dizi')
  assert.equal(extractReply('{"text":"Metin"}'), 'Metin')
  assert.equal(
    extractReply('{"type":"begin"}\n{"type":"item","content":"Akış "}\n{"type":"item","content":"yanıtı"}\n{"type":"end"}'),
    'Akış yanıtı',
  )
  assert.equal(extractReply('{"foo":1}'), '')
  assert.equal(extractReply(''), '')
})

test('resolveChatUrl yalnızca http(s) kabul eder', () => {
  assert.equal(resolveChatUrl(` ${URL_OK} `), URL_OK)
  assert.equal(resolveChatUrl('http://localhost:5678/webhook/x/chat'), 'http://localhost:5678/webhook/x/chat')
  assert.equal(resolveChatUrl('ftp://x'), '')
  assert.equal(resolveChatUrl(null), '')
})
