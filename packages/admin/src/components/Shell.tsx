import { useState } from 'react'
import { toast } from 'sonner'
import { Award, Briefcase, FileText, FolderGit2, GraduationCap, LayoutDashboard, LogOut, Moon, Rocket, Settings, Sun, Trophy, User, Wrench, Star } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dashboard } from './Dashboard'
import { EntriesManager } from './EntriesManager'
import { ProfilePage } from './ProfilePage'
import { SettingsPage } from './SettingsPage'

const NAV = [
  { id: 'dashboard', label: 'Visits', icon: LayoutDashboard },
  { id: 'profile', label: 'Profile and CV', icon: User },
  { id: 'post', label: 'Posts', icon: FileText },
  { id: 'project', label: 'Projects', icon: FolderGit2 },
  { id: 'contest', label: 'Contests', icon: Trophy },
  { id: 'achievement', label: 'Achievements', icon: Star },
  { id: 'certificate', label: 'Certificates', icon: Award },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'experience', label: 'Leadership', icon: Briefcase },
  { id: 'skillgroup', label: 'Skills', icon: Wrench },
  { id: 'settings', label: 'Settings', icon: Settings }
]

export function Shell({ onSignOut, dark, onToggleTheme }: { onSignOut: () => void; dark: boolean; onToggleTheme: () => void }) {
  const [view, setView] = useState('dashboard')
  const [publishing, setPublishing] = useState(false)

  async function publish() {
    setPublishing(true)
    try {
      await api.post('/api/admin/publish')
      toast.success('Publish started. The site updates in about a minute.')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col border-b bg-card md:w-60 md:border-r md:border-b-0">
        <div className="hidden px-5 py-4 font-semibold md:block">Portfolio admin</div>
        <nav className="flex gap-1 overflow-x-auto p-2 md:flex-col md:overflow-visible" aria-label="Admin">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              aria-current={view === n.id ? 'page' : undefined}
              className={cn('flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors hover:bg-accent', view === n.id && 'bg-accent font-medium')}
            >
              <n.icon className="size-4" /> {n.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-2 border-b px-4 py-3">
          <Button onClick={publish} disabled={publishing}><Rocket /> {publishing ? 'Publishing' : 'Publish site'}</Button>
          <Button variant="outline" size="icon" onClick={onToggleTheme} aria-label="Toggle theme">{dark ? <Sun /> : <Moon />}</Button>
          <Button variant="outline" size="icon" onClick={onSignOut} aria-label="Sign out"><LogOut /></Button>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">
          {view === 'dashboard' && <Dashboard />}
          {view === 'profile' && <ProfilePage />}
          {view === 'settings' && <SettingsPage />}
          {!['dashboard', 'profile', 'settings'].includes(view) && <EntriesManager key={view} type={view} />}
        </main>
      </div>
    </div>
  )
}
