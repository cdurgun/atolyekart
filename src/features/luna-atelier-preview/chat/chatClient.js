// AtölyeKart Asistan — n8n Chat Trigger istemcisi (arayüzden bağımsız, Node testlerinde de çalışır).
//
// n8n'in resmî @n8n/chat paketinin konuştuğu protokolün aynısıdır; paket Vue ve n8n tasarım
// sistemini getirdiği için kullanılmadı. Chat Trigger ("Embedded Chat" modu) şu gövdeyi bekler:
//   POST <VITE_N8N_CHAT_URL>  { action: 'sendMessage', sessionId, chatInput }
// ve AI Agent'ın yanıtını { output: '...' } olarak döner. Aynı sessionId, n8n'deki sohbet
// belleğinin (Memory) konuşmayı tanımasını sağlar.
//
// Bu adres gizli değildir: tarayıcı doğrudan çağırdığı için paket içinde herkes görebilir.
// /api sırlarıyla (WEBHOOK_URL, WEBHOOK_SECRET, JWT_SECRET) ilgisi yoktur.

export const WELCOME_TEXT =
  "Merhaba! Ben AtölyeKart'ın dijital asistanıyım. Ürünlerimiz, özellikleri ve stok durumu hakkında size yardımcı olabilirim."

export const ERROR_TEXTS = {
  config: 'Asistan şu anda kullanılamıyor. Sorularınız için lütfen daha sonra yeniden deneyin.',
  network: 'Asistana bağlanılamadı. İnternet bağlantınızı kontrol edip yeniden deneyin.',
  timeout:
    'Yanıt beklenenden uzun sürdü. Asistan isteğinizi hâlâ hazırlıyor olabilir; mesajınız kutuda duruyor, birazdan yeniden gönderebilirsiniz.',
  server: 'Asistan şu anda yanıt veremiyor. Lütfen biraz sonra yeniden deneyin.',
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

// Yalnızca http(s) adresi kabul edilir; boş ya da bozuk değer "yapılandırılmamış" sayılır.
export function resolveChatUrl(value) {
  const url = typeof value === 'string' ? value.trim() : ''
  if (!url) return ''
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

// Mesajı gönderir, asistanın yanıt metnini döner. Hata durumunda ChatError fırlatır;
// mesajı (err.message) kullanıcıya gösterilebilir, ayrıntı (err.detail) yalnızca konsol içindir.
export async function sendChatMessage({ url, sessionId, message, fetchImpl = globalThis.fetch, timeoutMs = TIMEOUT_MS }) {
  const chatUrl = resolveChatUrl(url)
  if (!chatUrl) throw new ChatError('config', 'VITE_N8N_CHAT_URL tanımlı değil ya da geçerli bir http(s) adresi değil.')

  // Zamanlayıcı yanıt tamamen okunup işlenene kadar çalışır; finally'de temizlenir.
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
      fetchImpl(chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ action: 'sendMessage', sessionId, chatInput: message }),
        signal: controller.signal,
      }),
    )
    const response = await Promise.race([request.catch(failure), deadline])

    if (!response.ok) throw new ChatError('server', `HTTP ${response.status}`)

    const body = await Promise.race([Promise.resolve().then(() => response.text()).catch(failure), deadline])
    const reply = extractReply(body)
    if (!reply) throw new ChatError('server', 'Yanıtta metin bulunamadı.')
    return reply
  } finally {
    clearTimeout(timer)
  }
}
