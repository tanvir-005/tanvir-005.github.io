import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ImageField } from './ImageField'
import { MarkdownEditor } from './MarkdownEditor'
import { TagsInput } from './TagsInput'
import type { Entry } from '@/lib/api'
import type { TypeConfig } from '@/lib/entryTypes'

const schema = z
  .object({
    title: z.string().trim().min(1, 'Add a title'),
    slug: z.string().regex(/^[a-z0-9-]*$/, 'Use lowercase letters, numbers and dashes'),
    date: z.string(),
    summary: z.string(),
    image: z.string(),
    imageAlt: z.string(),
    body_md: z.string(),
    published: z.boolean(),
    data: z.record(z.any())
  })
  .refine((v) => !v.image || v.imageAlt.trim().length > 0, { path: ['imageAlt'], message: 'Describe the image for search engines and screen readers' })

type Values = z.infer<typeof schema>
export type EntryPayload = Omit<Values, 'imageAlt'>

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function EntryForm({ type, config, entry, onSubmit, onCancel }: { type: string; config: TypeConfig; entry?: Entry; onSubmit: (p: EntryPayload & { type: string }) => Promise<void>; onCancel: () => void }) {
  const { imageAlt: _alt, ...restData } = entry?.data ?? {}
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: entry?.title ?? '',
      slug: entry?.slug ?? '',
      date: entry?.date ?? '',
      summary: entry?.summary ?? '',
      image: entry?.image ?? '',
      imageAlt: entry?.data?.imageAlt ?? '',
      body_md: entry?.body_md ?? '',
      published: entry?.published ?? true,
      data: restData
    }
  })
  const { register, control, handleSubmit, watch, formState } = form
  const { errors, isSubmitting } = formState
  const summaryLen = watch('summary').length
  const image = watch('image')

  const submit = handleSubmit(async (v) => {
    const { imageAlt, ...rest } = v
    await onSubmit({ ...rest, type, data: { ...v.data, ...(v.image ? { imageAlt } : {}) } })
  })

  return (
    <form onSubmit={submit} className="grid gap-5">
      <Field label="Title" error={errors.title?.message}>
        <Input {...register('title')} aria-invalid={!!errors.title} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Page address" hint="Leave empty to create it from the title." error={errors.slug?.message}>
          <Input {...register('slug')} placeholder="auto-from-title" />
        </Field>
        {config.dateHint && (
          <Field label="Date" hint={config.dateHint}>
            <Input {...register('date')} />
          </Field>
        )}
      </div>

      {config.fields.map((f) => (
        <Field key={f.key} label={f.label}>
          <Controller
            control={control}
            name={`data.${f.key}`}
            render={({ field }) =>
              f.kind === 'tags' ? (
                <TagsInput value={field.value ?? []} onChange={field.onChange} placeholder={f.placeholder} />
              ) : (
                <Input value={field.value ?? ''} onChange={field.onChange} placeholder={f.placeholder} type={f.kind === 'url' ? 'url' : 'text'} />
              )
            }
          />
        </Field>
      ))}

      {config.markdown && (
        <Field label="Description" hint={`Shown on the page and used as the search-result snippet. ${summaryLen}/160 characters.`}>
          <Textarea {...register('summary')} rows={3} />
        </Field>
      )}

      {config.hasImage && (
        <>
          <Field label="Image">
            <Controller control={control} name="image" render={({ field }) => <ImageField value={field.value} onChange={field.onChange} />} />
          </Field>
          {image && (
            <Field label="Image description (alt text)" error={errors.imageAlt?.message}>
              <Input {...register('imageAlt')} aria-invalid={!!errors.imageAlt} />
            </Field>
          )}
        </>
      )}

      {config.markdown && (
        <Field label="Content (Markdown)">
          <Controller control={control} name="body_md" render={({ field }) => <MarkdownEditor value={field.value} onChange={field.onChange} />} />
        </Field>
      )}

      <div className="flex items-center justify-between gap-4 border-t pt-4">
        <Controller
          control={control}
          name="published"
          render={({ field }) => (
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={field.value} onCheckedChange={field.onChange} /> Published
            </label>
          )}
        />
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving' : 'Save'}</Button>
        </div>
      </div>
    </form>
  )
}
