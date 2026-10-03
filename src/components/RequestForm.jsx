import { useRef, useState } from 'react'
import { sendEvent } from '../webhook/adapter.js'
import { buildRequestEvent, productSlug, requestKinds } from '../webhook/payload.js'
import { validateRequest } from '../webhook/validation.js'

const contactFields = {
  phone: { label: 'Telefon numaranız', type: 'tel', autoComplete: 'tel' },
  email: { label: 'E-posta adresiniz', type: 'email', autoComplete: 'email' },
}

const successTexts = {
  order: 'Sipariş talebiniz alındı. Sizi telefonla arayacağız.',
  'stock-alert': 'Kaydınız alındı. Ürün stoğa girdiğinde e-postayla haber vereceğiz.',
}

const failureText = 'Gönderilemedi. Lütfen yeniden deneyin.'

export default function RequestForm({ kind, title, products }) {
  const { contact } = requestKinds[kind]
  const empty = { name: '', product: '', [contact]: '' }
  const [raw, setRaw] = useState(empty)
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState('')
  // Başarısız teslimat aynı id ile yeniden gönderilir.
  const failed = useRef(null)

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

  function error(name) {
    return (
      <p className="request-error" id={`${kind}-${name}-error`} hidden={!errors[name]}>
        {errors[name]}
      </p>
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const result = validateRequest(raw, contact, products.map(productSlug))
    setErrors(result.errors)
    setStatus('')
    const invalid = Object.keys(result.errors)[0]
    if (invalid) {
      form.elements[invalid].focus()
      return
    }

    const product = products.find((item) => productSlug(item) === result.values.product)
    let payload = buildRequestEvent(kind, result.values, product, {
      source: 'react',
      pageUrl: window.location.href,
      baseUrl: document.baseURI,
    })
    if (failed.current && JSON.stringify(failed.current.data) === JSON.stringify(payload.data)) {
      payload = failed.current
    }

    setSending(true)
    const { ok } = await sendEvent(payload)
    setSending(false)
    failed.current = ok ? null : payload
    if (ok) setRaw(empty)
    setStatus(ok ? successTexts[kind] : failureText)
  }

  return (
    <form className="request-form" noValidate onSubmit={handleSubmit}>
      <h3>{title}</h3>
      <div className="request-field">
        <label htmlFor={`${kind}-name`}>Adınız</label>
        <input type="text" autoComplete="name" {...field('name')} />
        {error('name')}
      </div>
      <div className="request-field">
        <label htmlFor={`${kind}-product`}>Ürün</label>
        <select {...field('product')}>
          <option value="">Ürün seçin</option>
          {products.map((product) => (
            <option key={product.name} value={productSlug(product)}>
              {product.name}
            </option>
          ))}
        </select>
        {error('product')}
      </div>
      <div className="request-field">
        <label htmlFor={`${kind}-${contact}`}>{contactFields[contact].label}</label>
        <input type={contactFields[contact].type} autoComplete={contactFields[contact].autoComplete} {...field(contact)} />
        {error(contact)}
      </div>
      <button type="submit" disabled={sending}>
        {title}
      </button>
      <p className="request-status" role="status">
        {status}
      </p>
    </form>
  )
}
