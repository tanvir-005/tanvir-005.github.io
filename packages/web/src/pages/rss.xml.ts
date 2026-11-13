import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { posts, profile } from '../lib/content'

export function GET(context: APIContext) {
  return rss({
    title: `${profile.name}: blog`,
    description: 'Notes on competitive programming, algorithms, software and machine learning.',
    site: context.site!,
    items: posts.map((p) => ({
      title: p.title,
      description: p.summary,
      pubDate: new Date(p.date),
      link: `/blog/${p.slug}/`
    }))
  })
}
