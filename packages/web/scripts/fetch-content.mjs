// Pulls published content from the API (or seed data when no API is configured),
// downloads every image/CV into public/, and writes src/data/content.json for the build.
import { mkdir, writeFile, readFile, copyFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const API = (process.env.PUBLIC_API_URL || '').replace(/\/$/, '')
const DATA_FILE = path.join(root, 'src/data/content.json')
const MEDIA_DIR = path.join(root, 'public/media')

async function loadContent() {
  if (API) {
    const res = await fetch(`${API}/api/public/content`)
    if (!res.ok) throw new Error(`API responded ${res.status}`)
    return await res.json()
  }
  console.warn('[content] PUBLIC_API_URL is not set, using seed content')
  const seed = await import(pathToFileURL(path.resolve(root, '../../seed/data.mjs')).href)
  return structuredClone(seed.content)
}

const cache = new Map()
const extFrom = (u) => (path.extname(new URL(u).pathname).toLowerCase() || '.jpg').slice(0, 6)

async function localize(url) {
  if (!url) return ''
  if (cache.has(url)) return cache.get(url)
  let src = url
  let name
  const media = url.match(/\/api\/media\/([\w.\-]+)$/)
  if (media) {
    name = media[1]
    src = url.startsWith('http') ? url : `${API}${url}`
  } else if (/^https?:\/\//.test(url)) {
    name = createHash('sha1').update(url).digest('hex').slice(0, 12) + extFrom(url)
  } else {
    cache.set(url, url)
    return url
  }
  try {
    const dest = path.join(MEDIA_DIR, name)
    if (!existsSync(dest)) {
      const res = await fetch(src)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await mkdir(MEDIA_DIR, { recursive: true })
      await writeFile(dest, Buffer.from(await res.arrayBuffer()))
    }
    cache.set(url, `/media/${name}`)
  } catch (err) {
    console.warn(`[content] could not download ${url}: ${err.message}`)
    cache.set(url, url)
  }
  return cache.get(url)
}

async function replaceAsync(text, regex, fn) {
  const jobs = []
  text.replace(regex, (...args) => {
    jobs.push(fn(...args))
    return ''
  })
  const results = await Promise.all(jobs)
  let i = 0
  return text.replace(regex, () => results[i++])
}

const MD_IMAGE = /(!\[[^\]]*\]\()([^)\s]+)/g

async function codeforces(handle) {
  if (!handle) return null
  try {
    const res = await fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`, { signal: AbortSignal.timeout(8000) })
    const json = await res.json()
    if (json.status !== 'OK') return null
    const u = json.result[0]
    return { handle, rating: u.rating, maxRating: u.maxRating, rank: u.rank, maxRank: u.maxRank }
  } catch (err) {
    console.warn(`[content] Codeforces lookup failed: ${err.message}`)
    return null
  }
}

async function main() {
  const content = await loadContent()
  content.profile ??= {}
  content.entries ??= []

  content.profile.image = await localize(content.profile.image)
  for (const e of content.entries) {
    e.image = await localize(e.image)
    e.body_md = await replaceAsync(e.body_md || '', MD_IMAGE, async (_m, open, url) => open + (await localize(url)))
  }

  // CV: keep a stable public URL at /cv.pdf
  let cvUrl = content.cv?.url ? await localize(content.cv.url) : ''
  if (cvUrl.startsWith('/media/') || cvUrl.startsWith('/uploads/')) {
    await copyFile(path.join(root, 'public', cvUrl), path.join(root, 'public/cv.pdf'))
    cvUrl = '/cv.pdf'
  }
  content.cv = cvUrl ? { url: cvUrl } : null

  // Codeforces rating (falls back to the previous build's value)
  let previous = {}
  try { previous = JSON.parse(await readFile(DATA_FILE, 'utf8')) } catch {}
  const cf = (await codeforces(content.profile.codeforces)) || previous.stats?.cf || null
  content.stats = { cf }

  // Image dimensions, so the pages never shift while loading
  content.media = {}
  try {
    const sharp = (await import('sharp')).default
    for (const local of new Set([...cache.values()].filter((v) => v.startsWith('/media/') || v.startsWith('/uploads/')))) {
      try {
        const meta = await sharp(path.join(root, 'public', local)).metadata()
        if (meta.width && meta.height) content.media[local] = { w: meta.width, h: meta.height }
      } catch {}
    }
  } catch {
    console.warn('[content] sharp unavailable, skipping image dimensions')
  }

  content.generatedAt = new Date().toISOString()
  await mkdir(path.dirname(DATA_FILE), { recursive: true })
  await writeFile(DATA_FILE, JSON.stringify(content, null, 2))
  console.log(`[content] ${content.entries.length} entries, ${Object.keys(content.media).length} images`)
}

main().catch((err) => {
  console.error('[content] failed:', err)
  process.exit(1)
})
