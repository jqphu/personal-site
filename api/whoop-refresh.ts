import type { VercelRequest, VercelResponse } from '@vercel/node'

const WHOOP_BASE = 'https://api.prod.whoop.com'

async function kv(method: string, ...args: string[]) {
  const res = await fetch(process.env.KV_REST_API_URL!, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN!}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([method, ...args]),
  })
  const data = await res.json()
  return data.result
}

async function refreshTokens() {
  const refreshToken = (await kv('GET', 'whoop:refresh_token')) || process.env.WHOOP_REFRESH_TOKEN
  if (!refreshToken) throw new Error('No refresh token available')

  const res = await fetch(`${WHOOP_BASE}/oauth/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.WHOOP_CLIENT_ID!,
      client_secret: process.env.WHOOP_CLIENT_SECRET!,
      scope: 'offline',
    }),
  })
  const tokens = await res.json()
  if (!tokens.access_token) throw new Error(`Refresh failed: ${JSON.stringify(tokens)}`)

  await kv('SET', 'whoop:refresh_token', tokens.refresh_token)
  await kv('SET', 'whoop:access_token', tokens.access_token)

  return tokens.access_token
}

async function whoopApi(path: string, token: string) {
  const res = await fetch(`${WHOOP_BASE}/developer${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  return res.json()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cronSecret = req.headers['authorization']
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const token = await refreshTokens()

    const [recovery, sleep, cycle, workouts] = await Promise.all([
      whoopApi('/v2/recovery?limit=1', token),
      whoopApi('/v2/activity/sleep?limit=1', token),
      whoopApi('/v2/cycle?limit=1', token),
      whoopApi('/v2/activity/workout?limit=25', token),
    ])

    const data = {
      fetchedAt: new Date().toISOString(),
      latest: {
        recovery: recovery?.records?.[0] ?? null,
        sleep: sleep?.records?.[0] ?? null,
        cycle: cycle?.records?.[0] ?? null,
      },
      workouts: workouts?.records ?? [],
    }

    await kv('SET', 'whoop:data', JSON.stringify(data))

    return res.status(200).json({ ok: true, fetchedAt: data.fetchedAt })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return res.status(500).json({ error: msg })
  }
}
