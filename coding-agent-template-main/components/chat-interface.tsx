'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@/lib/hooks/use-chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, Bot, User as UserIcon } from 'lucide-react'
import type { Session } from '@/lib/session/types'

interface ChatInterfaceProps {
  user?: Session['user'] | null
  initialRepo?: { installationId: number; repoFullName: string } | null
  onRepoSelect?: () => void
}

export function ChatInterface({ user, initialRepo, onRepoSelect }: ChatInterfaceProps) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRepo, setSelectedRepo] = useState(initialRepo)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage } = useChat((jobId) => {
    // Redireciona automaticamente quando job é criado
    router.push(`/tasks/${jobId}`)
  })

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || isLoading) return

    setIsLoading(true)
    try {
      await sendMessage({
        content: text.trim(),
        repo: selectedRepo,
      })
      setText('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-semibold">Chat & Command Center</h1>
            <p className="text-xs text-muted-foreground">
              {selectedRepo ? `Repositório: ${selectedRepo.repoFullName}` : 'Nenhum repositório selecionado'}
            </p>
          </div>
        </div>
        {onRepoSelect && (
          <Button size="sm" variant="outline" onClick={onRepoSelect}>
            {selectedRepo ? 'Trocar Repositório' : 'Selecionar Repositório'}
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <Bot className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Bem-vindo ao Chat!</h3>
                <p className="text-sm text-muted-foreground">
                  Digite uma mensagem para começar. Exemplo: "Refatorar o módulo de auth" ou "Criar testes para o componente Header"
                </p>
              </CardContent>
            </Card>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                </div>
              )}

              <Card className={`max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : ''}`}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={msg.role === 'user' ? 'secondary' : 'outline'} className="text-[10px]">
                      {msg.role === 'user' ? 'Você' : 'Assistente'}
                    </Badge>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </CardContent>
              </Card>

              {msg.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              </div>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Processando...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                user
                  ? 'Digite sua mensagem...'
                  : 'Faça login para enviar mensagens'
              }
              disabled={!user || isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={!user || !text.trim() || isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {!selectedRepo && (
            <p className="text-xs text-muted-foreground mt-2">
              💡 Dica: Selecione um repositório para começar a trabalhar
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
