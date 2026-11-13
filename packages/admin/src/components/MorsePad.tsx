import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  dotMax: number // press shorter than this (ms) is a dot, otherwise a dash
  idle: number // pause (ms) after the last release that submits the sequence
  onSubmit: (sequence: string) => void | Promise<void>
  disabled?: boolean
  shake?: boolean
  hint?: string
}

/** One button: tap for a dot, hold for a dash. The box above it shows what has been entered. */
export function MorsePad({ dotMax, idle, onSubmit, disabled, shake, hint }: Props) {
  const [seq, setSeq] = useState('')
  const [holding, setHolding] = useState(false)
  const [dash, setDash] = useState(false)
  const seqRef = useRef('')
  const downAt = useRef(0)
  const pressed = useRef(false)
  const idleTimer = useRef<ReturnType<typeof setTimeout>>()
  const dashTimer = useRef<ReturnType<typeof setTimeout>>()
  const submitRef = useRef(onSubmit)
  submitRef.current = onSubmit

  useEffect(() => () => { clearTimeout(idleTimer.current); clearTimeout(dashTimer.current) }, [])

  const start = () => {
    if (disabled || pressed.current) return
    pressed.current = true
    clearTimeout(idleTimer.current)
    downAt.current = performance.now()
    setHolding(true)
    setDash(false)
    dashTimer.current = setTimeout(() => setDash(true), dotMax)
  }

  const end = () => {
    if (!pressed.current) return
    pressed.current = false
    clearTimeout(dashTimer.current)
    setHolding(false)
    setDash(false)
    seqRef.current += performance.now() - downAt.current >= dotMax ? '-' : '.'
    setSeq(seqRef.current)
    idleTimer.current = setTimeout(async () => {
      const s = seqRef.current
      seqRef.current = ''
      setSeq('')
      await submitRef.current(s)
    }, idle)
  }

  const Symbol = ({ s, ghost }: { s: string; ghost?: boolean }) =>
    s === '.' ? (
      <span className={cn('inline-block size-3 rounded-full bg-foreground', ghost && 'opacity-30')} />
    ) : (
      <span className={cn('inline-block h-3 w-8 rounded-full bg-foreground', ghost && 'opacity-30')} />
    )

  return (
    <div className="flex flex-col items-center gap-8">
      <div
        role="status"
        aria-live="polite"
        className={cn('flex h-16 min-w-64 max-w-full flex-wrap items-center justify-center gap-2 rounded-xl border bg-card px-5 py-3', shake && 'shake')}
      >
        {seq.length === 0 && !holding && <span className="text-sm text-muted-foreground">{hint ?? 'Tap for a dot, hold for a dash'}</span>}
        {[...seq].map((s, i) => <Symbol key={i} s={s} />)}
        {holding && <Symbol s={dash ? '-' : '.'} ghost />}
      </div>

      <button
        type="button"
        disabled={disabled}
        aria-label="Morse key. Tap for a dot, hold for a dash."
        className={cn(
          'size-40 touch-none rounded-full border-2 border-foreground/80 bg-background transition-transform select-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-40',
          holding && 'scale-95 bg-foreground/10'
        )}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); start() }}
        onPointerUp={end}
        onPointerCancel={end}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start() } }}
        onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); end() } }}
      />
    </div>
  )
}
