import { Hono, type Context, type Next } from 'hono'
import { cors } from 'hono/cors'
import { sign, verify } from 'hono/jwt'

type Bindings = {
  DB: D1Database
  ALLOWED_ORIGINS: string
  GITHUB_REPO: string
  JWT_SECRET: string
  VISITOR_SALT: string
  GITHUB_TOKEN?: string
  GITHUB_BRANCH?: string
}
type Ctx = Context<{ Bindings: Bindings }>

const app = new Hono<{ Bindings: Bindings }>()

const ENTRY_TYPES = ['post', 'project', 'contest', 'certificate', 'education', 'experience', 'skillgroup', 'achievement']
const SETTING_KEYS = ['profile', 'cv']
const DEFAULT_SEQUENCE = '-.-' // dash dot dash
const MAX_FAILS = 5
const LOCK_MS = 15 * 60 * 1000

const origins = (c: Ctx) => c.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())

app.use('*', async (c, next) =>
  cors({
    origin: (origin) => (origins(c).includes(origin) ? origin : ''),
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    maxAge: 86400
  })(c, next)
)

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Something went wrong on the server.' }, 500)
})

/* ---------- helpers ---------- */

const enc = new TextEncoder()
const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

async function sha256(text: string) {
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode(text)))
}

async function hashSequence(seq: string, salt: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(seq), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256)
  return toHex(bits)
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function getSetting<T>(db: D1Database, key: string, fallback: T): Promise<T> {
  const row = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>()
  if (!row) return fallback
  try {
    return JSON.parse(row.value) as T
  } catch {
    return fallback
  }
}

async function setSetting(db: D1Database, key: string, value: unknown) {
  await db
    .prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .bind(key, JSON.stringify(value))
    .run()
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

const parseJson = (s: string) => {
  try {
    return JSON.parse(s)
  } catch {
    return {}
  }
}

type MorseRecord = { salt: string; hash: string; isDefault: boolean }

async function getMorse(db: D1Database): Promise<MorseRecord> {
  let m = await getSetting<MorseRecord | null>(db, 'morse', null)
  if (!m) {
    const salt = crypto.randomUUID()
    m = { salt, hash: await hashSequence(DEFAULT_SEQUENCE, salt), isDefault: true }
    await setSetting(db, 'morse', m)
  }
  return m
}

const validSequence = (s: unknown): s is string => typeof s === 'string' && /^[.-]{1,64}$/.test(s)

const auth = async (c: Ctx, next: Next) => {
  const header = c.req.header('Authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  try {
    await verify(token, c.env.JWT_SECRET, 'HS256')
  } catch {
    return c.json({ error: 'Not signed in.' }, 401)
  }
  await next()
}
app.use('/api/admin/*', auth)

/* ---------- auth ---------- */

app.get('/api/health', (c) => c.json({ ok: true }))

app.get('/api/morse-config', async (c) => {
  const cfg = await getSetting(c.env.DB, 'morse_config', { dotMaxMs: 300, idleMs: 2000 })
  return c.json(cfg)
})

app.post('/api/auth/morse', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const seq = (body as { sequence?: unknown }).sequence
  if (!validSequence(seq)) return c.json({ ok: false }, 401)

  const now = Date.now()
  const lock = await getSetting(c.env.DB, 'lock', { fails: 0, until: 0 })
  if (now < lock.until) return c.json({ ok: false, locked: true, retryAfter: Math.ceil((lock.until - now) / 1000) }, 429)

  const morse = await getMorse(c.env.DB)
  const ok = safeEqual(await hashSequence(seq, morse.salt), morse.hash)
  if (!ok) {
    const fails = lock.fails + 1
    await setSetting(c.env.DB, 'lock', fails >= MAX_FAILS ? { fails: 0, until: now + LOCK_MS } : { fails, until: 0 })
    return c.json({ ok: false }, 401)
  }
  await setSetting(c.env.DB, 'lock', { fails: 0, until: 0 })
  const token = await sign({ sub: 'admin', exp: Math.floor(now / 1000) + 2 * 60 * 60 }, c.env.JWT_SECRET, 'HS256')
  return c.json({ ok: true, token, isDefault: morse.isDefault })
})

