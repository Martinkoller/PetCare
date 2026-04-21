import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  ClipboardCheck,
  Users,
  Dog,
  Scissors,
  Stethoscope,
  BedDouble,
  ShoppingCart,
  Package,
  TrendingUp,
  List,
  Settings,
  Search,
  ArrowRight,
  BookOpen,
  Zap,
  Link2,
} from 'lucide-react'

// ─── Content definition ───────────────────────────────────────────────────────

interface Integration {
  module: string
  description: string
}

interface ModuleDoc {
  id: string
  title: string
  icon: React.ElementType
  color: string
  badge?: string
  summary: string
  features: string[]
  integrations: Integration[]
  tips: string[]
}

const MODULES: ModuleDoc[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    color: 'text-blue-600 bg-blue-50',
    summary:
      'Painel central da operação. Apresenta os indicadores mais importantes do dia em tempo real e atalhos para as ações mais frequentes, reduzindo o tempo gasto navegando entre módulos.',
    features: [
      'KPIs do dia: consultas agendadas, animais no hotel, atendimentos em andamento e agenda pessoal',
      'Botões de ação rápida para criar agendamento, pet, cliente, consulta, banho, vacina, prescrição e venda',
      'Prévia da agenda do dia com horários e status de cada compromisso',
      'Feed de atividades recentes: últimos serviços concluídos, vendas e novos cadastros',
      'Alertas configuráveis: estoque baixo, agendamentos online e aniversariantes',
    ],
    integrations: [
      { module: 'Agenda', description: 'Exibe os próximos agendamentos do dia' },
      { module: 'Hospedagem', description: 'Mostra quantos animais estão no hotel no momento' },
      { module: 'Clínica', description: 'Conta as consultas ativas' },
      { module: 'Estoque', description: 'Aciona alertas de estoque baixo quando configurado' },
    ],
    tips: [
      'Use os botões de ação rápida para cadastros urgentes sem precisar navegar pelo menu lateral.',
      'Os alertas do Dashboard são configurados em Administração → Preferências.',
    ],
  },
  {
    id: 'schedule',
    title: 'Agenda',
    icon: Calendar,
    color: 'text-violet-600 bg-violet-50',
    summary:
      'Calendário unificado para todos os profissionais da clínica. Permite agendar, visualizar e gerenciar compromissos em visão diária ou semanal, com detecção automática de conflitos de horário.',
    features: [
      'Alternância entre visão Dia e Semana',
      'Filtro por profissional para isolar a agenda de cada membro da equipe',
      'Criação de agendamento diretamente no slot de horário clicado',
      'Detecção de conflito: alerta quando o mesmo profissional tem dois compromissos sobrepostos',
      'Edição e cancelamento de agendamentos existentes',
      'Ícone de serviço diferencia visualmente consultas, banhos e hospedagens',
    ],
    integrations: [
      { module: 'Clientes / Pets', description: 'Cada agendamento vincula um pet e, por consequência, o seu tutor' },
      { module: 'Catálogo de Serviços', description: 'Tipo de serviço e duração são preenchidos a partir do catálogo' },
      { module: 'Administração', description: 'Perfis de profissionais disponíveis vêm do cadastro de equipe' },
      { module: 'Booking Público', description: 'Agendamentos feitos pelo cliente aparecem automaticamente aqui' },
    ],
    tips: [
      'Clique diretamente em um horário livre para abrir o formulário de agendamento já com data e hora preenchidos.',
      'Use o filtro de profissional para imprimir ou revisar a agenda individual antes do dia começar.',
    ],
  },
  {
    id: 'tasks',
    title: 'Tarefas',
    icon: ClipboardCheck,
    color: 'text-amber-600 bg-amber-50',
    summary:
      'Gerenciamento de tarefas internas da equipe, como limpeza, manutenção e administrativo. Oferece visão em lista e quadro Kanban para acompanhar o progresso das atividades do dia a dia.',
    features: [
      'Criação de tarefas com título, descrição, categoria, responsável e data de entrega',
      'Prioridades: baixa, média e alta',
      'Status: pendente, em andamento e concluído',
      'Alternância entre visão Lista e Kanban',
      'Filtros por status, prioridade e responsável',
    ],
    integrations: [
      { module: 'Administração', description: 'Responsáveis são os membros cadastrados na equipe' },
    ],
    tips: [
      'Use categorias (limpeza, manutenção, administrativo) para facilitar a delegação por área.',
      'A visão Kanban é mais útil durante reuniões de equipe para acompanhar o andamento em tempo real.',
    ],
  },
  {
    id: 'clients',
    title: 'Clientes',
    icon: Users,
    color: 'text-green-600 bg-green-50',
    summary:
      'Cadastro central de tutores (donos de pets). Todo serviço prestado parte de um cliente — é aqui que ficam os dados de contato, preferência de notificação e o histórico de atendimentos da família.',
    features: [
      'Cadastro completo: nome, telefone, e-mail, endereço, data de entrada',
      'Indicador de WhatsApp ativo por cliente',
      'Badge com contagem de pets vinculados',
      'Painel de histórico: todos os pets e serviços do cliente em um só lugar',
      'Busca por nome, telefone ou e-mail',
    ],
    integrations: [
      { module: 'Pets', description: 'Um cliente pode ter vários pets; ao excluir um cliente, seus pets devem ser removidos antes' },
      { module: 'Agenda', description: 'Agendamentos sempre referenciam o pet, que aponta para o cliente' },
      { module: 'Administração → Notificações', description: 'Disparos de WhatsApp/e-mail são enviados para o contato cadastrado aqui' },
      { module: 'Booking Público', description: 'Clientes criados durante o booking online aparecem aqui' },
    ],
    tips: [
      'Mantenha o WhatsApp atualizado para garantir que notificações automáticas sejam entregues.',
      'Use o painel de histórico do cliente para ter uma visão completa antes de um novo atendimento.',
    ],
  },
  {
    id: 'pets',
    title: 'Pets',
    icon: Dog,
    color: 'text-orange-600 bg-orange-50',
    summary:
      'Prontuário básico de cada animal. Armazena dados físicos (espécie, raça, porte, peso, idade) e está no centro de todos os serviços — cada atendimento é sempre vinculado ao pet, não ao cliente diretamente.',
    features: [
      'Cadastro: nome, espécie, raça, porte (P/M/G), gênero, idade, peso, avatar',
      'Observações gerais (alergias, comportamento, cuidados especiais)',
      'Histórico de serviços: hospedagens, banhos, consultas e vacinas',
      'Busca por nome do pet, raça ou nome do tutor',
      'Cadastro rápido de pet dentro do módulo de Banho e Tosa',
    ],
    integrations: [
      { module: 'Clientes', description: 'Cada pet pertence a um cliente; o tutor é exibido em todos os módulos' },
      { module: 'Banho e Tosa', description: 'O porte do pet é exibido nos cards do Kanban' },
      { module: 'Clínica', description: 'Prontuário clínico, vacinas e prescrições ficam vinculados ao pet' },
      { module: 'Hospedagem', description: 'O histórico de estadas do pet é acessível direto no cadastro' },
    ],
    tips: [
      'Preencha o porte (P/M/G) para que o tempo estimado de banho e o valor sejam sugeridos corretamente.',
      'Adicione observações sobre comportamento agressivo ou alergias — elas aparecem no card do Banho e Tosa.',
    ],
  },
  {
    id: 'grooming',
    title: 'Banho e Tosa',
    icon: Scissors,
    color: 'text-pink-600 bg-pink-50',
    summary:
      'Fluxo operacional do serviço de banho e tosa em formato Kanban. Cada card representa um atendimento em andamento, e as colunas representam as etapas do processo — configuradas livremente pela gestão.',
    features: [
      'Kanban com drag-and-drop entre etapas',
      'Card exibe: pet, tutor, porte, raça, serviços contratados, prioridade, tipo (agendado/encaixe), horário de entrada, tempo na etapa atual e previsão de saída',
      'Tempo na etapa destacado em âmbar (>60 min) e vermelho (>90 min) para alertar atrasos',
      'Etapa Inicial registra automaticamente o horário de entrada (startedAt)',
      'Etapa Final bloqueia o card para edição e exige confirmação ao finalizar',
      'Ações rápidas no hover: avançar etapa, notificar tutor via WhatsApp, editar',
      'Configuração de colunas visíveis e ordem no botão Visualização',
    ],
    integrations: [
      { module: 'Catálogo de Serviços', description: 'Itens de serviço são selecionados do catálogo de categoria "banho e tosa"' },
      { module: 'Pets / Clientes', description: 'Nome do tutor, raça e porte vêm do cadastro do pet' },
      { module: 'Administração → Banho e Tosa', description: 'Etapas do Kanban são gerenciadas lá; uma deve ser marcada como Inicial e outra como Final' },
      { module: 'Notificações', description: 'O botão WhatsApp no card envia mensagem ao tutor e marca como "Tutor notificado"' },
    ],
    tips: [
      'Configure a etapa Inicial para registrar a entrada automaticamente — sem precisar editar o card.',
      'Use Prioridade "Urgente" para pets com condição especial; o card ganha borda vermelha visível.',
      'O botão "próxima etapa" (seta) no hover avança o card sem precisar arrastar — útil em telas sensíveis ao toque.',
    ],
  },
  {
    id: 'clinic',
    title: 'Clínica',
    icon: Stethoscope,
    color: 'text-cyan-600 bg-cyan-50',
    summary:
      'Módulo de gestão de consultas veterinárias. Controla o fluxo do paciente desde a chegada (triagem) até o encerramento da consulta, mantendo prontuário clínico completo por atendimento.',
    features: [
      'Fluxo de atendimento: agendado → aguardando → triagem → em consulta → concluído',
      'Prontuário SOAP: subjetivo, objetivo, avaliação e plano',
      'Registro de sinais vitais (peso, temperatura, frequência cardíaca)',
      'Prescrições e solicitações de exame por atendimento',
      'Registro de vacinas aplicadas',
      'Materiais e insumos utilizados na consulta (descontados do estoque)',
      'Data de retorno sugerida pelo veterinário',
    ],
    integrations: [
      { module: 'Pets', description: 'Todo o histórico clínico fica associado ao pet' },
      { module: 'Estoque', description: 'Materiais usados na consulta geram saída automática do estoque' },
      { module: 'Agenda', description: 'Consultas agendadas aparecem no calendário e iniciam o fluxo clínico' },
      { module: 'Catálogo de Serviços', description: 'Tipo de consulta e valor são definidos pelo catálogo' },
    ],
    tips: [
      'Use a data de retorno para acionar lembretes automáticos ao tutor via WhatsApp.',
      'Materiais usados na consulta devem ser registrados para manter o estoque preciso.',
    ],
  },
  {
    id: 'boarding',
    title: 'Hospedagem',
    icon: BedDouble,
    color: 'text-indigo-600 bg-indigo-50',
    summary:
      'Hotel para pets: gerencia reservas, check-in, check-out, ocupação dos canis e serviços adicionais durante a estada. Fornece uma visão de mapa de ocupação por tamanho de canil.',
    features: [
      'Mapa de ocupação: visualização de canis por tamanho (P, M, G) e status',
      'Fluxo: reservado → check-in → check-out → concluído',
      'Registro de serviços adicionais durante a estada (banho, medicação, ração especial)',
      'Instruções especiais e observações de saída por estada',
      'Assinatura digital no check-out',
      'Histórico completo de hospedagens filtrado por período',
      'WhatsApp direto para o tutor a partir da ficha de hospedagem',
    ],
    integrations: [
      { module: 'Pets / Clientes', description: 'Reservas são vinculadas ao pet; contato do tutor vem do cadastro' },
      { module: 'Estoque', description: 'Insumos utilizados durante a estada (alimentação, medicamento) saem do estoque' },
      { module: 'Banho e Tosa', description: 'Serviço de banho pode ser adicionado à estada e gera um atendimento no módulo de Banho' },
      { module: 'Relatórios Financeiros', description: 'Receita de hospedagem compõe os relatórios de faturamento' },
    ],
    tips: [
      'Configure os canis em Administração antes de fazer a primeira reserva.',
      'Serviços adicionais contratados durante a estada impactam diretamente o valor total da fatura.',
    ],
  },
  {
    id: 'sales',
    title: 'Vendas',
    icon: ShoppingCart,
    color: 'text-emerald-600 bg-emerald-50',
    summary:
      'Registro de vendas de produtos e serviços avulsos (sem agendamento). Permite associar a venda a um cliente e pet, selecionar forma de pagamento e emitir o extrato da transação.',
    features: [
      'Venda de produtos do estoque e serviços do catálogo em uma mesma transação',
      'Associação opcional a cliente e pet',
      'Seleção de forma de pagamento (dinheiro, cartão, PIX)',
      'Histórico de vendas com filtro por período',
      'Cancelamento de venda com estorno automático de estoque',
    ],
    integrations: [
      { module: 'Estoque', description: 'Venda de produto desconta automaticamente o estoque' },
      { module: 'Catálogo de Serviços', description: 'Serviços vendidos são buscados do catálogo' },
      { module: 'Clientes / Pets', description: 'Vincular a venda ao pet cria um registro no histórico do cliente' },
      { module: 'Relatórios Financeiros', description: 'Vendas alimentam os gráficos de receita' },
    ],
    tips: [
      'Sempre vincule a venda ao cliente quando possível — isso enriquece o histórico de consumo.',
      'Cancele vendas imediatamente em caso de erro, para o estoque não ficar incorreto.',
    ],
  },
  {
    id: 'inventory',
    title: 'Estoque',
    icon: Package,
    color: 'text-yellow-600 bg-yellow-50',
    summary:
      'Controle de produtos da clínica: medicamentos, alimentos, insumos e acessórios. Alerta automaticamente sobre estoque mínimo, lotes próximos do vencimento e produtos inativos.',
    features: [
      'Cadastro de produto com categoria, unidade, custo e preço de venda',
      'Controle por lote com data de validade',
      'Entradas e saídas manuais de estoque com justificativa',
      'Alertas de estoque mínimo configuráveis por produto',
      'Alerta de vencimento próximo',
      'Filtro por categoria e status (ativo/inativo)',
    ],
    integrations: [
      { module: 'Vendas', description: 'Vendas de produto geram saída automática do lote mais antigo (FIFO)' },
      { module: 'Clínica', description: 'Materiais usados na consulta saem do estoque' },
      { module: 'Hospedagem', description: 'Insumos de estadia (ração, medicação) descontam o estoque' },
      { module: 'Dashboard', description: 'Alertas de estoque baixo aparecem no painel principal quando ativados' },
    ],
    tips: [
      'Defina o estoque mínimo de cada produto para não ser surpreendido por falta de insumos.',
      'Use lotes para rastrear validade de medicamentos — o sistema alerta quando a data se aproxima.',
    ],
  },
  {
    id: 'financials',
    title: 'Relatórios Financeiros',
    icon: TrendingUp,
    color: 'text-teal-600 bg-teal-50',
    badge: 'Admin',
    summary:
      'Visão consolidada da saúde financeira da clínica. Agrupa receitas de todos os módulos — consultas, banhos, hospedagem e vendas — em gráficos de tendência mensais e diários.',
    features: [
      'Gráfico de receita mensal comparativo',
      'Breakdown por tipo de serviço (consulta, banho, hospedagem, venda)',
      'Filtro por período personalizado',
      'Indicadores de desempenho: ticket médio, total do período, variação vs. período anterior',
    ],
    integrations: [
      { module: 'Vendas', description: 'Receita de produtos e serviços avulsos' },
      { module: 'Banho e Tosa', description: 'Valor dos atendimentos de grooming finalizados' },
      { module: 'Clínica', description: 'Receita das consultas concluídas' },
      { module: 'Hospedagem', description: 'Receita das estadas encerradas' },
    ],
    tips: [
      'Compare períodos mês a mês para identificar sazonalidade nos serviços.',
      'Use o breakdown por serviço para decidir onde investir em capacidade (contratar groomer vs. veterinário).',
    ],
  },
  {
    id: 'services',
    title: 'Catálogo de Serviços',
    icon: List,
    color: 'text-rose-600 bg-rose-50',
    badge: 'Admin',
    summary:
      'Tabela de preços e tempos de todos os serviços oferecidos. É a fonte de verdade usada pelo sistema para sugerir valores e durações ao criar agendamentos, consultas e atendimentos de banho.',
    features: [
      'Cadastro de serviço com nome, categoria, descrição, preço e duração em minutos',
      'Categorias: banho e tosa, consulta, hospedagem, exame, vacina, outros',
      'Ativação e desativação de serviços sem excluir o histórico',
      'Busca e filtro por categoria',
    ],
    integrations: [
      { module: 'Banho e Tosa', description: 'Itens de serviço são selecionados do catálogo na categoria "banho e tosa"' },
      { module: 'Agenda', description: 'Duração do serviço define o bloco de tempo ocupado no calendário' },
      { module: 'Vendas', description: 'Serviços avulsos são buscados daqui na hora da venda' },
      { module: 'Clínica', description: 'Tipo de consulta e valor de referência vêm do catálogo' },
    ],
    tips: [
      'Mantenha o campo "duração" preenchido — ele calcula a previsão de saída nos cards de Banho e Tosa.',
      'Desative um serviço ao invés de excluí-lo para preservar o histórico de atendimentos passados.',
    ],
  },
  {
    id: 'admin',
    title: 'Administração',
    icon: Settings,
    color: 'text-slate-600 bg-slate-50',
    badge: 'Admin',
    summary:
      'Central de configurações do sistema. Controla equipe, notificações, integrações de calendário, fluxo de etapas do banho e tosa e modelos de mensagens. Acesso restrito ao perfil Administrador.',
    features: [
      'Equipe: visualização de membros, cargos e status de autenticação',
      'Notificações: ativar/desativar WhatsApp, e-mail e SMS; editar templates de mensagem por evento',
      'Integrações: sincronização com Google Calendar e Outlook',
      'Banho e Tosa: criar, editar, reordenar e excluir etapas do Kanban; definir etapa Inicial e Final',
      'Status Gerais: criar status personalizados para uso nos módulos',
      'Modelos: templates de agendamento reutilizáveis',
    ],
    integrations: [
      { module: 'Todos os módulos', description: 'As configurações aqui impactam o comportamento de todos os outros módulos' },
      { module: 'Banho e Tosa', description: 'Etapas do Kanban e suas regras são definidas aqui' },
      { module: 'Notificações', description: 'Templates editados aqui são usados nos disparos automáticos e manuais' },
    ],
    tips: [
      'Sempre defina uma etapa como "Inicial" e outra como "Final" no fluxo de Banho e Tosa — são obrigatórias.',
      'Teste os templates de notificação antes de ativar o envio automático para clientes reais.',
    ],
  },
]

