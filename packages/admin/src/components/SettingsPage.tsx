import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MorsePad } from './MorsePad'

type Cfg = { dotMaxMs: number; idleMs: number }
type Step = 'current' | 'new' | 'confirm'
const STEP_TEXT: Record<Step, string> = {
  current: 'Enter your current sequence',
  new: 'Enter the new sequence (at least 3 symbols)',
  confirm: 'Enter the new sequence again'
}

function ChangeSequence({ cfg }: { cfg: Cfg }) {
  const [step, setStep] = useState<Step>('current')
  const current = useRef('')
  const next = useRef('')

  async function submit(seq: string) {
    if (!seq) return
    if (step === 'current') { current.current = seq; setStep('new'); return }
    if (step === 'new') {
      if (seq.length < 3) return toast.error('Use at least 3 symbols.')
      next.current = seq
      setStep('confirm')
      return
    }
    if (seq !== next.current) { toast.error('The two entries differ. Start again.'); next.current = ''; setStep('new'); return }
    try {
      await api.put('/api/admin/morse', { current: current.current, next: next.current })
      toast.success('Sequence changed')
    } catch (e) {
      toast.error((e as Error).message)
    }
    current.current = ''
    next.current = ''
    setStep('current')
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-medium">{STEP_TEXT[step]}</p>
      <MorsePad dotMax={cfg.dotMaxMs} idle={cfg.idleMs} onSubmit={submit} />
    </div>
  )
}

export function SettingsPage() {
  const cfgQ = useQuery({ queryKey: ['morse-config'], queryFn: () => api.get<Cfg>('/api/morse-config') })
  const [cfg, setCfg] = useState<Cfg>({ dotMaxMs: 300, idleMs: 2000 })
  useEffect(() => { if (cfgQ.data) setCfg(cfgQ.data) }, [cfgQ.data])

  const saveCfg = useMutation({
    mutationFn: () => api.put<Cfg>('/api/admin/morse-config', cfg),
    onSuccess: (v) => { setCfg(v); toast.success('Timing saved') },
    onError: (e: Error) => toast.error(e.message)
  })

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Admin access is a morse sequence. A longer sequence is harder to guess.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Change sequence</CardTitle>
          <CardDescription>Tap for a dot, hold for a dash. Enter the current one, then the new one twice.</CardDescription>
        </CardHeader>
        <CardContent className="py-4"><ChangeSequence cfg={cfg} /></CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key timing</CardTitle>
          <CardDescription>Adjust if holds or taps are misread.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Hold time for a dash (ms)</Label>
            <Input type="number" min={100} max={1000} value={cfg.dotMaxMs} onChange={(e) => setCfg({ ...cfg, dotMaxMs: Number(e.target.value) })} />
            <p className="text-xs text-muted-foreground">Presses shorter than this are dots.</p>
          </div>
          <div className="grid gap-2">
            <Label>Pause before submitting (ms)</Label>
            <Input type="number" min={800} max={5000} value={cfg.idleMs} onChange={(e) => setCfg({ ...cfg, idleMs: Number(e.target.value) })} />
            <p className="text-xs text-muted-foreground">The sequence is checked after this much silence.</p>
          </div>
          <div><Button onClick={() => saveCfg.mutate()} disabled={saveCfg.isPending}>Save timing</Button></div>
        </CardContent>
      </Card>
    </div>
  )
}
