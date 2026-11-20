import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CHAT_PATH,
  ChatError,
  ERROR_TEXTS,
  extractReply,
  getOrCreateSessionId,
  loadChatHistory,
  MAX_HISTORY_MESSAGES,
  NEW_CHAT_NOTICE,
  parseHistory,
  readStoredSessionId,
  resolveChatUrl,
  sendChatMessage,
  SESSION_STORAGE_KEY,
  startNewSession,
  TIMEOUT_MS,
} from './chatClient.js'

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

// --- Oturum kimliği (localStorage) ---

function memoryStorage(initial = {}) {
  const data = { ...initial }
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value)
    },
  }
}

test('oturum kimliği ilk seferde üretilip kaydedilir, sonra aynısı döner', () => {
  const storage = memoryStorage()
  assert.equal(readStoredSessionId(storage), null)
  const first = getOrCreateSessionId(storage)
  assert.match(first, /^[A-Za-z0-9-]{8,64}$/)
  assert.equal(storage.data[SESSION_STORAGE_KEY], first)
  assert.equal(getOrCreateSessionId(storage), first)
  assert.equal(readStoredSessionId(storage), first)
})

test('bozuk ya da elle değiştirilmiş kayıtlı kimlik yok sayılır ve yenisi yazılır', () => {
  for (const bad of ['', 'kisa', 'a b c d e f g h', '<script>x</script>', 'x'.repeat(65)]) {
    const storage = memoryStorage({ [SESSION_STORAGE_KEY]: bad })
    assert.equal(readStoredSessionId(storage), null)
    const id = getOrCreateSessionId(storage)
    assert.notEqual(id, bad)
    assert.equal(storage.data[SESSION_STORAGE_KEY], id)
  }
})

test('localStorage hata fırlatsa ya da yoksa da kimlik üretilir', () => {
  const throwing = {
    getItem() {
      throw new Error('SecurityError')
    },
    setItem() {
      throw new Error('QuotaExceededError')
    },
  }
  assert.equal(readStoredSessionId(throwing), null)
  assert.match(getOrCreateSessionId(throwing), /^[A-Za-z0-9-]{8,64}$/)
  assert.match(getOrCreateSessionId(null), /^[A-Za-z0-9-]{8,64}$/)
})

// --- Yeni sohbet ---

test('yeni sohbet eski kimliği tarayıcıdan siler, farklı yeni bir kimlik üretip kaydeder', () => {
  const old = 'eski-oturum-12345678'
  const storage = memoryStorage({ [SESSION_STORAGE_KEY]: old })
  storage.removeItem = (key) => delete storage.data[key]
  const removed = []
  const spy = { ...storage, removeItem: (key) => (removed.push(key), storage.removeItem(key)) }

  const fresh = startNewSession(spy)
  assert.deepEqual(removed, [SESSION_STORAGE_KEY])
  assert.notEqual(fresh, old)
  assert.match(fresh, /^[A-Za-z0-9-]{8,64}$/)
  assert.equal(storage.data[SESSION_STORAGE_KEY], fresh)
  assert.equal(readStoredSessionId(storage), fresh)
})

test('yeni sohbet ağ isteği yapmaz (sunucudaki kayıt silinmez)', () => {
  const realFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => {
    calls += 1
    throw new Error('beklenmeyen istek')
  }
  try {
    startNewSession(memoryStorage({ [SESSION_STORAGE_KEY]: 'eski-oturum-12345678' }))
  } finally {
    globalThis.fetch = realFetch
  }
  assert.equal(calls, 0)
})

test('yeni sohbet depolama hata fırlatsa ya da yoksa da yeni kimlik döner', () => {
  const throwing = {
    getItem() {
      throw new Error('SecurityError')
    },
    setItem() {
      throw new Error('QuotaExceededError')
    },
    removeItem() {
      throw new Error('SecurityError')
    },
  }
  assert.match(startNewSession(throwing), /^[A-Za-z0-9-]{8,64}$/)
  assert.match(startNewSession(null), /^[A-Za-z0-9-]{8,64}$/)
})

test('yeni sohbet bilgilendirmesi sunucudaki kaydın silinmediğini açıkça söyler', () => {
  assert.match(NEW_CHAT_NOTICE, /bu cihazdan/)
  assert.match(NEW_CHAT_NOTICE, /sunucu[^.]*silinmedi/)
  assert.doesNotMatch(NEW_CHAT_NOTICE, /sunucudan silindi|kalıcı olarak silindi|tamamen silindi/)
})

// --- Geçmiş (loadPreviousSession) ---

// n8n Chat Trigger'ın döndürdüğü LangChain toJSON() biçimi; Redis'teki gerçek bir tur örnek alındı:
// ziyaretçi sorusu → araç çağıran boş AI mesajı → Google Sheets satırı içeren araç sonucu → AI yanıtı.
const lc = (className, kwargs) => ({ lc: 1, type: 'constructor', id: ['langchain_core', 'messages', className], kwargs })
const N8N_HISTORY = {
  data: [
    lc('HumanMessage', { content: 'Adım Deniz. Amber Soya Mum kaç saat yanar?', additional_kwargs: {}, response_metadata: {} }),
    lc('AIMessage', {
      content: [],
      tool_calls: [{ name: 'Products', args: { input: 'Amber' }, id: 'call_1' }],
      additional_kwargs: {},
      response_metadata: {},
    }),
    lc('ToolMessage', {
      content: '[{"row_number":3,"product_id":"mum","stock":12,"price":350}]',
      tool_call_id: 'call_1',
      additional_kwargs: {},
      response_metadata: {},
    }),
    lc('AIMessage', { content: 'Amber Soya Mum için doğrulanmış bir yanma süresi bulunmuyor.', additional_kwargs: {} }),
    lc('SystemMessage', { content: 'Sen AtölyeKart asistanısın.' }),
    lc('HumanMessage', { content: '   ' }),
    lc('AIMessage', { content: [{ type: 'text', text: 'Başka bir sorunuz var mı?' }] }),
  ],
}

