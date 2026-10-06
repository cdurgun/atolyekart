// Sunucu tarafı doğrulama. Kurallar istemciyle aynı modülden gelir (src/webhook/validation.js);
// burada ek olarak gövdedeki değerlerin türü denetlenir: istemciye hiçbir konuda güvenilmez.
import { requestKinds } from '../../src/webhook/payload.js'
import { validateRequest } from '../../src/webhook/validation.js'
import { productIds } from './catalog.js'

const SOURCES = ['react', 'cdn', 'mobile']

export function validateBody(kind, body) {
  const { fields, optional } = requestKinds[kind]
  const raw = {}
  const typeErrors = {}
  for (const field of fields) {
    const value = body[field === 'product' ? 'productId' : field]
    if (field === 'consent') raw[field] = value === true
    else if (value === undefined || value === null) raw[field] = ''
    else if (typeof value === 'string') raw[field] = value
    else if (field === 'quantity' && typeof value === 'number') raw[field] = String(value)
    else {
      raw[field] = ''
      typeErrors[field] = 'Geçersiz değer.'
    }
  }

  const { values, errors } = validateRequest(raw, { fields, optional }, productIds)
  Object.assign(errors, typeErrors)
  if (!SOURCES.includes(body.source)) errors.source = 'Geçersiz kaynak.'
  return { values: { ...values, source: body.source }, errors }
}
