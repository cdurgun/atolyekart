import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Geliştirme ve önizleme sunucusunda /api isteklerini Vercel'deki ile aynı koda (server/router.js) verir.
// Böylece `npm run dev` tek komutla hem sayfayı hem API'yi çalıştırır; `vercel dev` gerekmez.
function apiServer() {
  const attach = (server) => {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url.startsWith('/api/')) return next()
      const { handleApi } = await import('./server/router.js')
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const headers = new Headers(Object.entries(req.headers).filter(([, value]) => typeof value === 'string'))
      headers.set('x-forwarded-for', req.socket.remoteAddress ?? '')
      const response = await handleApi(
        new Request(`http://${req.headers.host}${req.url}`, {
          method: req.method,
          headers,
          body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
        }),
      )
      res.statusCode = response.status
      response.headers.forEach((value, key) => res.setHeader(key, value))
      res.end(Buffer.from(await response.arrayBuffer()))
    })
  }
  return { name: 'atolyekart-api', configureServer: attach, configurePreviewServer: attach }
}

// vercel.json'daki /luna-preview → /luna-preview/ ve /eski-tasarim → /eski-tasarim/ yönlendirmelerinin
// yerel karşılığı (dev ve preview sunucusu). Olmazsa Vite'ın SPA yedeği bu isteklere ana sayfayı verir.
function lunaPreviewSlash() {
  const attach = (server) => {
    server.middlewares.use((req, res, next) => {
      const [path, query] = req.url.split('?')
      if (path !== '/luna-preview' && path !== '/eski-tasarim') return next()
      res.statusCode = 307
      res.setHeader('Location', `${path}/${query ? `?${query}` : ''}`)
      res.end()
    })
  }
  return { name: 'luna-preview-slash', configureServer: attach, configurePreviewServer: attach }
}

export default defineConfig(({ mode }) => {
  // Sunucu sırları (.env.local) yalnızca bu Node sürecine verilir. VITE_ öneki taşımadıkları için
  // Vite bunları tarayıcı paketine koymaz.
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of ['WEBHOOK_URL', 'WEBHOOK_SECRET', 'JWT_SECRET', 'N8N_CHAT_URL', 'N8N_CHAT_USER', 'N8N_CHAT_PASSWORD']) {
    if (env[key]) process.env[key] ??= env[key]
  }

  return {
    plugins: [react(), apiServer(), lunaPreviewSlash()],
    build: {
      rolldownOptions: { input: ['index.html', 'gizlilik.html', 'luna-preview/index.html', 'eski-tasarim/index.html'] },
    },
  }
})