app.put('/api/admin/morse', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { current?: unknown; next?: unknown }
  if (!validSequence(body.current) || !validSequence(body.next)) return c.json({ error: 'Invalid sequence.' }, 400)
  if (body.next.length < 3) return c.json({ error: 'Use at least 3 symbols.' }, 400)
  const morse = await getMorse(c.env.DB)
  if (!safeEqual(await hashSequence(body.current, morse.salt), morse.hash)) return c.json({ error: 'Current sequence is wrong.' }, 403)
  const salt = crypto.randomUUID()
  await setSetting(c.env.DB, 'morse', { salt, hash: await hashSequence(body.next, salt), isDefault: false })
  return c.json({ ok: true })
})

app.put('/api/admin/morse-config', async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as { dotMaxMs?: number; idleMs?: number }
  const dotMaxMs = Math.min(1000, Math.max(100, Number(b.dotMaxMs) || 300))
  const idleMs = Math.min(5000, Math.max(800, Number(b.idleMs) || 2000))
  await setSetting(c.env.DB, 'morse_config', { dotMaxMs, idleMs })
  return c.json({ dotMaxMs, idleMs })
})

/* ---------- public content ---------- */

app.get('/api/public/content', async (c) => {
  const { results } = await c.env.DB
    .prepare('SELECT type, slug, title, summary, body_md, image, date, sort, data, updated_at FROM entries WHERE published = 1 ORDER BY type, sort, id')
    .all<Record<string, string>>()
  const entries = results.map((r) => ({ ...r, data: parseJson(r.data) }))
  const profile = await getSetting(c.env.DB, 'profile', {})
  const cv = await getSetting(c.env.DB, 'cv', null)
  c.header('Cache-Control', 'no-store')
  return c.json({ profile, cv, entries })
})

/* ---------- visit tracking ---------- */

const BOTS = /bot|crawl|spider|slurp|preview|headless|lighthouse|curl|wget|python-requests|facebookexternalhit/i

