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

    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    async function paginate(path: string, dateField: 'start' | 'created_at') {
      const all: Record<string, unknown>[] = []
      let nextToken: string | undefined
      let hasOldEnough = false
      do {
        const params = new URLSearchParams({ limit: '25' })
        if (nextToken) params.set('nextToken', nextToken)
        const sep = path.includes('?') ? '&' : '?'
        const page = await whoopApi(`${path}${sep}${params}`, token)
        if (!page) break
        const records = page.records ?? []
        all.push(...records)
        nextToken = page.next_token
        hasOldEnough = records.some((r: Record<string, string>) => {
          const ts = r[dateField]
          return ts != null && new Date(ts) < fourteenDaysAgo
        })
      } while (nextToken && !hasOldEnough && all.length < 250)
      return all
    }

    const [recoveries, sleeps, cycles, workouts] = await Promise.all([
      paginate('/v2/recovery', 'created_at'),
      paginate('/v2/activity/sleep', 'start'),
      paginate('/v2/cycle', 'start'),
      paginate('/v2/activity/workout', 'start'),
    ])

    const data = {
      fetchedAt: new Date().toISOString(),
      latest: {
        recovery: recoveries[0] ?? null,
        sleep: sleeps[0] ?? null,
        cycle: cycles[0] ?? null,
      },
      recoveries,
      sleeps,
      cycles,
      workouts,
    }

    await kv('SET', 'whoop:data', JSON.stringify(data))

    return res.status(200).json({ ok: true, fetchedAt: data.fetchedAt })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return res.status(500).json({ error: msg })
  }
}
