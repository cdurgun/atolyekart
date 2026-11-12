// Sipariş modunu bu derlemenin ortamından okur (yalnızca tarayıcıda/Vite'ta içe aktarılır).
// VITE_VERCEL_ENV, Vercel'in Vite projelerine derleme sırasında verdiği sistem değişkenidir
// ("Automatically expose System Environment Variables" açıkken). Gizli değildir.
import { resolveOrderMode } from './orderMode.js'

export const orderMode = resolveOrderMode({
  apiUrl: import.meta.env.VITE_API_URL ?? '',
  vercelEnv: import.meta.env.VITE_VERCEL_ENV ?? '',
  hostname: window.location.hostname,
})
