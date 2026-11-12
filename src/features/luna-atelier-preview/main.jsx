import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import LunaPreviewApp from './LunaPreviewApp.jsx'
// Yalnızca önizlemenin kendi stili yüklenir; mevcut src/styles.css bu sayfaya girmez.
import './styles/luna-preview.css'

createRoot(document.getElementById('lp-root')).render(
  <StrictMode>
    <LunaPreviewApp />
  </StrictMode>,
)
