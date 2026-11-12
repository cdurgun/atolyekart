import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import { PRODUCT_PREFIX, routes } from '../routes.js'

// Tüm bağlantılar önizleme içinde kalır (hash rotaları); eski uygulamaya çıkış yoktur.
const navItems = [
  { href: routes.catalog, label: 'Koleksiyonlar', match: (r) => r === routes.catalog || r.startsWith(PRODUCT_PREFIX) },
  { href: routes.story, label: 'Atölye & Hikaye', match: (r) => r === routes.story },
  { href: routes.customOrder, label: 'Özel Sipariş', match: (r) => r === routes.customOrder },
  { href: routes.journal, label: 'Journal', match: (r) => r === routes.journal },
]

export default function SiteHeader({ route, cartCount }) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => setMenuOpen(false), [route])

  return (
    <header className="lp-header">
      <div className="lp-header-inner lp-container">
        <button
          type="button"
          className="lp-icon-button lp-menu-toggle"
          aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          aria-expanded={menuOpen}
          aria-controls="lp-mobile-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
        </button>

        <a className="lp-logo" href={routes.home}>LUNA ATELIER</a>

        <nav className="lp-nav" aria-label="Ana menü">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              aria-current={item.match(route) ? 'page' : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="lp-header-actions">
          <button type="button" className="lp-icon-button lp-desktop-only" aria-label="Arama">
            <Icon name="search" />
          </button>
          <button type="button" className="lp-icon-button lp-desktop-only" aria-label="Favoriler">
            <Icon name="heart" />
          </button>
          <span className="lp-currency lp-desktop-only">TRY ₺</span>
          <a className="lp-cart-pill" href={routes.cart}>
            <Icon name="bag" size={16} />
            <span>Sepet ({cartCount})</span>
          </a>
        </div>
      </div>

      <nav
        id="lp-mobile-nav"
        className="lp-mobile-nav"
        aria-label="Mobil menü"
        hidden={!menuOpen}
      >
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            aria-current={item.match(route) ? 'page' : undefined}
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
            <Icon name="arrowRight" size={18} />
          </a>
        ))}
      </nav>
    </header>
  )
}
