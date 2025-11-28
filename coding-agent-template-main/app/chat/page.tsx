import { cookies } from 'next/headers'
import { getServerSession } from '@/lib/session/get-server-session'
import { ChatPageClient } from '@/components/chat-page-client'

export default async function ChatPage() {
  const session = await getServerSession()
  const cookieStore = await cookies()
  const selectedOwner = cookieStore.get('selected-owner')?.value || ''
  const selectedRepo = cookieStore.get('selected-repo')?.value || ''

  // TODO: Get installation ID from database
  const initialRepo = selectedOwner && selectedRepo
    ? { installationId: 0, repoFullName: `${selectedOwner}/${selectedRepo}` }
    : null

  return <ChatPageClient user={session?.user ?? null} initialRepo={initialRepo} />
}
