// POST /api/stock-request — herkese açık stok bildirimi formu. JWT istemez; yalnızca stokta olmayan ürün için kabul edilir.
import { findProduct } from '../lib/catalog.js'
import { json, readJsonObject } from '../lib/http.js'
import { validateBody } from '../lib/validate.js'
import { buildEvent, deliverEvent } from '../lib/webhook.js'

export default {
  methods: ['POST'],
  async handle(request) {
    const body = await readJsonObject(request)
    if (!body) return json(400, { ok: false, error: 'invalid_body', message: 'Geçersiz istek.' })

    const { values, errors } = validateBody('stock-alert', body)
    if (Object.keys(errors).length) {
      return json(400, { ok: false, error: 'validation', message: 'Lütfen işaretli alanları düzeltin.', errors })
    }

    const product = findProduct(values.product)
    if (product.inStock) {
      return json(409, { ok: false, error: 'in_stock', message: 'Bu ürün stokta. Sipariş verebilirsiniz.' })
    }

    const { ok } = await deliverEvent(buildEvent('stock-alert', values, product))
    if (!ok) return json(502, { ok: false, error: 'delivery_failed', message: 'Talebiniz şu anda iletilemedi. Lütfen yeniden deneyin.' })

    return json(200, { ok: true })
  },
}
