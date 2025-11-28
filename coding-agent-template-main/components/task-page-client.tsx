'use client'

import { useState } from 'react'
import { useTask } from '@/lib/hooks/use-task'
import { TaskPageHeader } from '@/components/task-page-header'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { useTasks } from '@/components/app-layout'
import { VERCEL_DEPLOY_URL } from '@/lib/constants'
import { User } from '@/components/auth/user'
import type { Session } from '@/lib/session/types'
import { GitHubStarsButton } from '@/components/github-stars-button'
import { useJobEvents } from '@/lib/hooks/use-job-events'
import { LiveLedger } from '@/components/live-ledger'
import { AgentPipeline } from '@/components/agent-pipeline'
import { FileViewer } from '@/components/file-viewer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface TaskPageClientProps {
  taskId: string
  user: Session['user'] | null
  authProvider: Session['authProvider'] | null
  maxSandboxDuration: number
  initialStars: number
}

export function TaskPageClient({ taskId, user, authProvider, maxSandboxDuration, initialStars }: TaskPageClientProps) {
  const { task, isLoading, error } = useTask(taskId)
  const { toggleSidebar } = useTasks()

  if (isLoading) {
    return (
      <div className="flex-1 bg-background">
        <div className="p-3">
          <PageHeader
            showMobileMenu={true}
            onToggleMobileMenu={toggleSidebar}
            actions={
              <div className="flex items-center gap-2 h-8">
                <GitHubStarsButton initialStars={initialStars} />
                <Button asChild size="sm" variant="outline"><a href={VERCEL_DEPLOY_URL} target="_blank" rel="noreferrer">Deploy to Vercel</a></Button>
                <User />
              </div>
            }
          />
        </div>
        <div className="p-6 text-sm text-muted-foreground">Carregando tarefa...</div>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="flex-1 bg-background">
        <div className="p-3">
          <PageHeader
            showMobileMenu={true}
            onToggleMobileMenu={toggleSidebar}
            actions={
              <div className="flex items-center gap-2 h-8">
                <GitHubStarsButton initialStars={initialStars} />
                <Button asChild size="sm" variant="outline"><a href={VERCEL_DEPLOY_URL} target="_blank" rel="noreferrer">Deploy to Vercel</a></Button>
                <User />
              </div>
            }
          />
        </div>
        <div className="p-6 text-sm text-destructive">Falha ao carregar tarefa. {error ? `Detalhes: ${error}` : null}</div>
      </div>
    )
  }

  const jobId = (task as any).jobId ?? (task as any).job_id ?? null
  const { events } = useJobEvents(jobId)

  const prUrl = events.map((e) => e.result?.pr_url || e.result?.prUrl || e.result?.url).filter(Boolean).at(-1) as string | null

  async function handleStop() {
    if (!jobId) return
    try {
      const res = await fetch(`/api/jobs/${jobId}/stop`, { method: 'POST' })
      if (!res.ok) throw new Error('Falha ao cancelar job')
      toast.success('Job cancelado')
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao cancelar job')
    }
  }

  async function handleApprove() {
    if (!jobId) return
    try {
      const res = await fetch(`/api/jobs/${jobId}/approve`, { method: 'POST' })
      if (!res.ok) throw new Error('Falha ao aprovar job')
      toast.success('Job aprovado')
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao aprovar job')
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-background min-h-0">
      <div className="p-3 border-b">
        <PageHeader
          showMobileMenu={true}
          onToggleMobileMenu={toggleSidebar}
          actions={
            <div className="flex items-center gap-2 h-8">
              <GitHubStarsButton initialStars={initialStars} />
              <Button asChild size="sm" variant="outline"><a href={VERCEL_DEPLOY_URL} target="_blank" rel="noreferrer">Deploy to Vercel</a></Button>
              <User />
            </div>
          }
        />
      </div>

      <div className="flex-shrink-0 p-3 border-b">
        <TaskPageHeader task={task} user={user} authProvider={authProvider} initialStars={initialStars} />
      </div>

      <div className="flex-1 flex flex-col min-h-0 p-3 gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[11px]">Status: {(task as any).status ?? 'unknown'}</Badge>
            {jobId && <Badge variant="secondary" className="text-[11px]">Job: {jobId}</Badge>}
          </div>
          <div className="flex items-center gap-2">
            {prUrl && <Button size="sm" variant="outline" asChild><a href={prUrl} target="_blank" rel="noreferrer">Ver Pull Request</a></Button>}
            <Button size="sm" variant="outline" disabled={!jobId} onClick={handleStop}>Stop</Button>
            <Button size="sm" disabled={!jobId} onClick={handleApprove}>Approve</Button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 gap-3 flex-col lg:flex-row">
          <div className="lg:w-1/2 flex flex-col min-h-0"><LiveLedger events={events as any} /></div>
          <div className="lg:w-1/2 flex flex-col min-h-0">
            <Tabs defaultValue="pipeline" className="flex flex-1 flex-col min-h-0">
              <TabsList className="w-fit mb-2">
                <TabsTrigger value="pipeline" className="text-xs">Pipeline</TabsTrigger>
                <TabsTrigger value="files" className="text-xs">File viewer</TabsTrigger>
              </TabsList>
              <TabsContent value="pipeline" className="flex-1 min-h-0"><AgentPipeline events={events as any} /></TabsContent>
              <TabsContent value="files" className="flex-1 min-h-0">{jobId ? <FileViewer jobId={jobId} /> : <p className="text-xs text-muted-foreground mt-2">Nenhum <code>jobId</code> associado a esta tarefa ainda.</p>}</TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
