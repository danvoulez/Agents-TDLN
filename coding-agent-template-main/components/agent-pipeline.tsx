'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, CircleDot, Circle } from 'lucide-react'

type AgentStage = 'coordinator' | 'planner' | 'builder' | 'reviewer'
const AGENT_ORDER: AgentStage[] = ['coordinator', 'planner', 'builder', 'reviewer']
const LABELS: Record<AgentStage, string> = {
  coordinator: 'Coordinator',
  planner: 'Planner',
  builder: 'Builder',
  reviewer: 'Reviewer',
}

export type PipelineEvent = { agent_type?: string | null }
interface AgentPipelineProps { events: PipelineEvent[] }

export function AgentPipeline({ events }: AgentPipelineProps) {
  let lastIndex = -1
  for (let i = events.length - 1; i >= 0; i--) {
    const raw = events[i]?.agent_type as AgentStage | undefined
    if (!raw) continue
    const idx = AGENT_ORDER.indexOf(raw)
    if (idx !== -1) { lastIndex = idx; break }
  }
  const hasActivity = events.length > 0

  const getStatus = (stage: AgentStage) => {
    const idx = AGENT_ORDER.indexOf(stage)
    if (!hasActivity) return 'pending' as const
    if (lastIndex === -1) return idx === 0 ? 'active' : 'pending'
    if (lastIndex > idx) return 'done' as const
    if (lastIndex === idx) return 'active' as const
    return 'pending' as const
  }

  const renderIcon = (status: 'done' | 'active' | 'pending') => {
    if (status === 'done') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    if (status === 'active') return <CircleDot className="h-4 w-4 text-primary" />
    return <Circle className="h-4 w-4 text-muted-foreground" />
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Agent pipeline</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-3 flex-1">
            {AGENT_ORDER.map((stage, idx) => {
              const status = getStatus(stage)
              return (
                <div key={stage} className="flex items-center gap-3">
                  <div>{renderIcon(status)}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{LABELS[stage]}</span>
                    <Badge variant={status === 'pending' ? 'outline' : 'secondary'} className="text-[10px] uppercase tracking-wide">
                      {status}
                    </Badge>
                  </div>
                  {idx < AGENT_ORDER.length - 1 && <div className="flex-1 h-px bg-border/70 ml-2 hidden lg:block" />}
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
