import assert from 'node:assert/strict'
import { test } from 'node:test'
import { addLine, MAX_QTY } from './cart.js'

const kupa = { id: 'luna-seramik-kupa', name: 'Luna Seramik Kupa', category: 'Seramik', price: 420, image: '/images/luna-seramik-kupa.jpg' }
const mum = { id: 'amber-soya-mum', name: 'Amber Soya Mum', category: 'Doğal Mumlar', price: 350, image: '/images/amber-soya-mum.jpg' }

test('boş sepete eklenen ürün tek satır olur', () => {
  const cart = addLine([], kupa)
  assert.deepEqual(cart, [
    { id: 'luna-seramik-kupa', name: 'Luna Seramik Kupa', label: 'Seramik', price: 420, qty: 1, image: '/images/luna-seramik-kupa.jpg' },
  ])
})

test('aynı ürün yeniden eklenince yeni satır açılmaz, adet artar', () => {
  const cart = addLine(addLine([], kupa), kupa, 2)
  assert.equal(cart.length, 1)
  assert.equal(cart[0].qty, 3)
})

test('farklı ürünler ayrı satırlar olarak sırayla eklenir', () => {
  const cart = addLine(addLine(addLine([], kupa), mum), kupa)
  assert.deepEqual(cart.map((line) => [line.id, line.qty]), [['luna-seramik-kupa', 2], ['amber-soya-mum', 1]])
})

test('adet üst sınırı aşılmaz (yeni satırda ve eklemede)', () => {
  assert.equal(addLine([], kupa, 20)[0].qty, MAX_QTY)
  assert.equal(addLine(addLine([], kupa, 11), kupa, 5)[0].qty, MAX_QTY)
})

test('mevcut dizi değiştirilmez (React state için yeni dizi döner)', () => {
  const before = addLine([], kupa)
  const snapshot = structuredClone(before)
  const after = addLine(before, kupa)
  assert.deepEqual(before, snapshot)
  assert.notEqual(after, before)
})
