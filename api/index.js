// Vercel Function: tüm /api/* istekleri vercel.json içindeki rewrite ile buraya gelir.
// Tek fonksiyon olmasının nedeni: rate limit sayacı ve son siparişler listesi bellekte tutulur;
// ayrı fonksiyon dosyaları ayrı bellek demektir ve /api/admin/orders siparişleri göremezdi.
import { handleApi } from '../server/router.js'

export default { fetch: handleApi }
