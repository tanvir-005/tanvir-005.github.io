import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeShiki from '@shikijs/rehype'
import rehypeStringify from 'rehype-stringify'
import { dims } from './content'

export interface TocItem { depth: number; text: string; id: string }

// Lazy loading and intrinsic size on every image so pages never jump while loading.
function imageDefaults() {
  return (tree: any) => {
    const walk = (node: any) => {
      if (node.type === 'element' && node.tagName === 'img') {
        const d = dims(String(node.properties?.src ?? ''))
        node.properties = { ...node.properties, loading: 'lazy', decoding: 'async', ...(d ? { width: d.w, height: d.h } : {}) }
      }
      node.children?.forEach(walk)
    }
    walk(tree)
  }
}

// Collects h2/h3 headings (after rehype-slug has given them ids) for the table of contents.
function collectToc() {
  return (tree: any, file: any) => {
    const items: TocItem[] = []
    const text = (n: any): string => (n.type === 'text' ? n.value : (n.children || []).map(text).join(''))
    const walk = (n: any) => {
      if (n.type === 'element' && (n.tagName === 'h2' || n.tagName === 'h3') && n.properties?.id) {
        items.push({ depth: Number(n.tagName[1]), text: text(n), id: String(n.properties.id) })
      }
      n.children?.forEach(walk)
    }
    walk(tree)
    file.data.toc = items
  }
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(collectToc)
  .use(rehypeShiki, { themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false, fallbackLanguage: 'text' } as any)
  .use(imageDefaults)
  .use(rehypeStringify)

export async function renderMarkdown(md: string): Promise<{ html: string; toc: TocItem[] }> {
  if (!md?.trim()) return { html: '', toc: [] }
  const file = await processor.process(md)
  return { html: String(file), toc: ((file.data as any).toc ?? []) as TocItem[] }
}

export const readingMinutes = (md: string) => Math.max(1, Math.round((md || '').split(/\s+/).filter(Boolean).length / 220))
