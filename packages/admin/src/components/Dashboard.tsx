import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Stats {
  days: number
  daily: { day: string; views: number }[]
  pages: { path: string; views: number; uniques: number }[]
  referrers: { ref: string; hits: number }[]
  totals: { views: number; visitors: number; cvDownloads: number }
}

function fillDays(daily: Stats['daily'], days: number) {
  const map = new Map(daily.map((d) => [d.day, d.views]))
  const out: { day: string; views: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    out.push({ day, views: map.get(day) ?? 0 })
  }
  return out
}

export function Dashboard() {
  const [days, setDays] = useState('30')
  const { data, isLoading, error } = useQuery({ queryKey: ['stats', days], queryFn: () => api.get<Stats>(`/api/admin/stats?days=${days}`) })

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Visits</h1>
          <p className="text-sm text-muted-foreground">Page views are counted without cookies. Bots are filtered out.</p>
        </div>
        <Tabs value={days} onValueChange={setDays}>
          <TabsList>
            <TabsTrigger value="7">7 days</TabsTrigger>
            <TabsTrigger value="30">30 days</TabsTrigger>
            <TabsTrigger value="90">90 days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Page views', data?.totals.views],
          ['Visitors (daily unique)', data?.totals.visitors],
          ['CV downloads', data?.totals.cvDownloads]
        ].map(([label, value]) => (
          <Card key={label as string}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{isLoading ? '...' : (value as number | undefined) ?? 0}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Views per day</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data ? fillDays(data.daily, Number(days)) : []} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tickFormatter={(d: string) => d.slice(5)} tickLine={false} axisLine={false} minTickGap={24} fontSize={12} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="views" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.12} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Pages</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Path</TableHead><TableHead className="text-right">Views</TableHead><TableHead className="text-right">Visitors</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {(data?.pages ?? []).map((p) => (
                  <TableRow key={p.path}>
                    <TableCell className="max-w-[24rem] truncate font-mono text-xs">{p.path}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.views}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.uniques}</TableCell>
                  </TableRow>
                ))}
                {data && data.pages.length === 0 && <TableRow><TableCell colSpan={3} className="text-muted-foreground">No visits recorded in this period.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Referrers</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {(data?.referrers ?? []).map((r) => (
                  <TableRow key={r.ref}><TableCell className="truncate">{r.ref}</TableCell><TableCell className="text-right tabular-nums">{r.hits}</TableCell></TableRow>
                ))}
                {data && data.referrers.length === 0 && <TableRow><TableCell className="text-muted-foreground">No outside referrers yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
