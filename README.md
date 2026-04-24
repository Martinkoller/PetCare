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

# Terminal 2 — Frontend (porta 5173)
npm run dev
```

Acesse: [http://localhost:5173](http://localhost:5173)

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