app.post('/api/track', async (c) => {
  const origin = c.req.header('Origin')
  if (origin && (origin.includes('localhost') || !origins(c).includes(origin))) return c.body(null, 204)
  const ua = c.req.header('User-Agent') || ''
  if (!ua || BOTS.test(ua)) return c.body(null, 204)

  const raw = await c.req.text()
  let payload: { path?: unknown; ref?: unknown } = {}
  try {
    payload = JSON.parse(raw)
  } catch {
    return c.body(null, 204)
  }
  if (typeof payload.path !== 'string' || !payload.path.startsWith('/')) return c.body(null, 204)
  const path = payload.path.split(/[?#]/)[0].slice(0, 200)
  const day = new Date().toISOString().slice(0, 10)
  const ip = c.req.header('CF-Connecting-IP') || ''
  const vh = (await sha256(`${c.env.VISITOR_SALT}|${day}|${ip}|${ua}`)).slice(0, 16)

  const statements = [
    c.env.DB.prepare('INSERT INTO page_views (day, path, views) VALUES (?, ?, 1) ON CONFLICT(day, path) DO UPDATE SET views = views + 1').bind(day, path),
    c.env.DB.prepare('INSERT OR IGNORE INTO unique_visits (day, path, vh) VALUES (?, ?, ?)').bind(day, path, vh)
  ]
  if (typeof payload.ref === 'string' && payload.ref) {
    try {
      const host = new URL(payload.ref).hostname
      if (host && !origins(c).some((o) => o.includes(host))) {
        statements.push(
          c.env.DB.prepare('INSERT INTO referrers (day, ref, hits) VALUES (?, ?, 1) ON CONFLICT(day, ref) DO UPDATE SET hits = hits + 1').bind(day, host.slice(0, 100))
        )
      }
    } catch {
      /* ignore bad referrer */
    }
  }
  await c.env.DB.batch(statements)
  return c.body(null, 204)
})

app.get('/api/admin/stats', async (c) => {
  const days = Math.min(365, Math.max(1, Number(c.req.query('days')) || 30))
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
  const db = c.env.DB
  const [daily, pages, uniques, refs, totals, cv] = await db.batch([
    db.prepare('SELECT day, SUM(views) AS views FROM page_views WHERE day >= ? GROUP BY day ORDER BY day').bind(since),
    db.prepare('SELECT path, SUM(views) AS views FROM page_views WHERE day >= ? GROUP BY path ORDER BY views DESC LIMIT 100').bind(since),
    db.prepare('SELECT path, COUNT(*) AS uniques FROM unique_visits WHERE day >= ? GROUP BY path').bind(since),
    db.prepare('SELECT ref, SUM(hits) AS hits FROM referrers WHERE day >= ? GROUP BY ref ORDER BY hits DESC LIMIT 10').bind(since),
    db.prepare("SELECT (SELECT COALESCE(SUM(views),0) FROM page_views WHERE day >= ? AND path NOT LIKE '%.pdf') AS views, (SELECT COUNT(DISTINCT day || vh) FROM unique_visits WHERE day >= ?) AS visitors").bind(since, since),
    db.prepare("SELECT COALESCE(SUM(views),0) AS n FROM page_views WHERE day >= ? AND path = '/cv.pdf'").bind(since)
  ])
  const uniqueMap = new Map((uniques.results as { path: string; uniques: number }[]).map((r) => [r.path, r.uniques]))
  return c.json({
    days,
    daily: daily.results,
    pages: (pages.results as { path: string; views: number }[]).map((r) => ({ ...r, uniques: uniqueMap.get(r.path) ?? 0 })),
    referrers: refs.results,
    totals: { ...(totals.results[0] as object), cvDownloads: (cv.results[0] as { n: number }).n }
  })
})

/* ---------- admin: entries ---------- */

function cleanEntry(b: Record<string, unknown>) {
  const s = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '')
  const title = s(b.title, 300).trim()
  return {
    title,
    slug: slugify(s(b.slug, 200) || title),
    summary: s(b.summary, 2000),
    body_md: s(b.body_md, 200000),
    image: s(b.image, 500),
    date: s(b.date, 100),
    published: b.published === false || b.published === 0 ? 0 : 1,
    data: JSON.stringify(b.data && typeof b.data === 'object' ? b.data : {})
  }
}

const rowToEntry = (r: Record<string, unknown>) => ({ ...r, published: !!r.published, data: parseJson(String(r.data ?? '{}')) })

app.get('/api/admin/entries', async (c) => {
  const type = c.req.query('type') || ''
  if (!ENTRY_TYPES.includes(type)) return c.json({ error: 'Unknown type.' }, 400)
  const { results } = await c.env.DB.prepare('SELECT * FROM entries WHERE type = ? ORDER BY sort, id').bind(type).all<Record<string, unknown>>()
  return c.json(results.map(rowToEntry))
})

app.post('/api/admin/entries', async (c) => {
  const b = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  if (typeof b.type !== 'string' || !ENTRY_TYPES.includes(b.type)) return c.json({ error: 'Unknown type.' }, 400)
  const e = cleanEntry(b)
  if (!e.title || !e.slug) return c.json({ error: 'A title is required.' }, 400)
  const max = await c.env.DB.prepare('SELECT COALESCE(MAX(sort), 0) AS m FROM entries WHERE type = ?').bind(b.type).first<{ m: number }>()
  try {
    const r = await c.env.DB
      .prepare('INSERT INTO entries (type, slug, title, summary, body_md, image, date, sort, published, data) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .bind(b.type, e.slug, e.title, e.summary, e.body_md, e.image, e.date, (max?.m ?? 0) + 1, e.published, e.data)
      .run()
    return c.json({ id: r.meta.last_row_id })
  } catch {
    return c.json({ error: 'That slug is already used by another item of this type.' }, 409)
  }
})

app.put('/api/admin/entries/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const e = cleanEntry((await c.req.json().catch(() => ({}))) as Record<string, unknown>)
  if (!e.title || !e.slug) return c.json({ error: 'A title is required.' }, 400)
  try {
    await c.env.DB
      .prepare("UPDATE entries SET slug=?, title=?, summary=?, body_md=?, image=?, date=?, published=?, data=?, updated_at=datetime('now') WHERE id=?")
      .bind(e.slug, e.title, e.summary, e.body_md, e.image, e.date, e.published, e.data, id)
      .run()
    return c.json({ ok: true })
  } catch {
    return c.json({ error: 'That slug is already used by another item of this type.' }, 409)
  }
})

app.delete('/api/admin/entries/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM entries WHERE id = ?').bind(Number(c.req.param('id'))).run()
  return c.json({ ok: true })
})

