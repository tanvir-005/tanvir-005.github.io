import raw from '../data/content.json'

export interface Entry {
  type: string
  slug: string
  title: string
  summary: string
  body_md: string
  image: string
  date: string
  sort: number
  updated_at?: string
  data: Record<string, any>
}

export const profile = raw.profile as Record<string, any>
export const cv = (raw.cv ?? null) as { url: string } | null
export const cf = ((raw.stats as any)?.cf ?? null) as { rating: number; maxRating: number; rank: string; maxRank: string } | null
export const entries = raw.entries as Entry[]
const media = ((raw as any).media ?? {}) as Record<string, { w: number; h: number }>

export const dims = (src: string) => media[src]
export const byType = (type: string) => entries.filter((e) => e.type === type).sort((a, b) => a.sort - b.sort)
export const posts = byType('post').sort((a, b) => b.date.localeCompare(a.date))

export const COLLECTIONS: Record<string, { type: string; title: string; singular: string; lead: string }> = {
  projects: { type: 'project', title: 'Projects', singular: 'Project', lead: 'Software and machine learning projects, with what each one does and how it was built.' },
  contests: { type: 'contest', title: 'Contests', singular: 'Contest', lead: 'Programming contests I have taken part in, newest first.' },
  certificates: { type: 'certificate', title: 'Training and certificates', singular: 'Certificate', lead: 'Courses and camps I have completed.' },
  experience: { type: 'experience', title: 'Leadership and mentoring', singular: 'Role', lead: 'Teaching, mentoring and club responsibilities.' }
}

export const hasDetail = (e: Entry) => !!(e.body_md?.trim() || e.summary?.trim())
export const hrefFor = (collection: string, e: Entry) => (hasDetail(e) ? `/${collection}/${e.slug}/` : null)
export const truncate = (s: string, n = 158) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…')
export const imageAlt = (e: Entry) => e.data.imageAlt || e.title

export function metaFor(e: Entry): { label: string; value: string }[] {
  const d = e.data
  const rows: [string, string | undefined][] = []
  switch (e.type) {
    case 'contest':
      rows.push(['Result', d.rank ? `${d.rank}${d.note ? ' ' + d.note : ''}` : ''], ['Team', d.team], ['Date', e.date])
      break
    case 'project':
      rows.push(['Built with', (d.stack || []).join(', ')], ['Date', e.date])
      break
    case 'certificate':
      rows.push(['Organizer', d.organizer], ['Period', e.date])
      break
    case 'experience':
      rows.push(['Organization', d.organization], ['Period', e.date])
      break
  }
  return rows.filter(([, v]) => v).map(([label, value]) => ({ label, value: value as string }))
}

export function linksFor(e: Entry): { label: string; href: string }[] {
  const d = e.data
  const out: { label: string; href: string }[] = []
  if (e.type === 'contest' && d.link) out.push({ label: 'View standings', href: d.link })
  if (e.type === 'project') {
    if (d.github) out.push({ label: 'View on GitHub', href: d.github })
    if (d.live) out.push({ label: 'Open live demo', href: d.live })
  }
  if (e.type === 'experience' && d.link) out.push({ label: 'Related work', href: d.link })
  if (e.type === 'achievement' && d.link) out.push({ label: 'See standings', href: d.link })
  return out
}

export function formatDate(s: string) {
  const d = new Date(s)
  if (!/^\d{4}-\d{2}-\d{2}/.test(s) || isNaN(d.getTime())) return s
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

export const tagsOf = (e: Entry): string[] => (Array.isArray(e.data.tags) ? e.data.tags : [])
export const tagSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
export const allTags = () => {
  const map = new Map<string, { label: string; count: number }>()
  for (const p of posts) for (const t of tagsOf(p)) {
    const k = tagSlug(t)
    map.set(k, { label: t, count: (map.get(k)?.count ?? 0) + 1 })
  }
  return map
}

/* ---- scoreboard helpers ---- */
export const rankNumber = (r: unknown): number | null => {
  const m = String(r ?? '').match(/\d+/)
  return m ? parseInt(m[0], 10) : null
}
export const tierOf = (n: number | null) => (n == null ? 5 : n <= 10 ? 1 : n <= 25 ? 2 : n <= 50 ? 3 : n <= 100 ? 4 : 5)
export const TIERS = [
  { t: 1, label: 'Top 10' },
  { t: 2, label: '11 to 25' },
  { t: 3, label: '26 to 50' },
  { t: 4, label: '51 to 100' },
  { t: 5, label: 'Beyond 100' }
]
export const rankParts = (r: unknown) => {
  const m = String(r ?? '').match(/^(\d+)(\D*)$/)
  return m ? { n: m[1], s: m[2] } : { n: String(r ?? ''), s: '' }
}
export const shortDate = (s: string) => s.replace(/^([A-Za-z]{3})[A-Za-z]*,?\s*(\d{4})$/, '$1 $2')
