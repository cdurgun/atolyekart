// AtölyeKart Asistan — sohbet istemcisi (arayüzden bağımsız, Node testlerinde ve sunucuda da çalışır).
//
// Tarayıcı aynı alan adındaki /api/chat proxy'sine (server/routes/chat.js) yazar; proxy isteği doğrulayıp
// n8n Chat Trigger'a sunucu tarafındaki Basic Auth ile iletir. n8n adresi ve kimlik bilgisi tarayıcıya girmez.
// Protokol n8n'in resmî @n8n/chat paketininkiyle aynıdır (paket Vue getirdiği için kullanılmadı):
//   POST /api/chat  { action: 'sendMessage', sessionId, chatInput }  →  { output: '...' }
//   POST /api/chat  { action: 'loadPreviousSession', sessionId }     →  { data: [mesaj, ...] }
// Aynı sessionId, n8n'deki sohbet belleğinin (Redis Chat Memory) konuşmayı tanımasını sağlar.
//
// Geçmiş, eskiden yeniye gelir. Proxy araç çağrılarını ve araç sonuçlarını (ör. Google Sheets satırları)
// zaten süzer; parseHistory yine de yalnızca boş olmayan ziyaretçi (human) ve asistan (ai) metinlerini kabul eder.
//
// Oturum kimliği tarayıcının localStorage'ında (SESSION_STORAGE_KEY) tutulur; böylece sayfa yenilense
// ya da ziyaretçi sonra geri gelse de aynı konuşma sürer. localStorage kapalıysa kimlik yalnızca sayfa
// açıkken bellekte yaşar.
// Sunucu tarafında iki ayrı kayıt vardır: (1) Redis sohbet hafızası, TTL'i seçili hedefe göre değişir
// (sunucudaki N8N_CHAT_BACKEND; ayrıntı server/routes/chat.js ve n8n workflow'u); (2) n8n çalışma
// kayıtları, saklanmaları n8n'in kendi ayarlarına bağlıdır ve Redis TTL'iyle silinmez.

export const CHAT_PATH = '/api/chat'

export const WELCOME_TEXT =
  "Merhaba! Ben AtölyeKart'ın dijital asistanıyım. Ürünlerimiz hakkında size yardımcı olabilirim."

export const ERROR_TEXTS = {
  config: 'Asistan şu anda kullanılamıyor. Sorularınız için lütfen daha sonra yeniden deneyin.',
  network: 'Asistana bağlanılamadı. İnternet bağlantınızı kontrol edip yeniden deneyin.',
  timeout:
    'Yanıt beklenenden uzun sürdü. Asistan isteğinizi hâlâ hazırlıyor olabilir; mesajınız kutuda duruyor, birazdan yeniden gönderebilirsiniz.',
  server: 'Asistan şu anda yanıt veremiyor. Lütfen biraz sonra yeniden deneyin.',
  rate: 'Çok sık mesaj gönderdiniz. Lütfen biraz bekleyip yeniden deneyin; mesajınız kutuda duruyor.',
}

// İsteğin tamamı için tek son tarih: bağlantı + yanıt başlıkları + gövdenin okunması.
// Geçici olarak 90 sn: n8n execution'ı şu an ~60 sn sürüyor. Süre kısalınca düşürülmeli.
// Zaman aşımında istek tarayıcıda iptal edilir ama n8n tarafında çalışmaya devam edebilir;
// bu yüzden otomatik yeniden gönderim yapılmaz, karar ziyaretçinindir.
export const TIMEOUT_MS = 90_000
export const MAX_MESSAGE_LENGTH = 1000

export class ChatError extends Error {
  constructor(kind, detail) {
    super(ERROR_TEXTS[kind] ?? ERROR_TEXTS.server)
    this.kind = kind
    this.detail = detail
  }
}

export function createSessionId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export const SESSION_STORAGE_KEY = 'atolyekart-chat-session'
export const HISTORY_TIMEOUT_MS = 15_000
export const MAX_HISTORY_MESSAGES = 50

// Yalnızca bizim ürettiğimiz biçimdeki kimlik kabul edilir; elle değiştirilmiş ya da bozuk değer yok sayılır.
// Sunucu (/api/chat) aynı kuralı uygular.
export const SESSION_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null // Bazı gizli pencerelerde localStorage'a erişim bile hata fırlatır.
  }
}

// Daha önce kaydedilmiş geçerli kimliği döner; yoksa null.
export function readStoredSessionId(storage = defaultStorage()) {
  try {
    const value = storage?.getItem(SESSION_STORAGE_KEY)
    return typeof value === 'string' && SESSION_ID_PATTERN.test(value) ? value : null
  } catch {
    return null
  }
}