test('geçmişte yalnızca boş olmayan ziyaretçi ve asistan metinleri, sırası korunarak gösterilir', () => {
  assert.deepEqual(parseHistory(N8N_HISTORY), [
    { role: 'user', text: 'Adım Deniz. Amber Soya Mum kaç saat yanar?' },
    { role: 'bot', text: 'Amber Soya Mum için doğrulanmış bir yanma süresi bulunmuyor.' },
    { role: 'bot', text: 'Başka bir sorunuz var mı?' },
  ])
  // Araç sonucu (Sheets satırı) hiçbir biçimde pencereye taşınmaz.
  assert.ok(!JSON.stringify(parseHistory(N8N_HISTORY)).includes('row_number'))
})

test('Redis saklama biçimi ({ type, data }) de okunur; araç mesajı atlanır', () => {
  assert.deepEqual(
    parseHistory([
      { type: 'human', data: { content: 'Merhaba' } },
      { type: 'tool', data: { content: '{"stock":3}' } },
      { type: 'ai', data: { content: '' } },
      { type: 'ai', data: { content: 'Merhaba, nasıl yardımcı olabilirim?' } },
    ]),
    [
      { role: 'user', text: 'Merhaba' },
      { role: 'bot', text: 'Merhaba, nasıl yardımcı olabilirim?' },
    ],
  )
})

test('boş, bozuk ya da beklenmeyen geçmiş yanıtı boş liste döner', () => {
  for (const raw of [{ data: [] }, {}, null, '', 'not json', '{"data":"x"}', [null, 1, 'x', {}]]) {
    assert.deepEqual(parseHistory(raw), [])
  }
})

test('geçmiş en fazla son MAX_HISTORY_MESSAGES mesajla sınırlanır', () => {
  const many = Array.from({ length: MAX_HISTORY_MESSAGES + 10 }, (_, i) => lc('HumanMessage', { content: `m${i}` }))
  const parsed = parseHistory({ data: many })
  assert.equal(parsed.length, MAX_HISTORY_MESSAGES)
  assert.equal(parsed[0].text, 'm10')
  assert.equal(parsed.at(-1).text, `m${MAX_HISTORY_MESSAGES + 9}`)
})

test('loadChatHistory doğru gövdeyi gönderir ve filtrelenmiş mesajları döner', async () => {
  const fetchImpl = fakeFetch(() => reply(N8N_HISTORY))
  const history = await loadChatHistory({ url: URL_OK, sessionId: 's-9', fetchImpl })
  assert.equal(history.length, 3)
  assert.deepEqual(JSON.parse(fetchImpl.calls[0].init.body), { action: 'loadPreviousSession', sessionId: 's-9' })
  assert.equal(fetchImpl.calls[0].init.method, 'POST')
})

test('loadChatHistory adres yoksa istek yapmaz, sunucu hatasında ChatError verir', async () => {
  const unused = fakeFetch(() => reply(N8N_HISTORY))
  await assert.rejects(loadChatHistory({ url: '', sessionId: 's', fetchImpl: unused }), { kind: 'config' })
  assert.equal(unused.calls.length, 0)
  await assert.rejects(loadChatHistory({ url: URL_OK, sessionId: 's', fetchImpl: async () => reply('Error', 500) }), {
    kind: 'server',
  })
})

// --- /api/chat proxy'si ile çalışma ---

test('aynı alan adındaki /api/chat yolu kabul edilir; // ile başlayan ya da ters bölülü yol reddedilir', () => {
  assert.equal(resolveChatUrl(CHAT_PATH), '/api/chat')
  for (const bad of ['//kotu-site.example/chat', '/\\kotu-site.example', '  ']) assert.equal(resolveChatUrl(bad), '')
})

test('proxy 429 dönerse "rate", 503 dönerse "config", diğer hatalarda "server" hatası verilir', async () => {
  for (const [status, kind] of [[429, 'rate'], [503, 'config'], [502, 'server'], [504, 'server'], [400, 'server']]) {
    await assert.rejects(
      sendChatMessage({ url: CHAT_PATH, sessionId: 's-1234567', message: 'm', fetchImpl: async () => reply({ ok: false }, status) }),
      (error) => {
        assert.equal(error.kind, kind)
        assert.equal(error.message, ERROR_TEXTS[kind])
        return true
      },
    )
  }
})

test('istek göreli /api/chat adresine gider ve proxy\'nin geçmiş biçimini okur', async () => {
  const fetchImpl = fakeFetch(() => reply({ data: [{ type: 'human', data: { content: 'Merhaba' } }, { type: 'ai', data: { content: 'Hoş geldiniz' } }] }))
  const history = await loadChatHistory({ url: CHAT_PATH, sessionId: 's-1234567', fetchImpl })
  assert.equal(fetchImpl.calls[0].url, '/api/chat')
  assert.deepEqual(history, [
    { role: 'user', text: 'Merhaba' },
    { role: 'bot', text: 'Hoş geldiniz' },
  ])
})
