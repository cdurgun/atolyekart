// POST /api/chat — AtölyeKart Asistan için n8n Chat Trigger proxy'si.
//
// Tarayıcı n8n'e doğrudan bağlanmaz; aynı alan adındaki bu uç noktaya n8n'in kendi protokolüyle yazar:
//   { action: 'sendMessage', sessionId, chatInput }  →  { output }
//   { action: 'loadPreviousSession', sessionId }     →  { data: [{ type: 'human' | 'ai', data: { content } }] }
// Sunucu gövdeyi doğrular, yalnızca bu alanlarla yeniden kurar ve n8n'e Basic Auth ile iletir.
// Basic Auth bilgileri yalnızca sunucu ortam değişkenlerindedir (N8N_CHAT_URL, N8N_CHAT_USER,
// N8N_CHAT_PASSWORD); hiçbiri VITE_ önekli değildir, tarayıcıya ve yanıtlara girmez.
//
// Geçmiş yanıtı sunucuda süzülür: araç çağrıları, araç sonuçları (ör. Google Sheets satırları) ve sistem
// mesajları tarayıcıya hiç gönderilmez. Streaming yoktur: n8n Chat Trigger (webhook modu) düz JSON döner.
//
// Hedef seçimi (N8N_CHAT_BACKEND):
//   tanımsız ya da 'final' dışında bir değer → canlı RAG Chat Trigger, N8N_CHAT_* (bugünkü davranış, değişmez)
//   'final' → final asistan webhook'u, N8N_FINAL_URL / N8N_FINAL_USER / N8N_FINAL_PASSWORD
// Final asistanın sözleşmesi: { sessionId, chatInput } → 200 { ok: true, output } (400/503 → proxy 502).
// Final asistanda geçmiş yükleme uç noktası yoktur: loadPreviousSession n8n'e gönderilmez, { data: [] } döner;
// konuşma bağlamı n8n tarafındaki hafızada sürer, pencere yalnızca karşılamayla açılır.
// Final değişkenleri eksik ya da geçersizse 503 döner; RAG'e sessizce geri dönülmez.
import { MAX_MESSAGE_LENGTH, extractReply, parseHistory, SESSION_ID_PATTERN } from '../../src/features/luna-atelier-preview/chat/chatClient.js'
import { clientIp, json, readJsonObject } from '../lib/http.js'
import { createRateLimiter } from '../lib/rate-limit.js'

export const MAX_CHAT_BODY_BYTES = 4_000
export const SEND_TIMEOUT_MS = 85_000
export const HISTORY_TIMEOUT_MS = 15_000
const MAX_UPSTREAM_BYTES = 500_000

// IP başına. Bellek içidir ve Vercel'de instance başınadır (bkz. lib/rate-limit.js); canlıda ortak bir
// sınır için Vercel Firewall kuralı önerilir.
export const chatLimits = {
  all: createRateLimiter({ limit: 20, windowMs: 60_000 }), // /api/chat'e gelen her istek (geçersizler dahil)
  sendMinute: createRateLimiter({ limit: 6, windowMs: 60_000 }), // sendMessage: dakikada 6
  sendHour: createRateLimiter({ limit: 60, windowMs: 3_600_000 }), // sendMessage: saatte 60
}

const ERRORS = {
  unavailable: [503, 'chat_unavailable', 'Asistan şu anda kullanılamıyor.'],
  forbidden: [403, 'forbidden_origin', 'Bu istek kabul edilmiyor.'],
  mediaType: [415, 'unsupported_media_type', 'İstek JSON olmalıdır.'],
  rateLimited: [429, 'rate_limited', 'Çok sık mesaj gönderildi. Lütfen biraz bekleyip yeniden deneyin.'],
  invalidBody: [400, 'invalid_body', 'Geçersiz istek.'],
  upstream: [502, 'upstream_error', 'Asistan şu anda yanıt veremiyor.'],
  timeout: [504, 'upstream_timeout', 'Asistan zamanında yanıt veremedi.'],
}

function fail(kind, headers) {
  const [status, error, message] = ERRORS[kind]
  return json(status, { ok: false, error, message }, headers)
}

// Yalnızca 'final' değeri final asistanı seçer; diğer her durumda canlı RAG kullanılır.
export function chatBackend(env = process.env) {
  return env.N8N_CHAT_BACKEND?.trim() === 'final' ? 'final' : 'rag'
}

const ENV_PREFIX = { rag: 'N8N_CHAT', final: 'N8N_FINAL' }

// Seçili hedefin değişkenleri okunur. Yalnızca https (yerelde http://localhost) adresi ve kullanıcı adı +
// parola birlikte varsa yapılandırılmış sayılır.
export function chatConfig(env = process.env) {
  const prefix = ENV_PREFIX[chatBackend(env)]
  const url = env[`${prefix}_URL`]?.trim()
  const user = env[`${prefix}_USER`]
  const password = env[`${prefix}_PASSWORD`]
  if (!url || !user || !password) return null
  try {
    const { protocol, hostname } = new URL(url)
    const local = hostname === 'localhost' || hostname === '127.0.0.1'
    if (protocol !== 'https:' && !(protocol === 'http:' && local)) return null
  } catch {
    return null
  }
  return { url, authorization: `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}` }
}

