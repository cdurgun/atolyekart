// POST /api/order — herkese açık sipariş formu. JWT istemez; doğrulama, açık rıza ve stok kontrolü sunucuda yapılır.
import { findProduct } from '../lib/catalog.js'
import { json, readJsonObject } from '../lib/http.js'
import { recordOrder } from '../lib/orders.js'
import { validateBody } from '../lib/validate.js'
import { buildEvent, deliverEvent } from '../lib/webhook.js'

export default {
  methods: ['POST'],
  async handle(request) {
    const body = await readJsonObject(request)
    if (!body) return json(400, { ok: false, error: 'invalid_body', message: 'Geçersiz istek.' })

    const { values, errors } = validateBody('order', body)
    if (Object.keys(errors).length) {
      return json(400, { ok: false, error: 'validation', message: 'Lütfen işaretli alanları düzeltin.', errors })
    }

    const product = findProduct(values.product)
    if (!product.inStock) {
      return json(409, { ok: false, error: 'out_of_stock', message: 'Bu ürün şu anda stokta yok. Stok bildirimi isteyebilirsiniz.' })
    }

    const event = buildEvent('order', values, product)
    const { ok } = await deliverEvent(event)
    if (!ok) return json(502, { ok: false, error: 'delivery_failed', message: 'Talebiniz şu anda iletilemedi. Lütfen yeniden deneyin.' })

    recordOrder(event)
    return json(200, { ok: true })
  },
}