// Kayıtlı kimliği döner; yoksa yenisini üretip kaydetmeyi dener. Kayıt başarısız olsa da kimlik döner.
export function getOrCreateSessionId(storage = defaultStorage()) {
  const stored = readStoredSessionId(storage)
  if (stored) return stored
  const id = createSessionId()
  try {
    storage?.setItem(SESSION_STORAGE_KEY, id)
  } catch {
    // Kota dolu ya da depolama kapalı: kimlik bu sayfa açıkken bellekte kullanılır.
  }
  return id
}

// "Yeni sohbet": kayıtlı kimliği yalnızca bu tarayıcıdan siler ve yeni bir kimlik üretip kaydeder.
// Ağ isteği yapmaz; sunucudaki hiçbir kaydı silmez. Eski konuşma Redis hafızasında TTL dolana kadar,
// n8n çalışma kayıtlarında ise n8n'in saklama ayarlarına göre kalır (bkz. dosya başındaki not).
export const NEW_CHAT_NOTICE =
  'Yeni sohbet başladı. Önceki konuşma bu cihazdaki sohbet görünümünden kaldırıldı. Sunucuda işlenmiş kayıtlar ayrıca tutulabilir.'

export function startNewSession(storage = defaultStorage()) {
  const previous = readStoredSessionId(storage)
  try {
    storage?.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // Depolama kapalı: aşağıda yeni kimlik yine üretilir.
  }
  let id = createSessionId()
  while (id === previous) id = createSessionId()
  try {
    storage?.setItem(SESSION_STORAGE_KEY, id)
  } catch {
    // Kayıt başarısız: kimlik bu sayfa açıkken bellekte kullanılır.
  }
  return id
}

// Aynı alan adındaki yol (/api/chat) ya da http(s) adresi kabul edilir; boş ya da bozuk değer
// "yapılandırılmamış" sayılır. "//" ile başlayan yol başka bir alan adına gider; reddedilir.
export function resolveChatUrl(value) {
  const url = typeof value === 'string' ? value.trim() : ''
  if (!url) return ''
  if (url.startsWith('/')) return url.startsWith('//') || url.includes('\\') ? '' : url
  try {
    const { protocol } = new URL(url)
    return protocol === 'https:' || protocol === 'http:' ? url : ''
  } catch {
    return ''
  }
}

// Chat Trigger yanıtı, workflow'un "Respond" ayarına göre birkaç biçimde gelebilir:
// { output } (varsayılan), { text } / { message }, bunların tek öğeli dizisi ya da akış (streaming)
// açıksa satır satır JSON ({ type: 'item', content }). Hiçbiri yoksa boş metin döner.
export function extractReply(raw) {
  const text = typeof raw === 'string' ? raw.trim() : ''
  if (!text) return ''

  let data
  try {
    data = JSON.parse(text)
  } catch {
    return fromStream(text)
  }
  return fromJson(data)
}

function fromJson(data) {
  if (Array.isArray(data)) return data.length ? fromJson(data[0]) : ''
  if (typeof data === 'string') return data.trim()
  if (data && typeof data === 'object') {
    for (const key of ['output', 'text', 'message', 'response']) {
      if (typeof data[key] === 'string' && data[key].trim()) return data[key].trim()
    }
    if (data.type === 'item' && typeof data.content === 'string') return data.content.trim()
  }
  return ''
}

function fromStream(text) {
  let reply = ''
  for (const line of text.split('\n')) {
    try {
      const chunk = JSON.parse(line)
      if (chunk?.type === 'item' && typeof chunk.content === 'string') reply += chunk.content
    } catch {
      // JSON olmayan satır yok sayılır.
    }
  }
  return reply.trim()
}

// Geçmiş yanıtındaki tek bir mesajı { role, text } biçimine çevirir; gösterilmeyecekse null döner.
// İki biçim desteklenir: LangChain toJSON() ({ id: [..., 'HumanMessage'], kwargs: { content } })
// ve Redis'te saklanan biçim ({ type: 'human', data: { content } }).
function toChatMessage(item) {
  if (!item || typeof item !== 'object') return null
  const className = Array.isArray(item.id) ? item.id[item.id.length - 1] : ''
  const fields = item.kwargs ?? item.data ?? item
  let role = null
  if (className === 'HumanMessage' || item.type === 'human') role = 'user'
  else if (className === 'AIMessage' || className === 'AIMessageChunk' || item.type === 'ai') role = 'bot'
  if (!role) return null // ToolMessage, SystemMessage ve bilinmeyen türler gösterilmez.

  const text = contentToText(fields?.content)
  return text ? { role, text } : null // Araç çağrısı yapan AI mesajının içeriği boştur; atlanır.
}