// ─── Flow overview ────────────────────────────────────────────────────────────

const FLOW_STEPS = [
  { label: 'Cadastro', desc: 'Cliente + Pet', color: 'bg-green-100 text-green-800 border-green-200' },
  { label: 'Agendamento', desc: 'Agenda / Booking', color: 'bg-violet-100 text-violet-800 border-violet-200' },
  { label: 'Atendimento', desc: 'Banho / Clínica / Hospedagem', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  { label: 'Insumos', desc: 'Estoque consumido', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { label: 'Faturamento', desc: 'Vendas / Financeiros', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  { label: 'Notificação', desc: 'WhatsApp / E-mail', color: 'bg-blue-100 text-blue-800 border-blue-200' },
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function KnowledgePage() {
  const [activeId, setActiveId] = useState<string>('dashboard')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return MODULES
    const q = search.toLowerCase()
    return MODULES.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.summary.toLowerCase().includes(q) ||
        m.features.some((f) => f.toLowerCase().includes(q)) ||
        m.integrations.some(
          (i) => i.module.toLowerCase().includes(q) || i.description.toLowerCase().includes(q),
        ),
    )
  }, [search])

  const activeModule = MODULES.find((m) => m.id === activeId) ?? MODULES[0]

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Base de Conhecimento</h1>
        </div>
        <p className="text-muted-foreground">
          Documentação operacional do sistema — entenda cada módulo, sua lógica e como ele se conecta aos demais.
        </p>
      </div>

      {/* Operational flow */}
      <div className="rounded-xl border bg-muted/20 p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5" /> Fluxo Operacional Típico
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {FLOW_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className={cn('rounded-lg border px-3 py-1.5 text-center', step.color)}>
                <p className="text-xs font-bold leading-tight">{step.label}</p>
                <p className="text-[10px] leading-tight opacity-75">{step.desc}</p>
              </div>
              {i < FLOW_STEPS.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main content: sidebar + article */}
      <div className="flex gap-6 min-h-[600px]">

        {/* Module navigation */}
        <aside className="w-52 shrink-0 space-y-1">
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              className="pl-8 h-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {(search ? filtered : MODULES).map((mod) => {
            const Icon = mod.icon
            return (
              <button
                key={mod.id}
                onClick={() => { setActiveId(mod.id); setSearch('') }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                  activeId === mod.id
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{mod.title}</span>
                {mod.badge && (
                  <Badge variant="secondary" className="ml-auto text-[9px] px-1 py-0 h-3.5 shrink-0">
                    {mod.badge}
                  </Badge>
                )}
              </button>
            )
          })}
        </aside>

        {/* Article */}
        <article className="flex-1 min-w-0 rounded-xl border bg-background p-6 space-y-6">
          {/* Module header */}
          <div className="flex items-start gap-4">
            <div className={cn('rounded-xl p-3 shrink-0', activeModule.color)}>
              <activeModule.icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold">{activeModule.title}</h2>
                {activeModule.badge && (
                  <Badge variant="secondary">{activeModule.badge}</Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1 leading-relaxed">{activeModule.summary}</p>
            </div>
          </div>

          <Separator />

          {/* Features */}
          <section className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Funcionalidades
            </h3>
            <ul className="space-y-2">
              {activeModule.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </section>

          <Separator />

          {/* Integrations */}
          <section className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" /> Integrações com outros módulos
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {activeModule.integrations.map((int) => (
                <div
                  key={int.module}
                  className="rounded-lg border bg-muted/30 p-3 space-y-0.5"
                >
                  <p className="text-xs font-semibold text-foreground">{int.module}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{int.description}</p>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Tips */}
          <section className="space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" /> Dicas operacionais
            </h3>
            <ul className="space-y-2">
              {activeModule.tips.map((tip) => (
                <li
                  key={tip}
                  className="flex items-start gap-2 text-sm rounded-lg bg-amber-50 border border-amber-100 px-3 py-2"
                >
                  <span className="text-amber-500 shrink-0 mt-0.5">💡</span>
                  <span className="text-amber-900">{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        </article>
      </div>
    </div>
  )
}
