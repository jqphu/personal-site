import { createServer } from 'node:http'
import { URL } from 'node:url'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const envPath = resolve(root, '.env')

function loadEnvFile(path: string): Record<string, string> {
  try {
    return Object.fromEntries(
      readFileSync(path, 'utf-8')
        .split('\n')
        .filter(l => l && !l.startsWith('#'))
        .map(l => {
          const idx = l.indexOf('=')
          if (idx === -1) return [l.trim(), '']
          return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, '')]
        })
    )
  } catch {
    return {}
  }
}

const env = {
  ...loadEnvFile(resolve(root, '.env.local')),
  ...loadEnvFile(resolve(root, '.env.production')),
  ...loadEnvFile(envPath),
}

const CLIENT_ID = env.WHOOP_CLIENT_ID
const CLIENT_SECRET = env.WHOOP_CLIENT_SECRET
const REDIRECT_URI = env.WHOOP_REDIRECT_URI || 'http://localhost:3000/callback'
const KV_REST_API_URL = env.KV_REST_API_URL
const KV_REST_API_TOKEN = env.KV_REST_API_TOKEN

async function kvSet(key: string, value: string) {
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
    console.warn(`  ⚠ KV creds missing, skipping SET ${key}`)
    return
  }
  const res = await fetch(KV_REST_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(['SET', key, value]),
  })
  const text = await res.text()
  if (!res.ok) {
    console.error(`  ✗ KV SET ${key} failed: ${res.status} ${text}`)
    throw new Error(`KV SET ${key} failed`)
  }
  console.log(`  ✓ KV SET ${key} → ${text}`)
}
const SCOPES = [
  'read:recovery',
  'read:cycles',
  'read:workout',
  'read:sleep',
  'read:profile',
  'read:body_measurement',
  'offline',
].join(' ')

const AUTH_URL = `https://api.prod.whoop.com/oauth/oauth2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPES)}&state=whoopauth`

const server = createServer(async (req, res) => {
  const url = new URL(req.url!, `http://localhost:3000`)

  if (url.pathname === '/callback') {
    const code = url.searchParams.get('code')
    if (!code) {
      res.writeHead(400)
      res.end('Missing code parameter')
      return
    }

    const tokenRes = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
      }),
    })

    const tokens = await tokenRes.json()

    if (tokens.access_token) {
      const envContent = readFileSync(envPath, 'utf-8')
      let updated = envContent
      if (updated.includes('WHOOP_ACCESS_TOKEN=')) {
        updated = updated.replace(/WHOOP_ACCESS_TOKEN=.*/, `WHOOP_ACCESS_TOKEN=${tokens.access_token}`)
      } else {
        updated += `WHOOP_ACCESS_TOKEN=${tokens.access_token}\n`
      }
      if (updated.includes('WHOOP_REFRESH_TOKEN=')) {
        updated = updated.replace(/WHOOP_REFRESH_TOKEN=.*/, `WHOOP_REFRESH_TOKEN=${tokens.refresh_token}`)
      } else {
        updated += `WHOOP_REFRESH_TOKEN=${tokens.refresh_token}\n`
      }
      writeFileSync(envPath, updated)

      console.log('\n✓ Tokens saved to .env')
      console.log(`  access_token: ${tokens.access_token.slice(0, 20)}...`)
      console.log(`  refresh_token: ${tokens.refresh_token.slice(0, 20)}...`)
      console.log(`  expires_in: ${tokens.expires_in}s`)

      console.log('\nPushing tokens to KV (production storage)…')
      try {
        await kvSet('whoop:refresh_token', tokens.refresh_token)
        await kvSet('whoop:access_token', tokens.access_token)
        console.log('✓ KV updated — production cron will use the new tokens on next run')
      } catch (e) {
        console.error('✗ KV update failed:', e)
        console.error('  The .env was updated locally, but production still has the bad token.')
      }

      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end('<h1>Done! Tokens saved. You can close this tab.</h1>')
      setTimeout(() => process.exit(0), 1000)
    } else {
      console.error('Token exchange failed:', tokens)
      res.writeHead(500)
      res.end(`Token exchange failed: ${JSON.stringify(tokens)}`)
    }
  } else {
    res.writeHead(302, { Location: AUTH_URL })
    res.end()
  }
})

server.listen(3000, () => {
  console.log('\nOpen http://localhost:3000 in your browser to authorize WHOOP\n')
})
