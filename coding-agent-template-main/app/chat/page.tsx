'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useChat } from '@/lib/hooks/use-chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ChatDemo() {
  const router = useRouter()
  const { sendMessage } = useChat((jobId) => router.push(`/tasks/${jobId}`))
  const [text, setText] = useState('Crie um PR atualizando README')

  return (
    <div className="p-6 space-y-3">
      <div className="text-sm text-muted-foreground">Chat demo: envia prompt e redireciona ao job quando criado</div>
      <div className="flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} />
        <Button onClick={() => sendMessage({ content: text })}>Enviar</Button>
      </div>
    </div>
  )
}
