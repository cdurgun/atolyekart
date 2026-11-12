import { useState } from 'react'
import Icon from './Icon.jsx'

// Bülten kutusu yalnızca görseldir: hiçbir yere istek göndermez ve bunu ziyaretçiye açıkça söyler.
export default function Newsletter({ id, title, text, button = 'Kaydol', layout = 'split' }) {
  const [sent, setSent] = useState(false)

  return (
    <section id={id} className="lp-container lp-section-tight">
      <div className={`lp-newsletter lp-newsletter-${layout}`}>
        <div className="lp-newsletter-copy">
          {layout === 'centered' && <Icon name="mail" size={26} className="lp-newsletter-icon" />}
          <h2 className="lp-heading-sm">{title}</h2>
          <p className="lp-body-sm lp-muted">{text}</p>
        </div>
        <form
          className="lp-newsletter-form"
          onSubmit={(event) => {
            event.preventDefault()
            setSent(true)
          }}
        >
          <div className="lp-capsule">
            <label className="lp-visually-hidden" htmlFor={`${id}-email`}>E-posta adresiniz</label>
            <input id={`${id}-email`} type="email" required placeholder="E-posta adresiniz..." autoComplete="off" />
            <button type="submit" className="lp-button lp-button-primary lp-button-compact">{button}</button>
          </div>
          <p className="lp-form-note" role="status">
            {sent ? 'Bülten kaydı henüz açık değil; e-posta adresiniz kaydedilmedi.' : ''}
          </p>
        </form>
      </div>
    </section>
  )
}
