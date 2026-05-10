import { useState, useMemo, useEffect, useRef } from 'react'
import { useAppointmentStore } from '@/stores/AppointmentStore'
import { useConfigStore } from '@/stores/ConfigStore'
import { usePetStore } from '@/stores/PetContext'
import { useClientStore } from '@/stores/ClientContext'
import { Appointment, ServiceItem } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Columns, CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { addDays, format, isSameDay, startOfDay, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { UnifiedAtendimentoDialog } from '@/components/shared/UnifiedAtendimentoDialog'
import { CheckinData } from './CheckinDialog'
import { GroomingKanbanCard } from './GroomingKanbanCard'
import { AgendamentoDiaCard } from './AgendamentoDiaCard'
import { ChecklistReviewDialog } from './ChecklistReviewDialog'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import WhatsAppConfirmDialog from '@/components/shared/WhatsAppConfirmDialog'
import { whatsappService } from '@/services/whatsapp-service'

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GroomingPage() {
  const { appointments, addAppointment, updateAppointment, refreshAppointments } = useAppointmentStore()
  const { groomingStages, sendAutoNotification, notificationSettings, notificationLogs, profiles, requireChecklistOnFinish } = useConfigStore()
  const { pets } = usePetStore()
  const { clients } = useClientStore()

  const finalStageId = groomingStages.find((s) => s.isFinal)?.id
  const initialStageId = groomingStages.find((s) => s.isInitial)?.id
  const deliveryStageId = groomingStages.find((s) => s.isDelivery)?.id

  // Live clock — drives time-in-stage display on every card
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  // Dialog state
  const [isCreating, setIsCreating] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [viewMode, setViewMode] = useState(false)

  // Drag-and-drop state
  const [activeDragColumn, setActiveDragColumn] = useState<string | null>(null)
  const isDragging = useRef(false)
  const [pendingWA, setPendingWA] = useState<{ apt: Appointment; clientName: string; petName: string; message: string } | null>(null)
  const [checklistReview, setChecklistReview] = useState<{
    aptId: string
    stageId: string
    targetStage: 'final' | 'delivery'
    items: ServiceItem[]
  } | null>(null)

  // Auto-refresh a cada 5 segundos, pausado durante drag-and-drop
  const [lastRefresh, setLastRefresh] = useState(new Date())
  useEffect(() => {
    const t = setInterval(async () => {
      if (!isDragging.current) {
        await refreshAppointments()
        setLastRefresh(new Date())
      }
    }, 5000)
    return () => clearInterval(t)
  }, [refreshAppointments])

  // Column visibility / order (local preference, not persisted)
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([])
  const [customOrder, setCustomOrder] = useState<string[]>([])

  const displayColumns = useMemo(() => {
    const ordered =
      customOrder.length > 0
        ? [...groomingStages].sort((a, b) => {
            const ia = customOrder.indexOf(a.id)
            const ib = customOrder.indexOf(b.id)
            if (ia === -1) return 1
            if (ib === -1) return -1
            return ia - ib
          })
        : [...groomingStages]

    return ordered.filter((c) => !hiddenColumns.includes(c.id))
  }, [groomingStages, hiddenColumns, customOrder])

  // Filtro de data — padrão = hoje (local)
  const todayISO = format(new Date(), 'yyyy-MM-dd')
  const [filterDate, setFilterDate] = useState<string>(todayISO)

  // Agendamentos do dia: apenas pendentes (sem groomingStatus ainda)
  const todayScheduled = useMemo(() => {
    return appointments.filter((a) => {
      if (a.serviceType !== 'grooming') return false
      if (a.status === 'cancelled') return false
      if (a.groomingStatus) return false
      const isPending = a.status === 'scheduled' || a.status === 'confirmed'
      if (!isPending) return false
      if (!a.date) return false
      const aptDateKey = a.date.split('T')[0]
      return aptDateKey === filterDate
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [appointments, filterDate])

  const activeAppointments = useMemo(() => {
    const selectedDate = startOfDay(new Date(filterDate + 'T12:00:00'))
    return appointments.filter((a) => {
      if (a.serviceType !== 'grooming') return false
      if (a.status === 'cancelled') return false
      // No Kanban só entra quem já deu entrada (tem groomingStatus)
      if (!a.groomingStatus) return false
      const aptDateKey = a.date.split('T')[0]
      return aptDateKey === filterDate
    })
  }, [appointments, filterDate])

  // ── Stage change helpers ──────────────────────────────────────────────────

  const stageTimestamps = (apt: Appointment, newStageId?: string): Partial<Appointment> => {
    const ts = new Date().toLocaleString('sv').replace(' ', 'T')
    const history = apt.stageHistory ?? []
    const updatedHistory = newStageId
      ? [...history.filter((h) => h.stageId !== newStageId), { stageId: newStageId, startedAt: ts }]
      : history
    return {
      currentStageStartedAt: ts,
      stageHistory: updatedHistory,
      ...(newStageId === initialStageId && !apt.startedAt ? { startedAt: ts } : {}),
    }
  }

  const triggerDeliveryWA = (apt: Appointment) => {
    const pet = pets.find((p) => p.id === apt.petId)
    const client = clients.find((c) => c.id === pet?.clientId)
    if (!pet || !client) return
    const aptDate = new Date(apt.date)
    const payload = {
      type: 'banho_tosa_entrega',
      clientId: client.id,
      clientName: client.name,
      petName: pet.name,
      phone: client.phone,
      vars: {
        client_name: client.name,
        pet_name: pet.name,
        date: format(aptDate, 'dd/MM/yyyy', { locale: ptBR }),
        time: format(aptDate, 'HH:mm'),
        service_type: 'Banho e Tosa',
      },
    }
    sendAutoNotification(payload)
  }

  const moveToStage = (apt: Appointment, stageId: string) => {
    if (stageId === deliveryStageId) {
      if (apt.groomingStatus !== finalStageId) {
        toast.error('Só é possível mover para Entregue a partir da etapa Pronto.')
        return
      }
      const checklistItems = (apt.serviceItems ?? []).filter((i) => i.itemType === 'checklist')
      setChecklistReview({ aptId: apt.id, stageId, targetStage: 'delivery', items: checklistItems })
      return
    }
    if (stageId === finalStageId) {
      const checklistItems = (apt.serviceItems ?? []).filter((i) => i.itemType === 'checklist')
      setChecklistReview({ aptId: apt.id, stageId, targetStage: 'final', items: checklistItems })
      return
    }
    updateAppointment({
      ...apt,
      groomingStatus: stageId,
      status: 'in_progress',
      ...stageTimestamps(apt, stageId),
    } as Appointment)
    toast.success('Status atualizado!')
  }

  const handleChecklistReviewConfirm = (updatedItems: ServiceItem[]) => {
    if (!checklistReview) return
    const apt = appointments.find((a) => a.id === checklistReview.aptId)
    if (!apt) return

    const mergedItems = (apt.serviceItems ?? []).map((i) => {
      const updated = updatedItems.find((u) => u.id === i.id)
      return updated ? { ...i, checked: updated.checked } : i
    })

    if (checklistReview.targetStage === 'delivery') {
      // Inclui status: 'completed', completedAt e tutorNotified no mesmo pacote
      // para evitar condição de corrida com triggerDeliveryWA
      updateAppointment({
        ...apt,
        status: 'completed',
        groomingStatus: checklistReview.stageId,
        completedAt: new Date().toLocaleString('sv').replace(' ', 'T'),
        serviceItems: mergedItems,
        tutorNotified: true,
        ...stageTimestamps(apt, checklistReview.stageId),
      } as Appointment)
      toast.success('Entregue ao tutor!')
      triggerDeliveryWA(apt)
    } else {
      const pet = pets.find((p) => p.id === apt.petId)
      const client = pet ? clients.find((c) => c.id === pet.clientId) : undefined
      const notifiedAt = new Date().toLocaleString('sv').replace(' ', 'T')
      const vars = pet && client ? {
        client_name: client.name,
        pet_name: pet.name,
        date: format(new Date(apt.date), 'dd/MM/yyyy', { locale: ptBR }),
        time: format(new Date(apt.date), 'HH:mm'),
        service_type: 'Banho e Tosa',
      } : null
      const template = vars ? notificationSettings.templates.find(
        (t) => t.type === 'banho_tosa_pronto' && t.active,
      ) : null
      const notifiedMessage = template && vars ? whatsappService.interpolate(template.content, vars) : undefined

      updateAppointment({
        ...apt,
        status: 'in_progress',
        groomingStatus: checklistReview.stageId,
        serviceItems: mergedItems,
        tutorNotified: !!notifiedMessage,
        tutorNotifiedAt: notifiedMessage ? notifiedAt : undefined,
        tutorNotifiedMessage: notifiedMessage,
        ...stageTimestamps(apt, checklistReview.stageId),
      } as Appointment)
      toast.success('Pet pronto! Aguardando entrega.')
      if (pet && client && vars) {
        sendAutoNotification({
          type: 'banho_tosa_pronto',
          clientId: client.id,
          clientName: client.name,
          petName: pet.name,
          phone: client.phone,
          vars,
        })
      }
    }
    setChecklistReview(null)
  }

  // ── Appointment CRUD ──────────────────────────────────────────────────────

  const handleSaveAppointment = (data: Partial<Appointment>) => {
    if (!data.petId || !data.price || !data.date)
      return toast.error('Preencha os campos obrigatórios: pet, data e serviços')

    if (editingAppointment) {
      updateAppointment({
        ...editingAppointment,
        ...data,
        ...stageTimestamps(editingAppointment, data.groomingStatus),
      } as Appointment)
      setEditingAppointment(null)
      toast.success('Serviço atualizado!')
    } else {
      addAppointment({
        id: Math.random().toString(36).slice(2, 11),
        serviceType: 'grooming',
        status: 'scheduled',
        ...data,
      } as Appointment)
      setIsCreating(false)
      toast.success('Serviço agendado!')
    }
  }

  // ── Check-in: move agendamento do dia para o primeiro stage do fluxo ────────

  const handleCheckin = (apt: Appointment, data: CheckinData) => {
    const firstStage = displayColumns[0]
    if (!firstStage) return
    if (data.newDate) setFilterDate(todayISO)

    const now = new Date().toLocaleString('sv').replace(' ', 'T')
    // Stages antes do isInitial recebem checkinArrivalTime; isInitial em diante recebem now
    const initialIdx = groomingStages.findIndex((s) => s.isInitial)
    const firstStageIdx = groomingStages.findIndex((s) => s.id === firstStage.id)
    const splitIdx = initialIdx >= 0 ? initialIdx : firstStageIdx
    const initialHistory = groomingStages
      .filter((s) => !s.isDelivery)
      .map((s, idx) => {
        const stageIdx = groomingStages.indexOf(s)
        if (stageIdx < splitIdx) return { stageId: s.id, startedAt: data.checkinArrivalTime }
        if (stageIdx === splitIdx) return { stageId: s.id, startedAt: now }
        return null
      })
      .filter(Boolean) as Array<{ stageId: string; startedAt: string }>

    updateAppointment({
      ...apt,
      groomingStatus: firstStage.id,
      status: 'in_progress',
      ...(data.newDate ? { date: data.newDate } : {}),
      checkinArrivalTime: data.checkinArrivalTime,
      checkinMatting: data.checkinMatting,
      checkinFleas: data.checkinFleas,
      checkinBehavior: data.checkinBehavior,
      checkinNotes: data.checkinNotes,
      currentStageStartedAt: now,
      startedAt: now,
      stageHistory: initialHistory,
    } as Appointment)
    const pet = pets.find((p) => p.id === apt.petId)
    const client = clients.find((c) => c.id === pet?.clientId)
    if (pet && client) {
      const aptDate = new Date(apt.date)
      sendAutoNotification({
        type: 'banho_tosa_checkin',
        clientId: client.id,
        clientName: client.name,
        petName: pet.name,
        phone: client.phone,
        vars: {
          client_name: client.name,
          pet_name: pet.name,
          date: format(aptDate, 'dd/MM/yyyy', { locale: ptBR }),
          time: format(aptDate, 'HH:mm'),
          service_type: 'Banho e Tosa',
        },
      })
    }
    toast.success(`${pet?.name ?? 'Pet'} recebido!`)
  }

  // ── No-show ───────────────────────────────────────────────────────────────

  const handleNoShow = (apt: Appointment) => {
    updateAppointment({ ...apt, status: 'no_show' } as Appointment)
    toast.info(`Falta registrada para ${pets.find(p => p.id === apt.petId)?.name ?? 'pet'}.`)
  }

  // ── Card quick-action handlers ────────────────────────────────────────────

  const handleNextStage = (e: React.MouseEvent, apt: Appointment) => {
    e.stopPropagation()
    const idx = displayColumns.findIndex((c) => c.id === apt.groomingStatus)
    const next = displayColumns[idx + 1]
    if (next) moveToStage(apt, next.id)
  }

  const handleWhatsApp = (e: React.MouseEvent, apt: Appointment) => {
    e.stopPropagation()
    const pet = pets.find((p) => p.id === apt.petId)
    const client = clients.find((c) => c.id === pet?.clientId)
    if (pet && client) {
      const aptDate = new Date(apt.date)
      const vars = {
        client_name: client.name,
        pet_name: pet.name,
        date: format(aptDate, 'dd/MM/yyyy', { locale: ptBR }),
        time: format(aptDate, 'HH:mm'),
        service_type: 'Banho e Tosa',
      }
      const templateType =
        apt.groomingStatus === deliveryStageId ? 'banho_tosa_entrega'
        : apt.groomingStatus === finalStageId  ? 'banho_tosa_pronto'
        : 'banho_tosa_pronto'
      const template = notificationSettings.templates.find(
        (t) => t.type === templateType && t.active,
      )
      const message = template
        ? whatsappService.interpolate(template.content, vars)
        : ''
      setPendingWA({ apt, clientName: client.name, petName: pet.name, message })
    }
  }

  const handleConfirmWA = (_message: string) => {
    if (!pendingWA) return
    const pet = pets.find((p) => p.id === pendingWA.apt.petId)
    const client = clients.find((c) => c.name === pendingWA.clientName)
    // busca o apt atualizado do store para não sobrescrever status recente
    const currentApt = appointments.find((a) => a.id === pendingWA.apt.id)
    if (pet && client && currentApt) {
      const aptDate = new Date(currentApt.date)
      const waType =
        currentApt.groomingStatus === deliveryStageId ? 'banho_tosa_entrega'
        : 'banho_tosa_pronto'
      sendAutoNotification({
        type: waType,
        clientId: client.id,
        clientName: client.name,
        petName: pet.name,
        phone: client.phone,
        vars: {
          client_name: client.name,
          pet_name: pet.name,
          date: format(aptDate, 'dd/MM/yyyy', { locale: ptBR }),
          time: format(aptDate, 'HH:mm'),
          service_type: 'Banho e Tosa',
        },
      })
      const notifiedAt = new Date().toLocaleString('sv').replace(' ', 'T')
      updateAppointment({
        ...currentApt,
        tutorNotified: true,
        tutorNotifiedAt: notifiedAt,
        tutorNotifiedMessage: pendingWA.message,
      } as Appointment)
    }
    setPendingWA(null)
  }

  // ── Drag-and-drop handlers ────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, apt: Appointment) => {
    // Block drag only from delivery stage (last stage); final can move to delivery
    if (apt.groomingStatus === deliveryStageId) {
      e.preventDefault()
      return
    }
    isDragging.current = true
    e.dataTransfer.setData('appointmentId', apt.id)
  }

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    if (activeDragColumn !== stageId) setActiveDragColumn(stageId)
  }

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    isDragging.current = false
    const aptId = e.dataTransfer.getData('appointmentId')
    setActiveDragColumn(null)
    if (!aptId) return
    const apt = appointments.find((a) => a.id === aptId)
    if (apt) moveToStage(apt, stageId)
  }

  // ── Column view settings ──────────────────────────────────────────────────

  const toggleColumn = (id: string) =>
    setHiddenColumns((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )

  const moveColumn = (id: string, dir: 'up' | 'down') => {
    const base = customOrder.length > 0 ? customOrder : groomingStages.map((s) => s.id)
    const idx = base.indexOf(id)
    if (idx === -1) return
    const next = [...base]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setCustomOrder(next)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-[calc(100vh-140px)]">

      <div className="flex justify-between items-center shrink-0">
        <div className="flex gap-2">
          {/* Filtro de data */}
          <div className="flex items-center gap-1 rounded-xl border bg-white p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => setFilterDate(format(subDays(new Date(filterDate + 'T12:00:00'), 1), 'yyyy-MM-dd'))}
              title="Dia anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="h-8 px-3 rounded-lg font-medium text-sm capitalize"
              onClick={() => setFilterDate(todayISO)}
              title="Ir para hoje"
            >
              {format(new Date(filterDate + 'T12:00:00'), "dd 'de' MMM", { locale: ptBR })}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => setFilterDate(format(addDays(new Date(filterDate + 'T12:00:00'), 1), 'yyyy-MM-dd'))}
              title="Próximo dia"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="mr-2 h-4 w-4" /> Visualização
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <h4 className="font-medium leading-none mb-2">Colunas Visíveis</h4>
                {groomingStages.map((stage) => (
                  <div key={stage.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`col-${stage.id}`}
                        checked={!hiddenColumns.includes(stage.id)}
                        onCheckedChange={() => toggleColumn(stage.id)}
                      />
                      <Label htmlFor={`col-${stage.id}`}>{stage.title}</Label>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4"
                        onClick={() => moveColumn(stage.id, 'up')}
                      >↑</Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4"
                        onClick={() => moveColumn(stage.id, 'down')}
                      >↓</Button>
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Kanban board */}
      <ScrollArea className="flex-1 w-full whitespace-nowrap rounded-md border bg-muted/20">
        <div className="flex space-x-4 p-4 min-w-full">

          {/* ── Coluna fixa: Agendamentos do Dia ── */}
          <div className="flex-1 min-w-[220px] flex flex-col gap-3 bg-violet-50/60 p-3 rounded-xl border border-violet-200 h-full">
            <div className="flex items-center justify-between p-3 rounded-lg font-semibold shadow-sm select-none bg-violet-100 text-violet-800">
              <div className="flex items-center gap-2 truncate">
                <CalendarClock className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {filterDate === todayISO
                    ? 'Agenda Hoje'
                    : new Date(filterDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </span>
              </div>
              <Badge variant="secondary" className="bg-white/60 ml-2 shrink-0 text-slate-900">
                {todayScheduled.length}
              </Badge>
            </div>

            <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
              {todayScheduled.map((apt) => {
                const pet = pets.find((p) => p.id === apt.petId)
                const client = pet ? clients.find((c) => c.id === pet.clientId) : undefined
                const professional = apt.professionalId
                  ? profiles.find((p) => p.id === apt.professionalId)
                  : undefined
                return (
                  <AgendamentoDiaCard
                    key={apt.id}
                    apt={apt}
                    pet={pet}
                    client={client}
                    professional={professional}
                    onCheckin={(data) => handleCheckin(apt, data)}
                    onNextStage={(e) => handleNextStage(e, apt)}
                    onNoShow={() => handleNoShow(apt)}
                    onEdit={() => { setEditingAppointment(apt); setViewMode(false) }}
                    onView={() => { setEditingAppointment(apt); setViewMode(true) }}
                  />
                )
              })}

              {todayScheduled.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-violet-200 rounded-lg min-h-[100px] text-center px-2">
                  Nenhum agendamento para hoje
                </div>
              )}
            </div>
          </div>

          {displayColumns.map((stage) => {
            const stageApts = activeAppointments
              .filter((a) => a.groomingStatus === stage.id)
              .sort((a, b) =>
                stage.id === deliveryStageId
                  ? new Date(b.date).getTime() - new Date(a.date).getTime()
                  : new Date(a.date).getTime() - new Date(b.date).getTime()
              )

            return (
              <div
                key={stage.id}
                className={cn(
                  'flex-1 min-w-[220px] flex flex-col gap-3 bg-muted/40 p-3 rounded-xl border border-dashed h-full transition-colors',
                  activeDragColumn === stage.id && 'bg-accent border-primary/50',
                )}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={() => setActiveDragColumn(null)}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {/* Column header */}
                <div
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg font-semibold shadow-sm select-none',
                    stage.color,
                  )}
                >
                  <span className="truncate">{stage.title}</span>
                  <Badge variant="secondary" className="bg-white/50 ml-2 text-slate-900">
                    {stageApts.length}
                  </Badge>
                </div>

                {/* Cards */}
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                  {stageApts.map((apt) => {
                    const pet = pets.find((p) => p.id === apt.petId)
                    const client = pet ? clients.find((c) => c.id === pet.clientId) : undefined
                    const professional = apt.professionalId
                      ? profiles.find((p) => p.id === apt.professionalId)
                      : undefined
                    const isFinal = apt.groomingStatus === finalStageId || apt.groomingStatus === deliveryStageId
                    const isDeliveryAvailable = !!deliveryStageId && apt.groomingStatus === finalStageId
                    const isNextAvailable =
                      !isFinal &&
                      !isDeliveryAvailable &&
                      displayColumns.findIndex((c) => c.id === apt.groomingStatus) <
                        displayColumns.length - 1
                    const isInitialStage = apt.groomingStatus === initialStageId

                    return (
                      <GroomingKanbanCard
                        key={apt.id}
                        apt={apt}
                        pet={pet}
                        client={client}
                        professional={professional}
                        isFinal={isFinal}
                        isDeliveryStage={apt.groomingStatus === deliveryStageId}
                        isDeliveryAvailable={isDeliveryAvailable}
                        isNextStageAvailable={isNextAvailable}
                        isInitialStage={isInitialStage}
                        notificationLogs={notificationLogs}
                        groomingStages={groomingStages}
                        stageColor={stage.color}
                        now={now}
                        onOpen={() => { setEditingAppointment(apt); setViewMode(false) }}
                        onView={() => { setEditingAppointment(apt); setViewMode(true) }}
                        onNextStage={(e) => handleNextStage(e, apt)}
                        onDeliver={(e) => { e.stopPropagation(); moveToStage(apt, deliveryStageId!) }}
                        onWhatsApp={(e) => handleWhatsApp(e, apt)}
                        onEdit={() => { setEditingAppointment(apt); setViewMode(false) }}
                        onDragStart={(e) => handleDragStart(e, apt)}
                      />
                    )
                  })}

                  {stageApts.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed rounded-lg min-h-[100px] pointer-events-none">
                      Arraste aqui
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Appointment dialog (create / edit / read-only) */}
      <UnifiedAtendimentoDialog
        key={editingAppointment?.id ?? (isCreating ? '__new__' : '__closed__')}
        open={isCreating || !!editingAppointment}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false)
            setEditingAppointment(null)
            setViewMode(false)
          }
        }}
        onSave={() => {
          setIsCreating(false)
          setEditingAppointment(null)
        }}
        appointment={editingAppointment ?? (isCreating ? { serviceType: 'grooming' } : undefined)}
        readOnly={viewMode || (!!editingAppointment && (editingAppointment.groomingStatus === finalStageId || editingAppointment.groomingStatus === deliveryStageId))}
      />

      <ChecklistReviewDialog
        open={!!checklistReview}
        targetStage={checklistReview?.targetStage ?? 'final'}
        checklistItems={checklistReview?.items ?? []}
        canSkipChecklist={!requireChecklistOnFinish}
        onConfirm={handleChecklistReviewConfirm}
        onCancel={() => setChecklistReview(null)}
      />

      <WhatsAppConfirmDialog
        open={!!pendingWA}
        onOpenChange={(open) => { if (!open) setPendingWA(null) }}
        clientName={pendingWA?.clientName ?? ''}
        petName={pendingWA?.petName}
        defaultMessage={pendingWA?.message ?? ''}
        onConfirm={handleConfirmWA}
      />

      <Button
        onClick={() => setIsCreating(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-5 py-3 shadow-lg hover:shadow-xl"
        size="lg"
      >
        <Plus className="h-5 w-5" />
        Novo Atendimento
      </Button>
    </div>
  )
}
