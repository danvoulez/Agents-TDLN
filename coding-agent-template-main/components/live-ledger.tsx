'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, Eye, FlaskConical, TerminalSquare, Info } from 'lucide-react'

export type JobEvent = {
  id?: string
  type?: string
  kind?: string
  agent_type?: string | null
  tool_name?: string | null
  message?: string | null
  summary?: string | null
  created_at?: string | null
  timestamp?: string | null
  params?: any
  result?: any
}

interface LiveLedgerProps { events: JobEvent[] }

function formatTime(ts?: string | null) {
  if (!ts) return ''
  const date = new Date(ts)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function getIcon(e: JobEvent) {
  if (e.kind === 'error' || e.type === 'error') return <AlertCircle className="h-4 w-4 text-destructive" />
  if (e.kind === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  if (e.kind === 'tool_call') {
    if (e.tool_name?.includes('read_file')) return <Eye className="h-4 w-4 text-primary" />
    if (e.tool_name?.includes('test')) return <FlaskConical className="h-4 w-4 text-primary" />
    return <TerminalSquare className="h-4 w-4 text-primary" />
  }
  return <Info className="h-4 w-4 text-muted-foreground" />
}

function getLabel(e: JobEvent) {
  if (e.kind === 'tool_call') return e.tool_name ?? 'Tool call'
  if (e.kind === 'error') return 'Error'
  if (e.kind === 'success') return 'Success'
  if (e.kind === 'log') return 'Log'
  if (e.kind) return e.kind
  return e.type ?? 'event'
}

export function LiveLedger({ events }: LiveLedgerProps) {
  const hasEvents = events && events.length > 0
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Live ledger</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 h-full flex flex-col min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2 text-xs">
          {!hasEvents && <p className="text-muted-foreground text-xs mt-2">Nenhum evento ainda. Quando o job começar a rodar, o pipeline aparece aqui em tempo real.</p>}
          {events.map((e, idx) => {
            const key = e.id ?? `${idx}-${e.kind}-${e.tool_name}`
            const time = formatTime(e.created_at ?? e.timestamp ?? null)
            const label = getLabel(e)
            const summary = e.summary ?? e.message ?? ''
            return (
              <div key={key} className="flex items-start gap-2">
                <div className="mt-[2px]">{getIcon(e)}</div>
                <div className="flex-1 space-y-0.5 border-l pl-2 border-border/60">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{label}</span>
                      {e.agent_type && <Badge variant="outline" className="text-[10px] uppercase tracking-wide">{e.agent_type}</Badge>}
                    </div>
                    {time && <span className="text-[10px] text-muted-foreground">{time}</span>}
                  </div>
                  {summary && <p className="text-[11px] text-muted-foreground">{summary}</p>}
                  {e.result?.pr_url && <a href={e.result.pr_url} target="_blank" rel="noreferrer" className="text-[11px] underline">Abrir PR</a>}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
