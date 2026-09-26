// Google service-account access token (JWT bearer flow, Web Crypto).
// Same signing as _sheets.js and ga4-weekly-report.js, but takes the scope as
// an argument so one module can serve GA4 (analytics.readonly) and Sheets.
//
// Env: GOOGLE_SA_EMAIL, GOOGLE_SA_PRIVATE_KEY (PEM; literal \n escapes OK)

const TOKEN_URL = 'https://oauth2.googleapis.com/token'

function b64urlBytes(bytes) {
  let s = ''
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const b64urlStr = (str) => b64urlBytes(new TextEncoder().encode(str))

function pemToArrayBuffer(pem) {
  const body = pem
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '')
  const bin = atob(body)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf.buffer
}

export function serviceAccountConfigured(env) {
  return Boolean(env.GOOGLE_SA_EMAIL && env.GOOGLE_SA_PRIVATE_KEY)
}

// `scope` may be a single scope or a space-separated list.
export async function getGoogleAccessToken(env, scope) {
  const now = Math.floor(Date.now() / 1000)
  const header = b64urlStr(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = b64urlStr(
    JSON.stringify({ iss: env.GOOGLE_SA_EMAIL, scope, aud: TOKEN_URL, iat: now, exp: now + 3600 })
  )
  const signingInput = `${header}.${claim}`
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(env.GOOGLE_SA_PRIVATE_KEY),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput))
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${signingInput}.${b64urlBytes(sig)}`,
    }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Google token error ${res.status}: ${text.slice(0, 300)}`)
  return JSON.parse(text).access_token
}
