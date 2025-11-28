# 🔗 Guia de Integração: Frontend Vercel Template + Backend Atomic Agents

Este documento explica como o frontend (Vercel Coding Agent Template) se integra com o backend (Atomic Agents) seguindo o princípio **"Frontend Burro, Backend Inteligente"**.

## 📋 Visão Geral

O frontend é responsável apenas por:
- ✅ Renderizar o estado do sistema (Ledger, Pipeline, Arquivos)
- ✅ Transmitir intenções do usuário (mensagens, comandos)
- ✅ Navegar entre views (Chat → Dashboard de Tarefas)

O backend (Atomic Agents) é responsável por:
- ✅ Tomar decisões (quando criar job, qual agente usar)
- ✅ Executar comandos (clonar repo, rodar testes, aplicar patches)
- ✅ Gerenciar estado (TDLN Ledger, eventos de jobs)

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                      │
│  ┌────────────┐  ┌─────────────┐  ┌────────────────────┐   │
│  │ View 1:    │  │  View 2:    │  │   Componentes:     │   │
│  │ Chat UI    │  │  Dashboard  │  │   - LiveLedger     │   │
│  │ (/)        │  │ (/tasks/id) │  │   - AgentPipeline  │   │
│  │            │  │             │  │   - FileViewer     │   │
│  └────────────┘  └─────────────┘  └────────────────────┘   │
│         │                │                    ▲              │
│         │                │                    │              │
│         ▼                ▼                    │              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          API Routes (Proxy Layer)                    │   │
│  │  /api/chat, /api/chat/stream, /api/jobs/[id]/*      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────┬────────────────────────────────────────┘
                      │ HTTP/SSE
                      │ ATOMIC_API_URL
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND (Atomic Agents)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              ConversationAgent (Coordinator)           │ │
│  │  - Recebe mensagens do chat                            │ │
│  │  - Decide quando criar Job                             │ │
│  │  - Emite evento job_created → Frontend redireciona     │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    WorkerAgent                         │ │
│  │  Planner → Builder → Reviewer                          │ │
│  │  - Executa ferramentas (git, patch, test)              │ │
│  │  - Emite eventos no Ledger com agent_type             │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │               TDLN Ledger (PostgreSQL)                 │ │
│  │  - Eventos (tool_call, tool_result, error)            │ │
│  │  - Estado do Job (running, waiting_human, succeeded)  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔌 Endpoints de Integração

### Frontend → Backend

Todos os endpoints do frontend fazem proxy para o backend Atomic via `ATOMIC_API_URL`:

| Frontend Endpoint             | Backend Endpoint                     | Descrição                                |
| ----------------------------- | ------------------------------------ | ---------------------------------------- |
| `POST /api/chat`              | `POST ${ATOMIC_API_URL}/api/chat`    | Envia mensagem do usuário                |
| `GET /api/chat/stream`        | `GET ${ATOMIC_API_URL}/api/chat/stream` | Recebe eventos SSE do chat            |
| `GET /api/jobs/[id]/events`   | `GET ${ATOMIC_API_URL}/api/jobs/[id]/events` | Recebe eventos SSE do job     |
| `POST /api/jobs/[id]/stop`    | `POST ${ATOMIC_API_URL}/api/jobs/[id]/stop` | Para execução do job           |
| `POST /api/jobs/[id]/approve` | `POST ${ATOMIC_API_URL}/api/jobs/[id]/approve` | Aprova job em espera        |
| `GET /api/jobs/[id]/files`    | `GET ${ATOMIC_API_URL}/api/jobs/[id]/files?path=...` | Lê arquivo do repo clonado |

## 📡 Fluxo de Dados (SSE - Server-Sent Events)

### 1. Chat Stream (`/api/chat/stream`)

**Frontend:**
```typescript
const es = new EventSource(`/api/chat/stream?conversationId=${id}`)
es.onmessage = (ev) => {
  const data = JSON.parse(ev.data)
  if (data.type === 'message') {
    // Renderizar mensagem do bot
  }
  if (data.type === 'job_created') {
    // Redirecionar para /tasks/{jobId}
    router.push(`/tasks/${data.jobId}`)
  }
}
```

**Backend esperado:**
```
event: message
data: {"type":"message","message":{"role":"assistant","content":"Entendi, vou criar um job..."}}

event: job_created
data: {"type":"job_created","jobId":"uuid-123","redirect":true}
```

### 2. Job Events Stream (`/api/jobs/[id]/events`)

**Frontend:**
```typescript
const es = new EventSource(`/api/jobs/${jobId}/events`)
es.onmessage = (ev) => {
  const event = JSON.parse(ev.data)
  // event = { kind: "tool_call", tool_name: "read_file", agent_type: "planner", ... }
}
```

**Backend esperado:**
```
data: {"id":"evt1","kind":"tool_call","tool_name":"clone_repo","agent_type":"coordinator","created_at":"...","summary":"Clonando repositório..."}

data: {"id":"evt2","kind":"tool_call","tool_name":"read_ledger","agent_type":"planner","created_at":"...","summary":"Lendo TDLN Ledger..."}

data: {"id":"evt3","kind":"tool_result","agent_type":"builder","created_at":"...","result":{"pr_url":"https://github.com/..."}}
```

## 🎨 Componentes Principais

### 1. **ChatInterface** (`components/chat-interface.tsx`)
- Renderiza histórico de mensagens
- Envia mensagens via `POST /api/chat`
- Escuta `GET /api/chat/stream` para job_created
- **Redireciona automaticamente** para `/tasks/{jobId}` quando job é criado

### 2. **LiveLedger** (`components/live-ledger.tsx`)
- Renderiza eventos do job em tempo real
- Agrupa eventos por `agent_type` (coordinator, planner, builder, reviewer)
- Mostra ícones contextuais (read_file = 👁️, test = 🧪)
- Detecta `result.pr_url` e exibe link para PR

### 3. **AgentPipeline** (`components/agent-pipeline.tsx`)
- Pipeline visual: `Coordinator → Planner → Builder → Reviewer`
- Estado baseado em `agent_type` dos eventos
- Mostra qual agente está ativo (`CircleDot`), concluído (`CheckCircle`) ou pendente (`Circle`)

### 4. **FileViewer** (`components/file-viewer.tsx`)
- Editor Monaco (read-only)
- Carrega arquivos via `GET /api/jobs/[id]/files?path=/src/app.ts`
- Syntax highlighting automático

## ⚙️ Variáveis de Ambiente

### Frontend (Next.js)

Crie um arquivo `.env.local` na raiz do projeto frontend:

```bash
# Backend Atomic Agents
ATOMIC_API_URL=http://localhost:8000

# Autenticação GitHub (OAuth App)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# Autenticação Vercel (opcional)
AUTH_VERCEL_ID=your_vercel_client_id
AUTH_VERCEL_SECRET=your_vercel_client_secret

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/coding_agent

# Session
SESSION_SECRET=your_random_secret_key_here

# GitHub App (para integração de repositórios)
GITHUB_APP_ID=your_github_app_id
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
```

### Backend (Atomic Agents)

Consulte `Atomic-Agents-main/worker/.env.example` para configuração do backend.

## 🚀 Como Rodar

### 1. Backend (Atomic Agents)

```bash
cd Atomic-Agents-main/worker
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend (Vercel Template)

```bash
cd coding-agent-template-main
pnpm install
pnpm dev
```

O frontend estará em `http://localhost:3000` e fará proxy para `http://localhost:8000`.

## 🧪 Testando a Integração

### Teste 1: Chat → Job Creation

1. Acesse `http://localhost:3000/chat`
2. Digite: "Refatorar o módulo de auth"
3. **Esperado:** Frontend deve redirecionar para `/tasks/{jobId}` automaticamente

### Teste 2: Dashboard de Tarefas

1. Acesse `/tasks/{jobId}`
2. **Esperado:**
   - LiveLedger mostra eventos em tempo real
   - AgentPipeline mostra qual agente está ativo
   - FileViewer permite carregar arquivos do repo

### Teste 3: Pull Request

1. Quando o job terminar com sucesso
2. **Esperado:** Botão "Ver Pull Request" aparece no dashboard

## 🛠️ Customizações

### Adicionar novo tipo de evento

**Backend:**
```python
await ledger.log_event(
    kind="custom_event",
    agent_type="builder",
    message="Minha operação customizada",
    summary="Resumo curto"
)
```

**Frontend:** O LiveLedger automaticamente renderizará o evento.

### Adicionar novo agente ao pipeline

**Backend:** Emita eventos com `agent_type="new_agent"`

**Frontend:** Edite `components/agent-pipeline.tsx`:
```typescript
const AGENT_ORDER: AgentStage[] = ['coordinator', 'planner', 'builder', 'reviewer', 'new_agent']
const LABELS: Record<AgentStage, string> = {
  ...
  new_agent: 'New Agent',
}
```

## 📚 Referências

- [Especificação Técnica Original](../IMPLEMENTATION_PROGRESS.md)
- [Backend Atomic Agents](../Atomic-Agents-main/README.md)
- [Frontend Vercel Template](./README.md)

## 🐛 Troubleshooting

### Erro: "ATOMIC_API_URL is not configured"
- Verifique se `.env.local` existe no frontend
- Reinicie o servidor Next.js: `pnpm dev`

### Frontend não redireciona para /tasks após criar job
- Verifique se o backend está emitindo `event: job_created`
- Verifique o console do navegador para erros no SSE

### LiveLedger não mostra eventos
- Verifique se `GET /api/jobs/[id]/events` retorna eventos
- Abra DevTools → Network → EventStream para ver os eventos SSE

### FileViewer não carrega arquivos
- Verifique se o backend implementou `GET /api/jobs/[id]/files`
- Verifique se o repo foi clonado corretamente no Worker

---

**Autor:** Integração Vercel UI + Atomic Backend
**Data:** 2025-11-28
**Versão:** 1.0
