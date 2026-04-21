import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { useAppointmentStore } from '@/stores/AppointmentStore'
import { useBoardingStore } from '@/stores/BoardingStore'
import { useInventoryStore } from '@/stores/InventoryStore'
import { useConfigStore } from '@/stores/ConfigStore'
import { useClientStore } from '@/stores/ClientContext'
import { usePetStore } from '@/stores/PetContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Calendar,
  Users,
  Dog,
  DollarSign,
  Stethoscope,
  Scissors,
  Syringe,
  FileText,
  CreditCard,
  Activity,
  Clock,
  PackageCheck,
  CheckCircle2,
  Hourglass,
  TrendingUp,
  ShoppingCart,
  UserPlus,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { format, isSameDay, isWithinInterval, startOfDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCurrency, cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/useAuthStore'
import { Appointment } from '@/lib/types'
import { ScheduleDialog } from '@/pages/schedule/components/ScheduleDialog'
import { PetDialog } from '@/pages/pets/PetDialog'
import { ClientDialog } from '@/pages/clients/ClientDialog'

// ── Status helpers ────────────────────────────────────────────────────────────

function groomingStatusLabel(apt: Appointment, stages: { id: string; title: string; isFinal?: boolean; isDelivery?: boolean }[]) {
  if (!apt.groomingStatus) return null
  const stage = stages.find((s) => s.id === apt.groomingStatus)
  return stage?.title ?? null
}

function aptStatusBadge(apt: Appointment, stages: { id: string; title: string; isFinal?: boolean; isDelivery?: boolean }[]) {
  if (apt.status === 'cancelled') return { label: 'Cancelado', cls: 'bg-red-100 text-red-700' }
  if (apt.status === 'completed') {
    const deliveryStage = stages.find((s) => s.isDelivery)
    if (deliveryStage && apt.groomingStatus === deliveryStage.id)
      return { label: 'Entregue', cls: 'bg-purple-100 text-purple-700' }
    return { label: 'Concluído', cls: 'bg-green-100 text-green-700' }
  }
  if (apt.status === 'in_progress') {
    const label = groomingStatusLabel(apt, stages)
    if (label) return { label, cls: 'bg-blue-100 text-blue-700' }
    return { label: 'Em Atendimento', cls: 'bg-blue-100 text-blue-700' }
  }
  if (apt.status === 'confirmed') return { label: 'Confirmado', cls: 'bg-emerald-100 text-emerald-700' }
  return { label: 'Agendado', cls: 'bg-gray-100 text-gray-600' }
}

function serviceLabel(apt: Appointment) {
  if (apt.serviceType === 'grooming') return 'Banho e Tosa'
  if (apt.serviceType === 'boarding') return 'Hospedagem'
  return 'Consulta'
}

function serviceIcon(apt: Appointment) {
  if (apt.serviceType === 'grooming') return Scissors
  if (apt.serviceType === 'boarding') return Dog
  return Stethoscope
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { appointments, addAppointment } = useAppointmentStore()
  const { boardingStays } = useBoardingStore()
  const { sales } = useInventoryStore()
  const { groomingStages } = useConfigStore()
  const { clients } = useClientStore()
  const { pets } = usePetStore()
  const { user } = useAuthStore()

  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [schedulePreset, setSchedulePreset] = useState<Partial<Appointment>>({})
  const [petDialogOpen, setPetDialogOpen] = useState(false)
  const [clientDialogOpen, setClientDialogOpen] = useState(false)

  const openSchedule = (preset: Partial<Appointment> = {}) => {
    setSchedulePreset(preset)
    setScheduleOpen(true)
  }

  const todayISO = format(new Date(), 'yyyy-MM-dd')
  const [selectedDateISO, setSelectedDateISO] = useState(todayISO)
  
  const selectedDate = useMemo(() => {
    // Usa meio-dia para evitar problemas de fuso horário ao criar o objeto Date
    return startOfDay(new Date(selectedDateISO + 'T12:00:00'))
  }, [selectedDateISO])

  const isToday = isSameDay(selectedDate, new Date())

  const finalStageId = groomingStages.find((s) => s.isFinal)?.id
  const deliveryStageId = groomingStages.find((s) => s.isDelivery)?.id

  // ── KPI calculations ──────────────────────────────────────────────────────

  const todayApts = appointments.filter(
    (a) => a.serviceType !== 'boarding' && isSameDay(parseISO(a.date), selectedDate) && a.status !== 'cancelled',
  )

  const todayBoardings = boardingStays.filter((b) => {
    const start = startOfDay(parseISO(b.checkIn))
    const end = startOfDay(parseISO(b.actualCheckOut || b.checkOut))
    return selectedDate >= start && selectedDate <= end
  }).length

  const totalHoje = todayApts.length + todayBoardings

  const groomingToday = todayApts.filter((a) => a.serviceType === 'grooming')

  const emEspera = groomingToday.filter(
    (a) => a.status === 'in_progress' && a.groomingStatus === groomingStages.find((s) => s.id === 'waiting')?.id,
  ).length

  const emAtendimento = appointments.filter((a) => a.status === 'in_progress' && isSameDay(parseISO(a.date), selectedDate)).length

  const prontos = groomingToday.filter(
    (a) => a.groomingStatus === finalStageId,
  ).length

  const entreguesHoje = groomingToday.filter(
    (a) => deliveryStageId && a.groomingStatus === deliveryStageId,
  ).length

  const petsInHotel = boardingStays.filter(
    (b) => {
      if (b.status === 'cancelled') return false
      const start = startOfDay(parseISO(b.actualCheckIn || b.checkIn))
      const end = startOfDay(parseISO(b.actualCheckOut || b.checkOut))
      const isActiveOnSelectedDay = selectedDate >= start && selectedDate <= end
      return b.status === 'active' || (b.actualCheckIn && !b.actualCheckOut) || isActiveOnSelectedDay
    }
  ).length

  const minhasConsultas = appointments.filter(
    (a) =>
      isSameDay(parseISO(a.date), selectedDate) &&
      a.serviceType === 'consultation' &&
      a.status !== 'cancelled' &&
      a.professionalId === user?.id,
  ).length

  // ── Today agenda (all, sorted) ─────────────────────────────────────────────

  const todaysAgenda = appointments
    .filter((a) => isSameDay(parseISO(a.date), selectedDate) && a.status !== 'cancelled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // ── Recent activities ──────────────────────────────────────────────────────

  const recentActivities = [
    ...appointments
      .filter((a) => a.status === 'completed' || a.status === 'in_progress')
      .map((a) => {
        const pet = pets.find((p) => p.id === a.petId)
        const badge = aptStatusBadge(a, groomingStages)
        const Icon = serviceIcon(a)
        const isGrooming = a.serviceType === 'grooming'
        return {
          desc: `${pet?.name ?? 'Pet'} — ${serviceLabel(a)}`,
          sub: badge.label,
          date: a.date,
          Icon,
          iconCls: isGrooming ? 'text-purple-600 bg-purple-100' : 'text-blue-600 bg-blue-100',
          badgeCls: badge.cls,
        }
      }),
    ...sales.map((s) => ({
      desc: `Venda registrada`,
      sub: formatCurrency(s.total),
      date: s.date,
      Icon: ShoppingCart,
      iconCls: 'text-green-600 bg-green-100',
      badgeCls: 'bg-green-100 text-green-700',
    })),
    ...clients
      .filter((c) => c.joinedAt && isSameDay(parseISO(c.joinedAt), selectedDate))
      .map((c) => ({
        desc: `Novo tutor: ${c.name}`,
        sub: 'Cadastrado no dia',
        date: c.joinedAt!,
        Icon: UserPlus,
        iconCls: 'text-orange-600 bg-orange-100',
        badgeCls: 'bg-orange-100 text-orange-700',
      })),
  ]
    .filter((a) => a.date && !isNaN(new Date(a.date).getTime()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm mt-0.5">
              {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })} · Bem-vindo de volta!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Input
                type="date"
                className="h-8 text-sm w-36"
                value={selectedDateISO}
                onChange={(e) => setSelectedDateISO(e.target.value)}
              />
              {selectedDateISO !== todayISO && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => setSelectedDateISO(todayISO)}
                  title="Voltar para hoje"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">

          {user?.role === 'veterinarian' ? (
            <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Minha Agenda</p>
                  <p className="text-4xl font-bold mt-1">{minhasConsultas}</p>
                  <p className="text-xs text-muted-foreground mt-1">consultas hoje</p>
                </div>
                <div className="h-12 w-12 shrink-0 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Stethoscope className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Hoje</p>
                  <p className="text-4xl font-bold mt-1">{totalHoje}</p>
                  <p className="text-xs text-muted-foreground mt-1">agendamentos</p>
                </div>
                <div className="h-12 w-12 shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Calendar className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Em Atendimento</p>
                <p className="text-4xl font-bold mt-1">{emAtendimento}</p>
                <p className="text-xs text-muted-foreground mt-1">neste momento</p>
              </div>
              <div className="h-12 w-12 shrink-0 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center">
                <Activity className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prontos</p>
                <p className="text-4xl font-bold mt-1">{prontos}</p>
                <p className="text-xs text-muted-foreground mt-1">aguardando retirada</p>
              </div>
              <div className="h-12 w-12 shrink-0 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Entregues Hoje</p>
                <p className="text-4xl font-bold mt-1">{entreguesHoje}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {petsInHotel > 0 ? `+ ${petsInHotel} no hotel` : isToday ? 'concluídos' : 'no período'}
                </p>
              </div>
              <div className="h-12 w-12 shrink-0 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <PackageCheck className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Left + Center: Ações Rápidas + Agenda */}
          <div className="lg:col-span-2 space-y-6">

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3 pt-4 px-5">
                <CardTitle className="text-base font-semibold">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Agendar', icon: Calendar, cls: 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-100', action: () => openSchedule({}) },
                    { label: 'Novo Pet', icon: Dog, cls: 'text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-100', action: () => setPetDialogOpen(true) },
                    { label: 'Novo Tutor', icon: Users, cls: 'text-cyan-600 bg-cyan-50 hover:bg-cyan-100 border-cyan-100', action: () => setClientDialogOpen(true) },
                    { label: 'Consulta', icon: Stethoscope, cls: 'text-green-600 bg-green-50 hover:bg-green-100 border-green-100', action: () => openSchedule({ serviceType: 'consultation' }) },
                    { label: 'Banho/Tosa', icon: Scissors, cls: 'text-purple-600 bg-purple-50 hover:bg-purple-100 border-purple-100', action: () => openSchedule({ serviceType: 'grooming' }) },
                    { label: 'Vacina', icon: Syringe, cls: 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border-yellow-100', action: () => openSchedule({ serviceType: 'consultation', notes: 'Vacinação' }) },
                    { label: 'Receita', icon: FileText, cls: 'text-sky-600 bg-sky-50 hover:bg-sky-100 border-sky-100', action: () => openSchedule({ serviceType: 'consultation', notes: 'Receita médica' }) },
                  ].map(({ label, icon: Icon, cls, action }) => (
                    <Button
                      key={label}
                      variant="outline"
                      className={cn('h-20 flex flex-col gap-1.5 text-xs font-medium border', cls)}
                      onClick={action}
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </Button>
                  ))}
                  <Button variant="outline" className="h-20 flex flex-col gap-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 border-green-100" asChild>
                    <Link to="/sales">
                      <CreditCard className="h-5 w-5" />
                      Cobrança
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Agenda de Hoje */}
            <Card>
              <CardHeader className="pb-3 pt-4 px-5 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  Agenda {isToday ? 'de Hoje' : `do dia ${format(selectedDate, 'dd/MM')}`}
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" asChild>
                  <Link to="/schedule">Ver completa →</Link>
                </Button>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {todaysAgenda.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                    <Calendar className="h-8 w-8 opacity-30" />
                    <p className="text-sm">Nenhum agendamento para hoje.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todaysAgenda.map((apt) => {
                      const pet = pets.find((p) => p.id === apt.petId)
                      const client = pet ? clients.find((c) => c.id === pet.clientId) : undefined
                      const badge = aptStatusBadge(apt, groomingStages)
                      const Icon = serviceIcon(apt)
                      return (
                        <div
                          key={apt.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          <div className="w-12 text-center shrink-0">
                            <p className="text-sm font-bold text-foreground">{format(new Date(apt.date), 'HH:mm')}</p>
                          </div>
                          <div className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{pet?.name ?? '—'}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {serviceLabel(apt)}{client ? ` · ${client.name}` : ''}
                            </p>
                          </div>
                          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full shrink-0', badge.cls)}>
                            {badge.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Atividade Recente */}
          <div className="space-y-6">

            {/* Status do Banho e Tosa hoje */}
            <Card>
              <CardHeader className="pb-3 pt-4 px-5">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-purple-500" />
                  Banho e Tosa — {isToday ? 'Hoje' : format(selectedDate, 'dd/MM')}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="space-y-2">
                  {[
                    { label: 'Em Espera', value: emEspera, icon: Hourglass, cls: 'text-gray-600 bg-gray-100' },
                    { label: 'Em Atendimento', value: groomingToday.filter((a) => a.status === 'in_progress' && a.groomingStatus !== finalStageId && a.groomingStatus !== deliveryStageId && a.groomingStatus !== 'waiting').length, icon: Activity, cls: 'text-blue-600 bg-blue-100' },
                    { label: 'Prontos', value: prontos, icon: CheckCircle2, cls: 'text-green-600 bg-green-100' },
                    { label: 'Entregues', value: entreguesHoje, icon: PackageCheck, cls: 'text-purple-600 bg-purple-100' },
                  ].map(({ label, value, icon: Icon, cls }) => (
                    <div key={label} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border">
                      <div className="flex items-center gap-2">
                        <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center', cls)}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                      <span className="text-lg font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Atividade Recente */}
            <Card>
              <CardHeader className="pb-3 pt-4 px-5 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <ScrollArea className="h-[280px] pr-2">
                  {recentActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 py-8">
                      <Activity className="h-7 w-7 opacity-30" />
                      <p className="text-xs">Nenhuma atividade recente.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentActivities.map((a, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className={cn('h-8 w-8 rounded-full flex items-center justify-center shrink-0', a.iconCls)}>
                            <a.Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <p className="text-sm font-medium truncate leading-tight">{a.desc}</p>
                            <div className="flex items-center gap-2">
                              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', a.badgeCls)}>
                                {a.sub}
                              </span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                {format(new Date(a.date), "dd/MM 'às' HH:mm")}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      {/* Quick Action Dialogs */}
      <ScheduleDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        appointment={schedulePreset}
        onSave={(apt) => addAppointment(apt)}
      />
      <PetDialog
        open={petDialogOpen}
        onOpenChange={setPetDialogOpen}
        onSave={() => setPetDialogOpen(false)}
      />
      <ClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        onSave={() => setClientDialogOpen(false)}
      />
    </>
  )
}
