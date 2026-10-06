// API yönlendiricisi: yol → rota. Yöntem kontrolü, rate limit ve beklenmeyen hata yakalama burada yapılır.
// Web standardı imza (Request → Response): Vercel'de, Vite geliştirme sunucusunda ve testlerde aynı kod çalışır.
import { clientIp, json } from './lib/http.js'
import { rateLimit } from './lib/rate-limit.js'
import adminOrders from './routes/admin-orders.js'
import order from './routes/order.js'
import stockRequest from './routes/stock-request.js'

const routes = {
  '/api/order': order,
  '/api/stock-request': stockRequest,
  '/api/admin/orders': adminOrders,
}

export async function handleApi(request) {
  try {
    const route = routes[new URL(request.url).pathname.replace(/\/$/, '')]
    if (!route) return json(404, { ok: false, error: 'not_found', message: 'Bulunamadı.' })

    const limit = rateLimit(clientIp(request))
    if (!limit.allowed) {
      return json(
        429,
        { ok: false, error: 'rate_limited', message: 'Çok fazla istek gönderildi. Lütfen biraz sonra yeniden deneyin.' },
        { 'Retry-After': String(limit.retryAfter) },
      )
    }

    if (!route.methods.includes(request.method)) {
      return json(405, { ok: false, error: 'method_not_allowed', message: 'Bu yöntem desteklenmiyor.' }, { Allow: route.methods.join(', ') })
    }

    return await route.handle(request)
  } catch (error) {
    // Ayrıntı yalnızca sunucu günlüğüne yazılır; yanıta hata metni ya da stack trace girmez.
    console.error('[api]', error)
    return json(500, { ok: false, error: 'internal', message: 'Beklenmeyen bir hata oluştu. Lütfen yeniden deneyin.' })
  }
}
