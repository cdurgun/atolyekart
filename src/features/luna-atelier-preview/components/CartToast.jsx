import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'

export const CART_TOAST_TEXT = 'Ürün sepetinize eklendi.'
const DURATION_MS = 2500

// Sepete her eklemede signal artar; bildirim görünür ve DURATION_MS sonra kaybolur.
// Art arda eklemede süre baştan başlar, bildirimler üst üste birikmez.
// Canlı bölge (role="status") hep DOM'dadır; mesaj key ile yeniden kurulduğu için her ekleme duyurulur.
export default function CartToast({ signal }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!signal) return undefined
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), DURATION_MS)
    return () => clearTimeout(timer)
  }, [signal])

  return (
    <div className="lp-toast" role="status" aria-live="polite">
      {visible && (
        <p className="lp-toast-message" key={signal}>
          <Icon name="checkCircle" size={18} />
          <span>{CART_TOAST_TEXT}</span>
        </p>
      )}
    </div>
  )
}
