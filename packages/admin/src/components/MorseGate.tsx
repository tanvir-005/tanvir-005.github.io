import { useEffect, useState } from 'react'
import { api, setToken, ApiError } from '@/lib/api'
import { MorsePad } from './MorsePad'

export function MorseGate({ onAuthed }: { onAuthed: (isDefault: boolean) => void }) {
  const [cfg, setCfg] = useState({ dotMaxMs: 300, idleMs: 2000 })
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.get<{ dotMaxMs: number; idleMs: number }>('/api/morse-config').then(setCfg).catch(() => {})
  }, [])

  async function submit(sequence: string) {
    if (!sequence || busy) return
    setBusy(true)
    setMessage('')
    try {
      const res = await api.post<{ token: string; isDefault: boolean }>('/api/auth/morse', { sequence })
      setToken(res.token)
      onAuthed(res.isDefault)
    } catch (err) {
      const e = err as ApiError
      setMessage(e.status === 429 ? `Too many attempts. Try again in ${Math.ceil((e.body?.retryAfter ?? 900) / 60)} min.` : e.status === 401 ? 'That sequence is not right.' : 'Could not reach the server.')
      setShake(true)
      setTimeout(() => setShake(false), 400)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <MorsePad dotMax={cfg.dotMaxMs} idle={cfg.idleMs} onSubmit={submit} disabled={busy} shake={shake} />
      <p className="h-5 text-sm text-muted-foreground" role="alert">{message}</p>
    </main>
  )
}
