'use client'

import { useState } from 'react'
import { ChatInterface } from '@/components/chat-interface'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Session } from '@/lib/session/types'

interface ChatPageClientProps {
  user: Session['user'] | null
  initialRepo: { installationId: number; repoFullName: string } | null
}

export function ChatPageClient({ user, initialRepo }: ChatPageClientProps) {
  const [selectedRepo, setSelectedRepo] = useState(initialRepo)
  const [showRepoDialog, setShowRepoDialog] = useState(false)

  const handleRepoSelect = () => {
    setShowRepoDialog(true)
  }

  return (
    <>
      <div className="h-screen flex flex-col">
        <ChatInterface user={user} initialRepo={selectedRepo} onRepoSelect={handleRepoSelect} />
      </div>

      {/* Repository Selection Dialog */}
      <Dialog open={showRepoDialog} onOpenChange={setShowRepoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar Repositório</DialogTitle>
            <DialogDescription>
              Esta funcionalidade será integrada com o seletor de repositório do GitHub.
              Por enquanto, você pode usar a página principal para selecionar um repositório.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRepoDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => (window.location.href = '/')}>Ir para Página Principal</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
