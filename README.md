# PetCare — Sistema de Gestão para Pet Shops e Clínicas Veterinárias

Sistema SaaS multi-tenant para gestão de agendamentos, hospedagem, prontuário clínico, estoque e comunicação via WhatsApp.

---

## Stack Tecnológica

### Frontend
- **React 19** + **TypeScript**
- **Vite** — build e dev server
- **Tailwind CSS** + **Shadcn UI** (Radix UI)
- **React Router v6** — roteamento com rotas protegidas por role
- **React Hook Form** + **Zod** — formulários e validação
- **Recharts** — gráficos e dashboards

### Backend (`server/`)
- **Node.js** + **Express 5**
- **Prisma ORM** + **MySQL 8.4**
- **JWT** — autenticação stateless com `userId`, `role` e `organizationId`
- **bcryptjs** — hash de senhas
- **nodemailer** — envio de e-mail de confirmação (Gmail SMTP)

---

## Arquitetura Multi-Tenant

Cada clínica é uma **organização** independente. O `organizationId` é embutido no JWT no login e propagado por todas as queries do banco — estratégia de linha por tenant (row-level tenancy).

```
Cliente → Login → JWT { userId, role, organizationId }
                    ↓
         tenantGuard middleware
                    ↓
         Todas as queries filtradas por organizationId
```

**Roles disponíveis:** `saas_admin` · `admin` · `veterinarian` · `groomer` · `attendant`

---

## Módulos

| Módulo | Descrição |
|--------|-----------|
| Agenda | Agendamentos com visão dia/semana/mês, status por tipo de serviço |
| Banho & Tosa | Kanban de etapas configuráveis, notificação WhatsApp ao tutor |
| Clínica | Prontuário SOAP, prescrições, exames, vacinas |
| Hospedagem | Mapa de canis, check-in/out, serviços extras |
| Internação | Monitoramento com logs de sinais vitais e medicação |
| Clientes / Pets | Cadastro completo com histórico de interações |
| Estoque | Produtos, lotes, movimentações, controle de validade |
| Vendas | PDV com vinculação a clientes e pets |
| Financeiro | Visão consolidada de receitas |
| Tarefas | Gestão de tarefas internas da equipe |
| WhatsApp | Envio automático e manual via templates configuráveis |
| Painel SAAS | Gestão de organizações — exclusivo para `saas_admin` |

---

## Credenciais de Teste

> Todos os logins abaixo funcionam após executar `npm run seed` no backend.

### Painel Operacional — `http://localhost:8080/login`

| E-mail | Senha | Role | Acesso |
|--------|-------|------|--------|
| `admin@agilipet.local` | `admin123` | `admin` | Acesso completo ao sistema |
| `marcelo@agilipet.local` | `admin123` | `veterinarian` | Clínica, prontuário, internação |
| `beatriz@agilipet.local` | `admin123` | `veterinarian` | Clínica, prontuário, internação |
| `andre@agilipet.local` | `admin123` | `veterinarian` | Clínica, prontuário, internação |
| `carla@agilipet.local` | `admin123` | `groomer` | Banho & Tosa, agenda |
| `juliano@agilipet.local` | `admin123` | `groomer` | Banho & Tosa, agenda |
| `fernanda@agilipet.local` | `admin123` | `attendant` | Agenda, clientes, recepção |

### Painel SAAS — `http://localhost:8080/login`

| E-mail | Senha | Role | Acesso |
|--------|-------|------|--------|
| `marcelokoller@gmail.com` | `admin123` | `saas_admin` | Gestão de organizações (`/saas`) |

> Criado via `npm run seed:prod` (não apaga dados existentes).

### Portal do Tutor — `http://localhost:8080/portal/login`

Use o e-mail de qualquer cliente do seed. A senha é `portal123`.

| Status no seed | Quantidade | Comportamento |
|----------------|------------|---------------|
| `approved` | 3 clientes | Login liberado normalmente |
| `pending` | 3 clientes | Aguarda aprovação do admin |
| `rejected` | 2 clientes | Login bloqueado |

