// GET /api/admin/orders — korumalı uç nokta: Authorization: Bearer <JWT> ve role: "admin" gerekir.
// 401: token yok, bozuk, imzası yanlış ya da süresi dolmuş. 403: token geçerli ama rol admin değil.
import { json } from '../lib/http.js'
import { verifyJwt } from '../lib/jwt.js'
import { listOrders } from '../lib/orders.js'

const unauthorized = () =>
  json(401, { ok: false, error: 'unauthorized', message: 'Geçerli bir yetki belirteci gerekli.' }, { 'WWW-Authenticate': 'Bearer' })

export default {
  methods: ['GET'],
  async handle(request) {
    const secret = process.env.JWT_SECRET
    if (!secret || secret.length < 32) {
      console.error('[admin] JWT_SECRET tanımlı değil ya da 32 karakterden kısa')
      return json(503, { ok: false, error: 'unavailable', message: 'Hizmet şu anda kullanılamıyor.' })
    }

    const match = /^Bearer ([\w-]+\.[\w-]+\.[\w-]+)$/.exec(request.headers.get('authorization') ?? '')
    if (!match) return unauthorized()

    const { payload, error } = verifyJwt(match[1], secret)
    if (error) return unauthorized()
    if (payload.role !== 'admin') return json(403, { ok: false, error: 'forbidden', message: 'Bu işlem için yetkiniz yok.' })

    return json(200, { ok: true, orders: listOrders() })
  },
}
