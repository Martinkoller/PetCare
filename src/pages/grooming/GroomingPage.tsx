import { useState, useMemo, useEffect, useRef } from 'react'
import { useAppointmentStore } from '@/stores/AppointmentStore'
import { useConfigStore } from '@/stores/ConfigStore'
import { usePetStore } from '@/stores/PetContext'
import { useClientStore } from '@/stores/ClientContext'
import { Appointment, ServiceItem } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Columns, CalendarClock, X } from 'lucide-react'
import { toast } from 'sonner'
import { format, isSameDay, parseISO, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AppointmentDialog } from './GroomingDialogs'
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
import { Input } from '@/components/ui/input'
import WhatsAppConfirmDialog from '@/components/shared/WhatsAppConfirmDialog'
import { whatsappService } from '@/services/whatsapp-service'

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GroomingPage() {
  const { appointments, addAppointment, updateAppointment, refreshAppointments } = useAppointmentStore()
  const { groomingStages, sendAutoNotification, notificationSettings, profiles, requireChecklistOnFinish } = useConfigStore()
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

  // Drag-and-drop state
  const [activeDragColumn, setActiveDragColumn] = useState<string | null>(null)
  const isDragging = useRef(false)
  const [pendingDrop, setPendingDrop] = useState<{ aptId: string; stageId: string } | null>(null)
  const [pendingWA, setPendingWA] = useState<{ apt: Appointment; clientName: string; petName: string; message: string } | null>(null)
  const [checklistPending, setChecklistPending] = useState<{ aptId: string; stageId: string; items: ServiceItem[] } | null>(null)
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

  // Agendamentos do dia: status 'scheduled' ou 'confirmed', respeita filtro de data
  const todayScheduled = useMemo(() => {
    const selectedDate = startOfDay(new Date(filterDate + 'T12:00:00'))
    return appointments.filter((a) => {
      if (a.serviceType !== 'grooming') return false
      // Mostra apenas o que não iniciou o fluxo de banho (sem groomingStatus)
      // e que não está cancelado
      if (a.status === 'cancelled') return false
      if (a.groomingStatus) return false
      
      // Inclui agendados e confirmados que ainda não deram entrada
      const isPending = a.status === 'scheduled' || a.status === 'confirmed'
      if (!isPending) return false
      
      if (!a.date) return false
      return isSameDay(parseISO(a.date), selectedDate)
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [appointments, filterDate])

  const activeAppointments = useMemo(() => {
    const selectedDate = startOfDay(new Date(filterDate + 'T12:00:00'))
    return appointments.filter((a) => {
      if (a.serviceType !== 'grooming') return false
      if (a.status === 'cancelled') return false
      // No Kanban só entra quem já deu entrada (tem groomingStatus)
      if (!a.groomingStatus) return false
      return isSameDay(parseISO(a.date), selectedDate)
    })
  }, [appointments, filterDate])

  // ── Stage change helpers ──────────────────────────────────────────────────

  const stageTimestamps = (apt: Appointment, newStageId?: string): Partial<Appointment> => {
    const ts = new Date().toISOString()
    return {
      currentStageStartedAt: ts,
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
        completedAt: new Date().toISOString(),
        serviceItems: mergedItems,
        tutorNotified: true,
        ...stageTimestamps(apt, checklistReview.stageId),
      } as Appointment)
      toast.success('Entregue ao tutor!')
      triggerDeliveryWA(apt)
    } else {
      updateAppointment({
        ...apt,
        status: 'completed',
        groomingStatus: checklistReview.stageId,
        completedAt: new Date().toISOString(),
        serviceItems: mergedItems,
      } as Appointment)
      toast.success('Atendimento finalizado!')
      const pet = pets.find((p) => p.id === apt.petId)
      const client = clients.find((c) => c.id === pet?.clientId)
      if (pet && client) {
        const aptDate = new Date(apt.date)
        sendAutoNotification({
          type: 'banho_tosa_pronto',
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

  const doFinalize = (aptId: string, stageId: string) => {
    const apt = appointments.find((a) => a.id === aptId)
    if (apt) {
      updateAppointment({
        ...apt,
        status: 'completed',
        groomingStatus: stageId,
        completedAt: new Date().toISOString(),
      } as Appointment)
    }
    toast.success('Atendimento finalizado!')
  }


  // ── Check-in: move agendamento do dia para o primeiro stage do fluxo ────────

  const handleCheckin = (apt: Appointment) => {
    const firstStage = displayColumns[0]
    if (!firstStage) return
    updateAppointment({
      ...apt,
      groomingStatus: firstStage.id,
      status: 'in_progress',
      ...stageTimestamps(apt, firstStage.id),
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
    toast.success(`${apt.petId ? 'Pet' : 'Atendimento'} iniciado!`)
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
      const template = notificationSettings.templates.find(
        (t) => t.type === 'banho_tosa_pronto' && t.active,
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
      sendAutoNotification({
        type: 'banho_tosa_pronto',
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
      updateAppointment({ ...currentApt, tutorNotified: true } as Appointment)
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

      {/* Page header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banho e Tosa</h1>
          <p className="text-muted-foreground text-sm">
            Fluxo de atendimento.
            <span className="ml-2 text-xs text-muted-foreground/60">
              Atualizado às {lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          {/* Filtro de data */}
          <div className="flex items-center gap-1">
            <Input
              type="date"
              className="h-8 text-sm w-36"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            {filterDate !== todayISO && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => setFilterDate(todayISO)}
                title="Voltar para hoje"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
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
          <Button size="sm" onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo Atendimento
          </Button>
        </div>
      </div>

      {/* Kanban board */}
      <ScrollArea className="flex-1 w-full whitespace-nowrap rounded-md border bg-muted/20">
        <div className="flex space-x-4 p-4">

          {/* ── Coluna fixa: Agendamentos do Dia ── */}
          <div className="w-52 shrink-0 flex flex-col gap-3 bg-violet-50/60 p-3 rounded-xl border border-violet-200 h-full">
            <div className="flex items-center justify-between p-3 rounded-lg font-semibold shadow-sm select-none bg-violet-100 text-violet-800">
              <div className="flex items-center gap-2 truncate">
                <CalendarClock className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {filterDate === todayISO
                    ? 'Agenda Hoje'
                    : new Date(filterDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </span>
              </div>
              <Badge variant="secondary" className="bg-white/60 ml-2 shrink-0">
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
                    onCheckin={() => handleCheckin(apt)}
                    onEdit={(e) => { e.stopPropagation(); setEditingAppointment(apt) }}
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
            const stageApts = activeAppointments.filter((a) => a.groomingStatus === stage.id)

            return (
              <div
                key={stage.id}
                className={cn(
                  'w-72 shrink-0 flex flex-col gap-3 bg-muted/40 p-3 rounded-xl border border-dashed h-full transition-colors',
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
                  <Badge variant="secondary" className="bg-white/50 ml-2">
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

                    return (
                      <GroomingKanbanCard
                        key={apt.id}
                        apt={apt}
                        pet={pet}
                        client={client}
                        professional={professional}
                        isFinal={isFinal}
                        isDeliveryAvailable={isDeliveryAvailable}
                        isNextStageAvailable={isNextAvailable}
                        now={now}
                        onOpen={() => setEditingAppointment(apt)}
                        onNextStage={(e) => handleNextStage(e, apt)}
                        onDeliver={(e) => { e.stopPropagation(); moveToStage(apt, deliveryStageId!) }}
                        onWhatsApp={(e) => handleWhatsApp(e, apt)}
                        onEdit={(e) => { e.stopPropagation(); setEditingAppointment(apt) }}
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
      <AppointmentDialog
        open={isCreating || !!editingAppointment}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false)
            setEditingAppointment(null)
          }
        }}
        onSave={handleSaveAppointment}
        appointment={editingAppointment ?? undefined}
        pets={pets}
        stages={groomingStages}
        readOnly={!!editingAppointment && (editingAppointment.groomingStatus === finalStageId || editingAppointment.groomingStatus === deliveryStageId)}
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
    </div>
  )
}
