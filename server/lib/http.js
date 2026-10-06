const MAX_BODY_BYTES = 10_000

export function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  })
}

// Vercel X-Forwarded-For başlığını kendisi yazar (istemcinin gönderdiği değer silinir); ilk adres istemcidir.
export function clientIp(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
}

// Gövdeyi JSON nesnesi olarak okur; okunamıyorsa null döner.
export async function readJsonObject(request) {
  const text = await request.text()
  if (text.length > MAX_BODY_BYTES) return null
  try {
    const value = JSON.parse(text)
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null
  } catch {
    return null
  }
}
