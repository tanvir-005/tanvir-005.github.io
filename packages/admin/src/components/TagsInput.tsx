import { useState } from 'react'
import { Input } from '@/components/ui/input'

export function TagsInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [raw, setRaw] = useState((value || []).join(', '))
  return (
    <Input
      value={raw}
      placeholder={placeholder}
      onChange={(e) => {
        setRaw(e.target.value)
        onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))
      }}
    />
  )
}
