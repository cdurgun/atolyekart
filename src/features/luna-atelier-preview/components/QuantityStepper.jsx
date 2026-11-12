import Icon from './Icon.jsx'

export default function QuantityStepper({ value, onChange, label, min = 1, max = 12 }) {
  return (
    <div className="lp-stepper" role="group" aria-label={label}>
      <button type="button" aria-label="Azalt" disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Icon name="minus" size={16} />
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" aria-label="Artır" disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Icon name="plus" size={16} />
      </button>
    </div>
  )
}
