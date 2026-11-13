import { useEffect, useState } from 'react'
import { Toaster, toast } from 'sonner'
import { hasToken, setToken } from '@/lib/api'
import { MorseGate } from '@/components/MorseGate'
import { Shell } from '@/components/Shell'

export default function App() {
  const [authed, setAuthed] = useState(hasToken())
  const [dark, setDark] = useState(document.documentElement.classList.contains('dark'))

  useEffect(() => {
    const out = () => { setAuthed(false); toast('Your session ended. Enter the sequence again.') }
    window.addEventListener('admin-signed-out', out)
    return () => window.removeEventListener('admin-signed-out', out)
  }, [])

  function toggleTheme() {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('admin-theme', next ? 'dark' : 'light')
    setDark(next)
  }

  return (
    <>
      {authed ? (
        <Shell dark={dark} onToggleTheme={toggleTheme} onSignOut={() => { setToken(''); setAuthed(false) }} />
      ) : (
        <MorseGate
          onAuthed={(isDefault) => {
            setAuthed(true)
            if (isDefault) toast.warning('You are using the starting sequence. Change it in Settings.', { duration: 10000 })
          }}
        />
      )}
      <Toaster richColors position="bottom-right" theme={dark ? 'dark' : 'light'} />
    </>
  )
}
