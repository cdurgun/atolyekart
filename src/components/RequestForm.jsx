import { useState } from 'react'
import { sendEvent } from '../webhook/adapter.js'
import { buildRequestEvent, productSlug, requestKinds } from '../webhook/payload.js'
import { validateRequest } from '../webhook/validation.js'

const labels = {
  name: 'Adınız',
  product: 'Ürün',
  quantity: 'Adet',
  phone: 'Telefon numaranız',
  email: 'E-posta adresiniz',
}

const inputs = {
  name: { type: 'text', autoComplete: 'name' },
  quantity: { type: 'number', min: 1, max: 99, step: 1 },
  phone: { type: 'tel', autoComplete: 'tel' },
  email: { type: 'email', autoComplete: 'email' },
}

const defaults = { quantity: '1' }

const successTexts = {
  order: 'Sipariş talebiniz alındı. Sizi telefonla arayacağız.',
  'stock-alert': 'Kaydınız alındı. Ürün stoğa girdiğinde e-postayla haber vereceğiz.',
}

const failureText = 'Gönderilemedi. Lütfen yeniden deneyin.'

export default function RequestForm({ kind, title, products }) {
  const { fields, optional } = requestKinds[kind]
  const empty = Object.fromEntries(fields.map((name) => [name, defaults[name] ?? '']))
  const [raw, setRaw] = useState(empty)
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState('')

  function field(name) {
    return {
      id: `${kind}-${name}`,
      name,
      value: raw[name],
      'aria-invalid': errors[name] ? 'true' : undefined,
      'aria-describedby': errors[name] ? `${kind}-${name}-error` : undefined,
      onChange: (event) => {
        setRaw({ ...raw, [name]: event.target.value })
        setErrors({ ...errors, [name]: undefined })
        setStatus('')
      },
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const result = validateRequest(raw, { fields, optional }, products.map(productSlug))
    setErrors(result.errors)
    setStatus('')
    const invalid = Object.keys(result.errors)[0]
    if (invalid) {
      form.elements[invalid].focus()
      return
    }

    const product = products.find((item) => productSlug(item) === result.values.product)
    const payload = buildRequestEvent(kind, result.values, product, 'react')

    setSending(true)
    const { ok } = await sendEvent(payload)
    setSending(false)
    if (ok) setRaw(empty)
    setStatus(ok ? successTexts[kind] : failureText)
  }

  return (
    <form className="request-form" noValidate onSubmit={handleSubmit}>
      <h3>{title}</h3>
      {fields.map((name) => (
        <div className="request-field" key={name}>
          <label htmlFor={`${kind}-${name}`}>
            {labels[name]}
            {optional.includes(name) && ' (isteğe bağlı)'}
          </label>
          {name === 'product' ? (
            <select {...field(name)}>
              <option value="">Ürün seçin</option>
              {products.map((product) => (
                <option key={product.name} value={productSlug(product)}>
                  {product.name}
                </option>
              ))}
            </select>
          ) : (
            <input {...inputs[name]} {...field(name)} />
          )}
          <p className="request-error" id={`${kind}-${name}-error`} hidden={!errors[name]}>
            {errors[name]}
          </p>
        </div>
      ))}
      <button type="submit" disabled={sending}>
        {title}
      </button>
      <p className="request-status" role="status">
        {status}
      </p>
    </form>
  )
}
