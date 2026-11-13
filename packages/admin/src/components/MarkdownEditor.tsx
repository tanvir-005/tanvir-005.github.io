import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { ImagePlus } from 'lucide-react'
import { api, mediaUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function MarkdownEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const area = useRef<HTMLTextAreaElement>(null)
  const file = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function insertImage(f?: File) {
    if (!f) return
    setBusy(true)
    try {
      const { url } = await api.upload(f)
      const at = area.current?.selectionStart ?? value.length
      const snippet = `\n\n![Describe this image](${url})\n\n`
      onChange(value.slice(0, at) + snippet + value.slice(at))
      toast.success('Image added. Replace "Describe this image" with real alt text.')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
      if (file.current) file.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <input ref={file} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" className="hidden" onChange={(e) => insertImage(e.target.files?.[0])} />
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => file.current?.click()}>
          <ImagePlus /> {busy ? 'Uploading' : 'Insert image'}
        </Button>
        <span className="text-xs text-muted-foreground">Markdown with GitHub tables and code blocks</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Textarea ref={area} value={value} onChange={(e) => onChange(e.target.value)} className="min-h-[22rem] font-mono text-sm" spellCheck />
        <div className="md-preview min-h-[22rem] overflow-auto rounded-md border p-4">
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ img: ({ src, alt }) => <img src={mediaUrl(String(src ?? ''))} alt={alt ?? ''} /> }}>
              {value}
            </ReactMarkdown>
          ) : (
            <p className="text-muted-foreground">The preview appears here.</p>
          )}
        </div>
      </div>
    </div>
  )
}
