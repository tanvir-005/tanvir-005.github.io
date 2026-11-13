import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { ImagePlus, Trash2 } from 'lucide-react'
import { api, mediaUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function pick(file?: File) {
    if (!file) return
    setBusy(true)
    try {
      const res = await api.upload(file)
      onChange(res.url)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
      if (ref.current) ref.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {value && <img src={mediaUrl(value)} alt="" className="max-h-48 w-fit rounded-md border object-contain" />}
      <div className="flex flex-wrap items-center gap-2">
        <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => ref.current?.click()}>
          <ImagePlus /> {busy ? 'Uploading' : value ? 'Replace image' : 'Upload image'}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
            <Trash2 /> Remove
          </Button>
        )}
      </div>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Or paste an image URL" />
    </div>
  )
}
