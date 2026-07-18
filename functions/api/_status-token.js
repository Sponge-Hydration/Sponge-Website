// Stateless, signed order-status token: base64url(orderNumber) + "." + HMAC.
// A customer can only open their own order; sequential order numbers can't be
// enumerated without the signing secret. No database required.

const enc = new TextEncoder()

function b64url(bytes) {
  let s = ''
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(str) {
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

async function hmacHex(secret, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}

export async function makeStatusToken(orderNumber, secret) {
  const on = String(orderNumber)
  const sig = (await hmacHex(secret, on)).slice(0, 32)
  return `${b64url(enc.encode(on))}.${sig}`
}

export async function verifyStatusToken(token, secret) {
  if (!secret || !token || typeof token !== 'string' || !token.includes('.')) return null
  const [enc64, sig] = token.split('.')
  let orderNumber
  try {
    orderNumber = b64urlDecode(enc64)
  } catch {
    return null
  }
  const expected = (await hmacHex(secret, orderNumber)).slice(0, 32)
  return timingSafeEqual(sig || '', expected) ? orderNumber : null
}