// Tarayıcıdan gelen başka origin istekleri reddedilir. Origin başlığı yoksa (curl, sunucu) bu kontrol
// geçer; o istemcileri rate limit sınırlar. Sec-Fetch-Site eski tarayıcılarda yoktur, varsa kullanılır.
function sameOrigin(request) {
  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') return false
  const origin = request.headers.get('origin')
  if (!origin) return true
  try {
    return new URL(origin).host === new URL(request.url).host
  } catch {
    return false
  }
}

// Gövdeyi doğrular ve n8n'e gidecek gövdeyi yalnızca izin verilen alanlarla yeniden kurar.
export function validateChatBody(body) {
  if (!body || typeof body.sessionId !== 'string' || !SESSION_ID_PATTERN.test(body.sessionId)) return null
  if (body.action === 'loadPreviousSession') return { action: 'loadPreviousSession', sessionId: body.sessionId }
  if (body.action !== 'sendMessage' || typeof body.chatInput !== 'string') return null
  const chatInput = body.chatInput.trim()
  if (!chatInput || chatInput.length > MAX_MESSAGE_LENGTH) return null
  return { action: 'sendMessage', sessionId: body.sessionId, chatInput }
}

// n8n'e giden gövde. Final asistan yalnızca sessionId ve chatInput okur; action gönderilmez.
export function upstreamBody(backend, payload) {
  if (backend === 'final') return { sessionId: payload.sessionId, chatInput: payload.chatInput }
  return payload
}

function limited(result) {
  return result.allowed ? null : fail('rateLimited', { 'Retry-After': String(result.retryAfter) })
}

async function callN8n(config, backend, payload) {
  const timeoutMs = payload.action === 'sendMessage' ? SEND_TIMEOUT_MS : HISTORY_TIMEOUT_MS
  let response
  try {
    response = await fetch(config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: config.authorization },
      body: JSON.stringify(upstreamBody(backend, payload)),
      redirect: 'error',
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError'
    console.error('[chat] n8n isteği başarısız:', timedOut ? 'zaman aşımı' : error?.name ?? 'bilinmeyen hata')
    return { error: timedOut ? 'timeout' : 'upstream' }
  }

  if (!response.ok) {
    // 401/403: sunucudaki Basic Auth bilgisi n8n'dekiyle uyuşmuyor. 404: workflow yayında değil.
    const hint = response.status === 401 || response.status === 403 ? ' (kimlik bilgisi uyuşmuyor)' : response.status === 404 ? ' (workflow yayında değil)' : ''
    console.error(`[chat] n8n HTTP ${response.status}${hint}`)
    return { error: 'upstream' }
  }

  const text = await response.text()
  if (Buffer.byteLength(text) > MAX_UPSTREAM_BYTES) {
    console.error('[chat] n8n yanıtı beklenenden büyük')
    return { error: 'upstream' }
  }
  return { text }
}

export default {
  methods: ['POST'],
  ownRateLimit: true, // router'ın form sayacını kullanmaz; sınırlar aşağıda.
  async handle(request) {
    if (!sameOrigin(request)) return fail('forbidden')

    const ip = clientIp(request)
    const tooMany = limited(chatLimits.all.check(ip))
    if (tooMany) return tooMany

    // application/json zorunlu: başka sitelerdeki tarayıcılar bu isteği CORS ön kontrolü olmadan gönderemez.
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return fail('mediaType')

    const payload = validateChatBody(await readJsonObject(request, MAX_CHAT_BODY_BYTES))
    if (!payload) return fail('invalidBody')

    if (payload.action === 'sendMessage') {
      const blocked = limited(chatLimits.sendMinute.check(ip)) ?? limited(chatLimits.sendHour.check(ip))
      if (blocked) return blocked
    }

    const backend = chatBackend()
    const config = chatConfig()
    if (!config) {
      const prefix = ENV_PREFIX[backend]
      console.error(`[chat] ${prefix}_URL / ${prefix}_USER / ${prefix}_PASSWORD eksik ya da geçersiz`)
      return fail('unavailable')
    }

    // Final asistanda geçmiş uç noktası yok: n8n'e gidilmez, pencere karşılamayla açılır.
    if (backend === 'final' && payload.action === 'loadPreviousSession') return json(200, { data: [] })

    const result = await callN8n(config, backend, payload)
    if (result.error) return fail(result.error)

    if (payload.action === 'loadPreviousSession') {
      const data = parseHistory(result.text).map(({ role, text }) => ({ type: role === 'user' ? 'human' : 'ai', data: { content: text } }))
      return json(200, { data })
    }

    const output = extractReply(result.text)
    if (!output) {
      console.error('[chat] n8n yanıtında metin yok')
      return fail('upstream')
    }
    return json(200, { output })
  },
}
