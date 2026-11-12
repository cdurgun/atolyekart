import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canSubmit, resolveOrderMode } from './orderMode.js'

test('Vercel Production gerçek sipariş akışını kullanır', () => {
  assert.equal(resolveOrderMode({ vercelEnv: 'production', hostname: 'atolyekart.example' }), 'live')
  assert.equal(canSubmit('live'), true)
})

test('Vercel Preview ve Development deploy\'larında gönderim kapalıdır', () => {
  assert.equal(resolveOrderMode({ vercelEnv: 'preview', hostname: 'atolyekart-git-x.vercel.app' }), 'preview')
  assert.equal(resolveOrderMode({ vercelEnv: 'development', hostname: 'localhost' }), 'preview')
  assert.equal(canSubmit('preview'), false)
})

test('ortam bilinmiyorsa (yerel olmayan adres, Vercel değişkeni yok) gönderim kapalıdır', () => {
  assert.equal(resolveOrderMode({ hostname: 'atolyekart.example' }), 'unknown')
  assert.equal(canSubmit('unknown'), false)
})

test('mock adapter ve yerel geliştirme test modudur; Production\'da bile mock gerçek sayılmaz', () => {
  assert.equal(resolveOrderMode({ apiUrl: 'mock:', vercelEnv: 'production' }), 'test')
  assert.equal(resolveOrderMode({ apiUrl: 'mock:fail', hostname: 'localhost' }), 'test')
  assert.equal(resolveOrderMode({ hostname: 'localhost' }), 'test')
  assert.equal(resolveOrderMode({ hostname: '127.0.0.1' }), 'test')
  assert.equal(canSubmit('test'), true)
})
