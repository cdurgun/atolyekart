// Form doğrulama: ham değerleri alır, temizlenmiş değerleri ve Türkçe hata metinlerini döner.
// cdn/forms.js içindeki karşılığıyla aynı kalmalı.

function validateName(raw) {
  const value = raw.trim().replace(/\s+/g, ' ')
  if (!value) return { error: 'Adınızı yazın.' }
  if (value.length < 2) return { error: 'Adınız en az 2 karakter olmalı.' }
  return { value }
}

function validateProduct(raw, slugs) {
  if (!slugs.includes(raw)) return { error: 'Bir ürün seçin.' }
  return { value: raw }
}

// Türkiye cep numarası; payload'a +905XXXXXXXXX olarak girer.
function validatePhone(raw) {
  if (!raw.trim()) return { error: 'Telefon numaranızı yazın.' }
  const match = /^[\d\s()+-]+$/.test(raw) && raw.replace(/\D/g, '').match(/^(?:90|0)?(5\d{9})$/)
  if (!match) return { error: 'Geçerli bir cep telefonu numarası yazın (ör. 0532 123 45 67).' }
  return { value: `+90${match[1]}` }
}

function validateEmail(raw) {
  const value = raw.trim().toLowerCase()
  if (!value) return { error: 'E-posta adresinizi yazın.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return { error: 'Geçerli bir e-posta adresi yazın (ör. ad@ornek.com).' }
  return { value }
}

// contact: 'phone' ya da 'email'. Alan sırası formdaki sırayla aynıdır.
export function validateRequest(raw, contact, slugs) {
  const results = {
    name: validateName(raw.name),
    product: validateProduct(raw.product, slugs),
    [contact]: contact === 'phone' ? validatePhone(raw[contact]) : validateEmail(raw[contact]),
  }
  const values = {}
  const errors = {}
  for (const [field, result] of Object.entries(results)) {
    if (result.error) errors[field] = result.error
    else values[field] = result.value
  }
  return { values, errors }
}