---

## Páginas e Fluxos de Acesso

> Frontend em `http://localhost:8080` · Backend em `http://localhost:3000`

### Acesso público (sem autenticação)

| Rota | Descrição |
|------|-----------|
| `/login` | Login com e-mail e senha |
| `/register` | Cadastro de nova clínica (CNPJ + ViaCEP) |
| `/confirm-email` | Confirmação de e-mail pós-registro |
| `/booking` | **Landing Page / Agendamento online** — página pública para tutores solicitarem agendamentos sem criar conta |

### Portal do Tutor (acesso do cliente final)

| Rota | Descrição |
|------|-----------|
| `/portal/login` | Login do tutor no portal |
| `/portal/cadastro` | Cadastro do tutor |
| `/portal/loja` | Loja de produtos online |
| `/portal/checkout` | Checkout do pedido |
| `/portal/pedidos` | Histórico de pedidos do tutor |

### Painel Operacional (requer login — roles: `admin`, `veterinarian`, `groomer`, `attendant`)

| Rota | Módulo | Descrição |
|------|--------|-----------|
| `/dashboard` | Dashboard | Métricas do dia, agenda resumida, KPIs |
| `/schedule` | Agenda | Visões dia / semana / mês — agendamentos de todos os tipos |
| `/grooming` | Banho & Tosa | Kanban de etapas + notificação WhatsApp ao tutor |
| `/clinic` | Clínica | Consultas, prontuário SOAP, prescrições, vacinas |
| `/boarding` | Hospedagem | Mapa de canis, check-in/out, serviços extras |
| `/hospitalization` | Internação | Monitoramento de pacientes internados com logs e medicação |
| `/clients` | Clientes | Lista de clientes/tutores |
| `/clients/:id` | Ficha do Cliente | Histórico completo, pets, comunicação e financeiro por cliente |
| `/pets` | Pets | Cadastro e prontuário dos pets |
| `/inventory` | Estoque | Produtos, lotes, movimentações |
| `/sales` | Vendas | PDV e histórico de vendas |
| `/financials` | Financeiro | Visão consolidada de receitas |
| `/tasks` | Tarefas | Gestão de tarefas internas da equipe |
| `/services` | Serviços | Catálogo de serviços e preços |
| `/admin` | Configurações | Equipe, horários, WhatsApp, templates de mensagem |
| `/my-data` | Meus Dados | Dados do usuário logado |
| `/knowledge` | Base de Conhecimento | Documentação e tutoriais internos |

### Painel SAAS (exclusivo `saas_admin`)

| Rota | Descrição |
|------|-----------|
| `/saas` | Gestão de organizações — criar, bloquear, ver métricas de cada clínica |

---

## Fluxo Completo — Agendamento Online (tutor)

```
Tutor acessa /booking
  → Seleciona serviço, data e horário disponível
  → Preenche dados (nome, telefone, pet)
  → Agendamento criado com status "scheduled"
  → WhatsApp automático de confirmação (se template configurado)
  → Clínica vê o agendamento em /schedule
```

## Fluxo Completo — Banho & Tosa

```
/schedule  →  Agendamento confirmado (status "confirmed")
     ↓
/grooming  →  Card aparece em "Agenda Hoje"
     ↓         Botão "Iniciar" → move para Kanban (groomingStatus = estágio inicial)
               WhatsApp automático de check-in enviado ao tutor
     ↓
           →  Avança etapas pelo Kanban (ex: Lavando → Secando → Tosa → Pronto)
               Checklist de finalização obrigatório antes de "Pronto"
               WhatsApp automático "Pronto para retirada" enviado ao tutor
     ↓
           →  Botão "Entregar" → status "Entregue"
               WhatsApp de entrega enviado (opcional)
```

## Fluxo Completo — Hospedagem

