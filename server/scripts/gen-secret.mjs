/**
 * Prints a strong JWT_SECRET.
 *
 * Run `npm run gen:secret` and paste the value into the environment. The server
 * refuses to start in production with a short or placeholder secret.
 */
import crypto from 'node:crypto'

const secret = crypto.randomBytes(48).toString('base64url')
console.log(`\nJWT_SECRET=${secret}\n`)
console.log('Store this in your host\'s secret manager — not in the repository.\n')
