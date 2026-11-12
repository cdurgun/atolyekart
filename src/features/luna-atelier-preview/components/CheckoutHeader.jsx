import Icon from './Icon.jsx'
import { routes } from '../routes.js'

// Ödeme bu sayfada alınmaz: talep gönderilir, atölye telefonla teyit eder.
const steps = ['Sepet', 'İletişim', 'Talep']

// Sepet ve ödeme ekranının sade üst çubuğu (Stitch: luna_atelier_sepet_ve_deme_desktop).
export default function CheckoutHeader({ step = 0 }) {
  return (
    <header className="lp-header lp-checkout-header">
      <div className="lp-header-inner lp-container">
        <a className="lp-logo" href={routes.home}><span className="lp-dot" />LUNA ATELIER</a>
        <ol className="lp-steps" aria-label="Sipariş adımları">
          {steps.map((label, index) => (
            <li key={label} aria-current={index === step ? 'step' : undefined}>
              <span className="lp-step-number">{index + 1}</span>
              {label}
            </li>
          ))}
        </ol>
        <a className="lp-back-link" href={routes.catalog}>
          <Icon name="arrowLeft" size={18} />
          <span>Atölyeye Dön</span>
        </a>
      </div>
    </header>
  )
}