app.post('/api/admin/entries/:id/move', async (c) => {
  const id = Number(c.req.param('id'))
  const { dir } = (await c.req.json().catch(() => ({}))) as { dir?: string }
  const row = await c.env.DB.prepare('SELECT type FROM entries WHERE id = ?').bind(id).first<{ type: string }>()
  if (!row) return c.json({ error: 'Not found.' }, 404)
  const { results } = await c.env.DB.prepare('SELECT id FROM entries WHERE type = ? ORDER BY sort, id').bind(row.type).all<{ id: number }>()
  const ids = results.map((r) => r.id)
  const i = ids.indexOf(id)
  const j = dir === 'up' ? i - 1 : i + 1
  if (i < 0 || j < 0 || j >= ids.length) return c.json({ ok: true })
  ;[ids[i], ids[j]] = [ids[j], ids[i]]
  await c.env.DB.batch(ids.map((x, k) => c.env.DB.prepare('UPDATE entries SET sort = ? WHERE id = ?').bind(k + 1, x)))
  return c.json({ ok: true })
})

/* ---------- admin: settings, upload, publish ---------- */

app.get('/api/admin/settings/:key', async (c) => {
  const key = c.req.param('key')
  if (!SETTING_KEYS.includes(key)) return c.json({ error: 'Unknown setting.' }, 400)
  return c.json(await getSetting(c.env.DB, key, key === 'cv' ? null : {}))
})

app.put('/api/admin/settings/:key', async (c) => {
  const key = c.req.param('key')
  if (!SETTING_KEYS.includes(key)) return c.json({ error: 'Unknown setting.' }, 400)
  await setSetting(c.env.DB, key, await c.req.json())
  return c.json({ ok: true })
})

const UPLOAD_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'application/pdf': 'pdf'
}

function toBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}

// Uploads are committed to the site repo (packages/web/public/uploads), so no separate file storage is needed.
// The commit also triggers the deploy workflow, so uploaded files go live on their own.
app.post('/api/admin/upload', async (c) => {
  if (!c.env.GITHUB_TOKEN) return c.json({ error: 'GITHUB_TOKEN is not configured on the API.' }, 500)
  const form = await c.req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return c.json({ error: 'No file received.' }, 400)
  const ext = UPLOAD_TYPES[file.type]
  if (!ext) return c.json({ error: 'Use a PNG, JPG, WebP, GIF, AVIF or PDF file.' }, 415)
  if (file.size > 8 * 1024 * 1024) return c.json({ error: 'Files must be 8 MB or smaller.' }, 413)
  const key = `${Date.now().toString(36)}-${slugify(file.name.replace(/\.[^.]+$/, '')) || 'file'}.${ext}`
  const res = await fetch(`https://api.github.com/repos/${c.env.GITHUB_REPO}/contents/packages/web/public/uploads/${key}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${c.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'portfolio-api',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `Upload ${key}`,
      content: toBase64(await file.arrayBuffer()),
      branch: c.env.GITHUB_BRANCH || 'main'
    })
  })
  if (!res.ok) return c.json({ error: `GitHub rejected the upload (${res.status}). Check the token's Contents permission.` }, 502)
  return c.json({ key, url: `/uploads/${key}` })
})

app.post('/api/admin/publish', async (c) => {
  if (!c.env.GITHUB_TOKEN) return c.json({ error: 'GITHUB_TOKEN is not configured on the API.' }, 500)
  const res = await fetch(`https://api.github.com/repos/${c.env.GITHUB_REPO}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'portfolio-api',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ event_type: 'content-updated' })
  })
  if (res.status !== 204) return c.json({ error: `GitHub rejected the rebuild request (${res.status}).` }, 502)
  return c.json({ ok: true })
})

export default app