function contentToText(content) {
  if (typeof content === 'string') return content.trim()
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === 'string' ? part : part?.type === 'text' && typeof part.text === 'string' ? part.text : ''))
      .join('')
      .trim()
  }
  return ''
}

// loadPreviousSession yanıtını pencere mesajlarına çevirir: yalnızca boş olmayan human/ai metinleri,
// eskiden yeniye, en fazla son MAX_HISTORY_MESSAGES tanesi.
export function parseHistory(raw) {
  let data = raw
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw)
    } catch {
      return []
    }
  }
  const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
  const messages = []
  for (const item of list) {
    const message = toChatMessage(item)
    if (message) messages.push(message)
  }
  return messages.slice(-MAX_HISTORY_MESSAGES)
}

// Chat Trigger'a tek POST: gövde metnini döner. Bağlantı, yanıt başlıkları ve gövdenin okunması için
// tek son tarih vardır. Hata durumunda ChatError fırlatır.
async function postToChat({ url, body, fetchImpl, timeoutMs }) {
  // Zamanlayıcı yanıt tamamen okunana kadar çalışır; finally'de temizlenir.
  // Süre dolunca istek iptal edilir ve "deadline" reddedilir. Hem fetch hem gövde okuması bununla
  // yarıştırılır; böylece iptal sinyalini dinlemeyen bir gövde okuması da sonsuza dek bekletemez.
  const controller = new AbortController()
  let timer
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort()
      reject(new ChatError('timeout', `${timeoutMs} ms içinde tamamlanmadı.`))
    }, timeoutMs)
  })
  deadline.catch(() => {}) // Yarış dışında kalırsa işlenmemiş ret uyarısı vermesin.

  // İptalden kaynaklanan hata zaman aşımıdır; diğerleri bağlantı hatası.
  const failure = (error) => {
    throw new ChatError(controller.signal.aborted ? 'timeout' : 'network', error)
  }

  try {
    const request = Promise.resolve().then(() =>
      fetchImpl(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      }),
    )
    const response = await Promise.race([request.catch(failure), deadline])

    if (!response.ok) {
      // 429: proxy'nin rate limiti. 503: sunucuda sohbet yapılandırılmamış. Diğerleri genel sunucu hatası.
      const kind = response.status === 429 ? 'rate' : response.status === 503 ? 'config' : 'server'
      throw new ChatError(kind, `HTTP ${response.status}`)
    }

    return await Promise.race([Promise.resolve().then(() => response.text()).catch(failure), deadline])
  } finally {
    clearTimeout(timer)
  }
}

function requireChatUrl(url) {
  const chatUrl = resolveChatUrl(url)
  if (!chatUrl) throw new ChatError('config', 'Sohbet adresi tanımlı değil ya da geçerli değil.')
  return chatUrl
}

// Mesajı gönderir, asistanın yanıt metnini döner. Hata durumunda ChatError fırlatır;
// mesajı (err.message) kullanıcıya gösterilebilir, ayrıntı (err.detail) yalnızca konsol içindir.
export async function sendChatMessage({ url, sessionId, message, fetchImpl = globalThis.fetch, timeoutMs = TIMEOUT_MS }) {
  const chatUrl = requireChatUrl(url)
  const body = await postToChat({
    url: chatUrl,
    body: { action: 'sendMessage', sessionId, chatInput: message },
    fetchImpl,
    timeoutMs,
  })
  const reply = extractReply(body)
  if (!reply) throw new ChatError('server', 'Yanıtta metin bulunamadı.')
  return reply
}

// Oturumun önceki mesajlarını { role: 'user' | 'bot', text } dizisi olarak döner (boş olabilir).
// Hata durumunda ChatError fırlatır; pencere bu hatayı ziyaretçiye göstermez, yalnızca karşılama ile açılır.
export async function loadChatHistory({ url, sessionId, fetchImpl = globalThis.fetch, timeoutMs = HISTORY_TIMEOUT_MS }) {
  const chatUrl = requireChatUrl(url)
  const body = await postToChat({ url: chatUrl, body: { action: 'loadPreviousSession', sessionId }, fetchImpl, timeoutMs })
  return parseHistory(body)
}
