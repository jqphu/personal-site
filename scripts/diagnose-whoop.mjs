import { readFileSync } from 'node:fs'

for (const file of ['.env.production', '.env.local', '.env']) {
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '')
    }
  } catch {}
}

const KV_URL = process.env.KV_REST_API_URL
const KV_TOKEN = process.env.KV_REST_API_TOKEN

async function kvRaw(...args) {
  const res = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch {}
  return { status: res.status, ok: res.ok, text, json }
}

console.log('1. KV connectivity / current state')
console.log('  URL set:', !!KV_URL, 'TOKEN set:', !!KV_TOKEN)

const got = await kvRaw('GET', 'whoop:data')
console.log('  GET whoop:data status:', got.status, 'ok:', got.ok)
if (!got.ok) console.log('  body:', got.text.slice(0, 300))
else {
  const cached = got.json?.result
  if (cached) {
    const parsed = JSON.parse(cached)
    console.log('  current fetchedAt:', parsed.fetchedAt)
    console.log('  payload size (bytes):', cached.length)
  } else {
    console.log('  result is null/empty')
  }
}

console.log('\n2. KV write test')
const testKey = 'whoop:diagnostic_test'
const testVal = `diagnostic-${new Date().toISOString()}`
const setRes = await kvRaw('SET', testKey, testVal)
console.log('  SET status:', setRes.status, 'ok:', setRes.ok)
console.log('  SET body:', setRes.text.slice(0, 300))

const verifyRes = await kvRaw('GET', testKey)
console.log('  GET-back status:', verifyRes.status, 'ok:', verifyRes.ok)
console.log('  GET-back result:', verifyRes.json?.result)
console.log('  matches written value:', verifyRes.json?.result === testVal)

console.log('\n3. WHOOP refresh token check')
const tokRes = await kvRaw('GET', 'whoop:refresh_token')
const refreshToken = tokRes.json?.result || process.env.WHOOP_REFRESH_TOKEN
console.log('  source:', tokRes.json?.result ? 'KV' : 'env fallback')
console.log('  token present:', !!refreshToken, 'length:', refreshToken?.length)

console.log('\n4. WHOOP token refresh attempt')
const whoopRes = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: process.env.WHOOP_CLIENT_ID,
    client_secret: process.env.WHOOP_CLIENT_SECRET,
    scope: 'offline',
  }),
})
const whoopText = await whoopRes.text()
console.log('  status:', whoopRes.status, 'ok:', whoopRes.ok)
console.log('  body:', whoopText.slice(0, 400))

if (whoopRes.ok) {
  const tokens = JSON.parse(whoopText)
  console.log('\n5. WHOOP API smoke test (cycle endpoint)')
  const apiRes = await fetch('https://api.prod.whoop.com/developer/v2/cycle?limit=1', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  console.log('  status:', apiRes.status, 'ok:', apiRes.ok)
  const apiText = await apiRes.text()
  console.log('  body preview:', apiText.slice(0, 300))

  console.log('\n6. Persisting refreshed tokens back to KV (so we don\'t lock out the cron)')
  const saveRefresh = await kvRaw('SET', 'whoop:refresh_token', tokens.refresh_token)
  const saveAccess = await kvRaw('SET', 'whoop:access_token', tokens.access_token)
  console.log('  refresh SET status:', saveRefresh.status, 'access SET status:', saveAccess.status)
}
