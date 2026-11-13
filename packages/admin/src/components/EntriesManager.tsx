import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { api, type Entry } from '@/lib/api'
import { ENTRY_TYPES } from '@/lib/entryTypes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EntryForm, type EntryPayload } from './EntryForm'

export function EntriesManager({ type }: { type: string }) {
  const config = ENTRY_TYPES[type]
  const qc = useQueryClient()
  const key = ['entries', type]
  const [editing, setEditing] = useState<Entry | 'new' | null>(null)

  const list = useQuery({ queryKey: key, queryFn: () => api.get<Entry[]>(`/api/admin/entries?type=${type}`) })
  const refresh = () => qc.invalidateQueries({ queryKey: key })
  const fail = (e: Error) => toast.error(e.message)

  const save = useMutation({
    mutationFn: (p: EntryPayload & { type: string }) => (editing && editing !== 'new' ? api.put(`/api/admin/entries/${editing.id}`, p) : api.post('/api/admin/entries', p)),
    onSuccess: () => { toast.success('Saved'); setEditing(null); refresh() },
    onError: fail
  })
  const remove = useMutation({ mutationFn: (id: number) => api.del(`/api/admin/entries/${id}`), onSuccess: () => { toast.success('Deleted'); refresh() }, onError: fail })
  const move = useMutation({ mutationFn: (v: { id: number; dir: 'up' | 'down' }) => api.post(`/api/admin/entries/${v.id}/move`, { dir: v.dir }), onSuccess: refresh, onError: fail })
  const toggle = useMutation({
    mutationFn: (e: Entry) => api.put(`/api/admin/entries/${e.id}`, { ...e, published: !e.published }),
    onSuccess: refresh,
    onError: fail
  })

  const rows = list.data ?? []

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{config.label}</h1>
          <p className="text-sm text-muted-foreground">Changes go live after you select Publish site.</p>
        </div>
        <Button onClick={() => setEditing('new')}><Plus /> New {config.singular}</Button>
      </div>

      <Card className="py-2">
        <CardContent className="px-2">
          {list.isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading</p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Nothing here yet. Add your first {config.singular}.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((e, i) => (
                  <TableRow key={e.id}>
                    <TableCell className="max-w-[22rem]">
                      <div className="truncate font-medium">{e.title}</div>
                      <div className="truncate text-xs text-muted-foreground">/{e.slug}</div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{e.date || ''}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={e.published} onCheckedChange={() => toggle.mutate(e)} aria-label={`Publish ${e.title}`} />
                        {!e.published && <Badge variant="secondary">Draft</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => move.mutate({ id: e.id, dir: 'up' })} aria-label="Move up"><ArrowUp /></Button>
                        <Button size="icon" variant="ghost" disabled={i === rows.length - 1} onClick={() => move.mutate({ id: e.id, dir: 'down' })} aria-label="Move down"><ArrowDown /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditing(e)} aria-label={`Edit ${e.title}`}><Pencil /></Button>
                        <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Delete "${e.title}"? This cannot be undone.`)) remove.mutate(e.id) }} aria-label={`Delete ${e.title}`}><Trash2 /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? `New ${config.singular}` : `Edit ${config.singular}`}</DialogTitle>
            <DialogDescription>Fields marked in the form are used on the public page and in search results.</DialogDescription>
          </DialogHeader>
          {editing !== null && (
            <EntryForm
              key={editing === 'new' ? 'new' : editing.id}
              type={type}
              config={config}
              entry={editing === 'new' ? undefined : editing}
              onSubmit={(p) => save.mutateAsync(p).catch(() => {})}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
