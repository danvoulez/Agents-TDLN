'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

interface FileViewerProps { jobId: string; initialPath?: string }

function guessLanguage(path: string) {
  if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript'
  if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript'
  if (path.endsWith('.json')) return 'json'
  if (path.endsWith('.md')) return 'markdown'
  if (path.endsWith('.css')) return 'css'
  if (path.endsWith('.html')) return 'html'
  return 'plaintext'
}

export function FileViewer({ jobId, initialPath = '/README.md' }: FileViewerProps) {
  const [path, setPath] = useState(initialPath)
  const [content, setContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  const loadFile = async () => {
    if (!jobId) return
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ path })
      const res = await fetch(`/api/jobs/${jobId}/files?${params.toString()}`)
      if (!res.ok) throw new Error(`Erro ao carregar arquivo (${res.status})`)
      const data = await res.json()
      setContent(data.content ?? '')
      setHasLoadedOnce(true)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Falha ao carregar arquivo do worker')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium">File viewer</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Input value={path} onChange={(e) => setPath(e.target.value)} placeholder="/src/app.tsx" className="h-8 text-xs" />
          <Button size="sm" onClick={loadFile} disabled={isLoading}>{isLoading ? 'Carregando...' : 'Carregar'}</Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 h-full flex flex-col min-h-0">
        {!hasLoadedOnce && <p className="text-xs text-muted-foreground mb-2">Informe um caminho e clique em "Carregar".</p>}
        <div className="flex-1 min-h-[240px] border rounded-md overflow-hidden">
          <MonacoEditor path={path} height="100%" defaultLanguage={guessLanguage(path)} language={guessLanguage(path)} value={content} onChange={() => {}} options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12, scrollBeyondLastLine: false, wordWrap: 'on' }} />
        </div>
      </CardContent>
    </Card>
  )
}
