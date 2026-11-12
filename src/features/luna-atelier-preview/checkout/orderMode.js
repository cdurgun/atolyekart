// Sipariş gönderiminin hangi ortamda gerçek sayılacağını belirler. Saf fonksiyondur; değerleri
// checkout/environment.js verir. Sunucu kodu değişmez.
//
// Neden gerekli: sunucu, WEBHOOK_URL tanımlı değilse olayı yalnızca günlüğe yazar ve yine
// { ok: true } döner (server/lib/webhook.js). Vercel'de bu sırlar yalnızca Production ortamında
// tanımlı olduğu için Preview deploy'larında talep atölyeye ulaşmadan "başarılı" görünür.
// İstemci bu durumu yanıttan ayırt edemez; bu yüzden karar ortama göre, güvenli tarafta verilir.
//
// Modlar:
//   live     — Vercel Production: gerçek sipariş akışı (değişmedi).
//   test     — mock adapter (VITE_API_URL=mock:...) ya da yerel geliştirme: gönderim yapılır ama
//              sonuç gerçek sipariş gibi sunulmaz.
//   preview  — Vercel Preview/Development deploy'u: gönderim kapalı, açık uyarı gösterilir.
//   unknown  — ortam anlaşılamadı (ör. Vercel sistem değişkenleri pakete verilmedi): gönderim kapalı.

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]', '::1']

function isLocalHost(hostname) {
  return LOCAL_HOSTS.includes(hostname) || hostname.endsWith('.localhost') || hostname.endsWith('.test')
}

export function resolveOrderMode({ apiUrl = '', vercelEnv = '', hostname = '' } = {}) {
  if (apiUrl.startsWith('mock:')) return 'test'
  if (vercelEnv === 'production') return 'live'
  if (vercelEnv) return 'preview'
  if (isLocalHost(hostname)) return 'test'
  return 'unknown'
}

export const canSubmit = (mode) => mode === 'live' || mode === 'test'
