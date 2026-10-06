// Yerel/test amaçlı admin JWT üretir. Gizli anahtarı ortamdan okur; anahtar da token da depoya yazılmaz.
// Kullanım:  node --env-file=.env.local scripts/admin-token.mjs [dakika=15] [rol=admin]
import { signJwt } from '../server/lib/jwt.js'

const secret = process.env.JWT_SECRET
if (!secret || secret.length < 32) {
  console.error('JWT_SECRET tanımlı değil ya da 32 karakterden kısa (.env.local).')
  process.exit(1)
}

const minutes = Number(process.argv[2] ?? 15)
const role = process.argv[3] ?? 'admin'
const now = Math.floor(Date.now() / 1000)
process.stdout.write(signJwt({ sub: 'local-admin', role, iat: now, exp: now + minutes * 60 }, secret) + '\n')
