import assert from 'node:assert/strict'
import test from 'node:test'
import { validateRequest } from './validation.js'

const kind = { fields: ['email'], optional: [] }
const email = (raw) => validateRequest({ email: raw }, kind, [])

test('geçerli e-posta küçük harfe çevrilir', () => {
  assert.equal(email('  Ad.Soyad@Ornek.COM ').values.email, 'ad.soyad@ornek.com')
})

test('Türkçe klavyede Caps Lock ile yazılan İ, birleşik nokta bırakmadan i olur', () => {
  const { values } = email('İNFO@ORNEK.COM')
  assert.equal(values.email, 'info@ornek.com')
  assert.equal(values.email.length, 14)
})

test('bozuk adresler reddedilir', () => {
  for (const raw of ['a@b..com', 'a..b@ornek.com', '.a@ornek.com', 'çağrı@örnek.com', 'ad@ornek', 'ad soyad@ornek.com', 'ad@-ornek.com', 'ad@ornek.c']) {
    assert.ok(email(raw).errors.email, raw)
  }
})

test('isteğe bağlı alan boşsa null olur', () => {
  const result = validateRequest({ email: '  ' }, { fields: ['email'], optional: ['email'] }, [])
  assert.deepEqual(result, { values: { email: null }, errors: {} })
})
