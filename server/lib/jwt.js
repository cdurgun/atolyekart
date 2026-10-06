// HS256 JWT: bağımlılık yok, yalnızca node:crypto. Yalnızca admin uç noktası kullanır; ziyaretçi formları JWT istemez.
import { createHmac, timingSafeEqual } from 'node:crypto'

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')

function signature(data, secret) {
  return createHmac('sha256', secret).update(data).digest()
}

export function signJwt(payload, secret) {
  const data = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}`
  return `${data}.${signature(data, secret).toString('base64url')}`
}

// Geçerliyse { payload }, değilse { error } döner. Algoritma başlıktan seçilmez: yalnızca HS256 kabul edilir
// ("alg: none" ve algoritma karıştırma saldırılarına karşı). exp zorunludur.
export function verifyJwt(token, secret, now = Date.now()) {
  const parts = typeof token === 'string' ? token.split('.') : []
  if (parts.length !== 3) return { error: 'malformed' }

  let header, payload
  try {
    header = JSON.parse(Buffer.from(parts[0], 'base64url').toString())
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
  } catch {
    return { error: 'malformed' }
  }
  if (header?.alg !== 'HS256' || !payload || typeof payload !== 'object') return { error: 'malformed' }

  const expected = signature(`${parts[0]}.${parts[1]}`, secret)
  const given = Buffer.from(parts[2], 'base64url')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return { error: 'bad_signature' }

  const seconds = Math.floor(now / 1000)
  if (typeof payload.exp !== 'number' || payload.exp <= seconds) return { error: 'expired' }
  if (typeof payload.nbf === 'number' && payload.nbf > seconds) return { error: 'not_yet_valid' }
  return { payload }
}
