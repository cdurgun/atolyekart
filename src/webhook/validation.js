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

// Payload'a metin değil sayı olarak girer.
function validateQuantity(raw) {
  const value = raw.trim()
  if (!value) return { error: 'Adedi yazın.' }
  if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 99) {
    return { error: 'Adet 1 ile 99 arasında bir tam sayı olmalı.' }
  }
  return { value: Number(value) }
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

const validators = {
  name: validateName,
  product: validateProduct,
  quantity: validateQuantity,
  phone: validatePhone,
  email: validateEmail,
}

// fields: formdaki sırayla alan adları. optional: boş bırakılabilen alanlar; boşsa değeri null olur.
export function validateRequest(raw, { fields, optional }, slugs) {
  const values = {}
  const errors = {}
  for (const field of fields) {
    const result = optional.includes(field) && !raw[field].trim() ? { value: null } : validators[field](raw[field], slugs)
    if (result.error) errors[field] = result.error
    else values[field] = result.value
  }
  return { values, errors }
}