```
/boarding  →  Check-in de hospedagem
     ↓         Seleção de canil, período, serviços extras
               WhatsApp automático de check-in ao tutor
     ↓
           →  Durante hospedagem: serviços extras podem ser adicionados
     ↓
           →  Check-out → WhatsApp automático de saída
               Fatura gerada com todos os serviços consumidos
```

## Fluxo Completo — Registro de Nova Clínica

```
/register  →  CNPJ + dados da empresa (endereço via ViaCEP)
     ↓
           →  E-mail de confirmação enviado (válido 24h)
     ↓
/confirm-email → Conta ativada com trial de 15 dias
     ↓
/login     →  Redirecionamento por role:
               saas_admin → /saas
               demais     → /dashboard
```

---

## Pré-requisitos

- Node.js 18+
- MySQL 8.4

---

## Configuração do Ambiente

### 1. Instalar dependências

```bash
# Frontend
npm install

# Backend
cd server && npm install
```

### 2. Configurar variáveis de ambiente

Crie `server/.env` a partir do exemplo:

```bash
cp server/.env.example server/.env
```

Preencha as variáveis:

```env
DATABASE_URL="mysql://root:SENHA@localhost:3306/petcare"
JWT_SECRET="troque-em-producao"
PORT=3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seuemail@gmail.com
SMTP_PASS=sua-app-password
SMTP_FROM="PetCare <seuemail@gmail.com>"
APP_URL=http://localhost:5173
```

### 3. Criar banco e aplicar migrações

```bash
cd server
npx prisma migrate deploy
```

### 4. Criar usuário administrador SAAS

```bash
cd server
npm run seed:prod
```

---

## Rodando em Desenvolvimento

```bash
# Terminal 1 — Backend (porta 3000)
cd server && npm run dev

# Terminal 2 — Frontend (porta 8080)
npm run dev
```

Acesse: [http://localhost:8080](http://localhost:8080)

---

## Scripts

### Frontend

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview da build |
| `npm run lint` | Executar linter |
| `npm run lint:fix` | Corrigir problemas automaticamente |
| `npm run format` | Formatar com Prettier |

### Backend (`server/`)

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor com nodemon |
| `npm run build` | Compilar TypeScript |
| `npm run seed:prod` | Criar usuário saas_admin |
| `npx prisma migrate dev` | Criar nova migração |
| `npx prisma studio` | Interface visual do banco |

---

## Estrutura do Projeto

```
petcare/
├── src/
│   ├── components/        # Componentes compartilhados e UI
│   ├── pages/             # Páginas por módulo
│   │   ├── auth/          # Login, Registro, Confirmação de e-mail
│   │   ├── dashboard/
│   │   ├── schedule/
│   │   ├── grooming/
│   │   ├── clinic/
│   │   ├── boarding/
│   │   ├── hospitalization/
│   │   ├── clients/
│   │   ├── pets/
│   │   ├── inventory/
│   │   ├── sales/
│   │   ├── financials/
│   │   ├── tasks/
│   │   └── saas/          # Painel SAAS admin
│   ├── stores/            # React Context (estado global)
│   ├── lib/               # Tipos, API client, utilitários
│   └── App.tsx
└── server/
    ├── src/
    │   ├── controllers/   # Handlers de rota
    │   ├── middlewares/   # auth, tenant, saas guard
    │   ├── routes/        # Definição de rotas
    │   ├── services/      # E-mail, WhatsApp
    │   └── utils/         # JWT, hash
    └── prisma/
        ├── schema.prisma  # Schema MySQL multi-tenant
        └── seed.production.ts
```

---

## Fluxo de Registro de Nova Clínica

1. Acesse `/register` e preencha os dados da empresa (CNPJ validado, endereço via ViaCEP)
2. Um e-mail de confirmação é enviado — válido por 24 horas
3. Após confirmar, a clínica tem **15 dias de trial** gratuito
4. Ao expirar o trial, o login é bloqueado com mensagem de contato

---

## Qualidade de Código

- **TypeScript** — tipagem estática em todo o projeto
- **ESLint** + **Oxlint** — análise estática
- **Prettier** — formatação automática
