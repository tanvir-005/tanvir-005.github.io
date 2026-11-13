import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FileText, Upload } from 'lucide-react'
import { api, mediaUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageField } from './ImageField'

type Profile = Record<string, string>
const FIELDS: { key: string; label: string; hint?: string; area?: boolean }[] = [
  { key: 'name', label: 'Full name' },
  { key: 'shortName', label: 'Short name', hint: 'Shown in the header and in page titles.' },
  { key: 'headline', label: 'Headline' },
  { key: 'description', label: 'Site description', hint: 'Used by search engines for the home page. Aim for 120 to 160 characters.', area: true },
  { key: 'bio', label: 'Introduction', area: true },
  { key: 'institution', label: 'Institution' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'github', label: 'GitHub URL' },
  { key: 'linkedin', label: 'LinkedIn URL' },
  { key: 'facebook', label: 'Facebook URL' },
  { key: 'codeforces', label: 'Codeforces handle', hint: 'The rating on the home page is fetched when the site is built.' },
  { key: 'footer', label: 'Footer line' }
]

export function ProfilePage() {
  const qc = useQueryClient()
  const profile = useQuery({ queryKey: ['setting', 'profile'], queryFn: () => api.get<Profile>('/api/admin/settings/profile') })
  const cv = useQuery({ queryKey: ['setting', 'cv'], queryFn: () => api.get<{ url: string } | null>('/api/admin/settings/cv') })
  const [form, setForm] = useState<Profile>({})
  const file = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { if (profile.data) setForm(profile.data) }, [profile.data])

  const save = useMutation({
    mutationFn: () => api.put('/api/admin/settings/profile', form),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['setting', 'profile'] }) },
    onError: (e: Error) => toast.error(e.message)
  })

  async function uploadCv(f?: File) {
    if (!f) return
    if (f.type !== 'application/pdf') return toast.error('The CV must be a PDF file.')
    setUploading(true)
    try {
      const { url } = await api.upload(f)
      await api.put('/api/admin/settings/cv', { url })
      toast.success('CV replaced')
      qc.invalidateQueries({ queryKey: ['setting', 'cv'] })
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setUploading(false)
      if (file.current) file.current.value = ''
    }
  }

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }))
  const cvHref = cv.data?.url ? mediaUrl(cv.data.url) : ''

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile and CV</h1>
        <p className="text-sm text-muted-foreground">Appears in the hero, contact section and search-result metadata.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CV</CardTitle>
          <CardDescription>The PDF served at /cv.pdf. Replace it any time and publish.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <input ref={file} type="file" accept="application/pdf" className="hidden" onChange={(e) => uploadCv(e.target.files?.[0])} />
          <Button variant="outline" disabled={uploading} onClick={() => file.current?.click()}><Upload /> {uploading ? 'Uploading' : 'Upload new CV'}</Button>
          {cvHref ? <a href={cvHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm underline"><FileText className="size-4" /> Current CV</a> : <span className="text-sm text-muted-foreground">No CV uploaded.</span>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Portrait</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <ImageField value={form.image ?? ''} onChange={set('image')} />
          <div className="grid gap-2">
            <Label>Portrait description (alt text)</Label>
            <Input value={form.imageAlt ?? ''} onChange={(e) => set('imageAlt')(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key} className={`grid gap-2 ${f.area ? 'sm:col-span-2' : ''}`}>
              <Label>{f.label}</Label>
              {f.area ? <Textarea rows={3} value={form[f.key] ?? ''} onChange={(e) => set(f.key)(e.target.value)} /> : <Input value={form[f.key] ?? ''} onChange={(e) => set(f.key)(e.target.value)} />}
              {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      <div><Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? 'Saving' : 'Save profile'}</Button></div>
    </div>
  )
}
