import { useMemo, useState } from 'react'
import {
  addDays,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  startOfDay,
  isBefore,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import {
  Appointment,
  Pet,
  Client,
  Profile,
} from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from '@/components/ui/context-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Pencil, XCircle, Trash2, CalendarDays, Plus } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface MonthViewProps {
  currentDate: Date
  events: Appointment[]
  pets?: Pet[]
  clients?: Client[]
  profiles?: Profile[]
  onEventClick: (event: Appointment) => void
  onCancelAppointment: (event: Appointment) => void
  onDeleteAppointment: (event: Appointment) => void
  onUpdateStatus?: (id: string, status: Appointment['status']) => void
  onTimeClick: (date: Date) => void
  onEventDrop: (event: Appointment, newDate: Date) => void
  activeProfiles?: string[]
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MAX_VISIBLE_EVENTS = 3

const statusLabels: Record<string, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  in_progress: 'Em Atendimento',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
  checked_in: 'Hospedado',
  checked_out: 'Encerrado',
};

function getStatusDotClass(status: string) {
  switch (status) {
    case 'scheduled':
      return 'bg-slate-500'
    case 'confirmed':
      return 'bg-blue-500'
    case 'in_progress':
      return 'bg-amber-500'
    case 'completed':
      return 'bg-green-500'
    case 'cancelled':
      return 'bg-red-500'
    default:
      return 'bg-slate-400'
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'scheduled':
      return (
        <Badge
          variant="outline"
          className="bg-slate-50 text-slate-700 border-slate-200 text-[9px] h-4 px-1.5"
        >
          Agendado
        </Badge>
      )
    case 'confirmed':
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-800 border-blue-200 text-[9px] h-4 px-1.5"
        >
          Confirmado
        </Badge>
      )
    case 'in_progress':
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-800 border-amber-200 text-[9px] h-4 px-1.5"
        >
          Em Atendimento
        </Badge>
      )
    case 'completed':
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 border-green-200 text-[9px] h-4 px-1.5"
        >
          Finalizado
        </Badge>
      )
    case 'cancelled':
      return (
        <Badge
          variant="secondary"
          className="bg-red-100 text-red-800 border-red-200 text-[9px] h-4 px-1.5"
        >
          Cancelado
        </Badge>
      )
    default:
      return null
  }
}

function getServiceLabel(serviceType?: string) {
  switch (serviceType) {
    case 'grooming':
      return 'Banho e Tosa'
    case 'consultation':
      return 'Consulta'
    default:
      return 'Atendimento'
  }
}

export function MonthView({
  currentDate,
  events,
  pets = [],
  clients = [],
  profiles = [],
  onEventClick,
  onCancelAppointment,
  onDeleteAppointment,
  onUpdateStatus,
  onTimeClick,
  onEventDrop,
  activeProfiles = [],
}: MonthViewProps) {
  const [confirmCancel, setConfirmCancel] = useState<Appointment | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Appointment | null>(null)
  const [summaryDay, setSummaryDay] = useState<Date | null>(null)
  const [dragOverDay, setDragOverDay] = useState<string | null>(null)

  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate])
  const calendarStart = useMemo(
    () => startOfWeek(monthStart, { weekStartsOn: 0 }),
    [monthStart],
  )

  // Sempre 6 semanas completas, agrupadas por semana
  const weeks = useMemo(() => {
    const result: Date[][] = []
    let cursor = calendarStart
    for (let w = 0; w < 6; w++) {
      const week: Date[] = []
      for (let i = 0; i < 7; i++) {
        week.push(cursor)
        cursor = addDays(cursor, 1)
      }
      result.push(week)
    }
    return result
  }, [calendarStart])

  const calendarDays = useMemo(() => weeks.flat(), [weeks])

  const filteredEvents = useMemo(() => {
    return events
      .filter((evt) => evt.serviceType !== 'boarding')
      .filter((evt) => {
        if (activeProfiles.length === 0) return true

        const profId = evt.professionalId || 'unassigned'
        return activeProfiles.includes(profId)
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [events, activeProfiles])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>()

    for (const day of calendarDays) {
      const key = format(day, 'yyyy-MM-dd')
      map.set(key, [])
    }

    for (const evt of filteredEvents) {
      const evtDate = new Date(evt.date)
      const key = format(evtDate, 'yyyy-MM-dd')

      if (!map.has(key)) continue
      map.get(key)!.push(evt)
    }

    for (const [key, list] of map.entries()) {
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      map.set(key, list)
    }

    return map
  }, [calendarDays, filteredEvents])

  const handleDropOnDay = (day: Date, eventId: string) => {
    const evt = filteredEvents.find((item) => item.id === eventId)
    if (!evt) return

    const originalDate = new Date(evt.date)
    const newDate = new Date(day)
    newDate.setHours(
      originalDate.getHours(),
      originalDate.getMinutes(),
      0,
      0,
    )

    onEventDrop(evt, newDate)
  }

  const renderEventCard = (evt: Appointment) => {
    const pet = pets.find((p) => p.id === evt.petId)
    const professional = profiles.find((p) => p.id === evt.professionalId)
    const client = pet ? clients.find((c) => c.id === pet.clientId) : undefined
    const serviceLabel = getServiceLabel(evt.serviceType)
    const timeLabel = format(new Date(evt.date), 'HH:mm')

    const statusDot = getStatusDotClass(evt.status)
    const substatus = evt.clinicalStatus || evt.groomingStatus;

    return (
      <ContextMenu key={evt.id}>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              'rounded-lg border px-2 py-1.5 text-left shadow-sm cursor-pointer transition-all hover:shadow-md',
              evt.status === 'scheduled' && 'bg-slate-50 border-slate-200 text-slate-800',
              evt.status === 'confirmed' && 'bg-blue-50 border-blue-200 text-blue-900',
              evt.status === 'in_progress' && 'bg-amber-50 border-amber-200 text-amber-900',
              evt.status === 'completed' && 'bg-green-50 border-green-200 text-green-900',
              evt.status === 'cancelled' && 'bg-red-50 border-red-200 text-red-900',
              evt.serviceType === 'hospitalization' && 'border-l-red-500 border-l-2',
            )}
            onClick={() => onEventClick(evt)}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', evt.id)}
            title={[
              `${timeLabel} - ${serviceLabel}`,
              pet ? `Pet: ${pet.name}` : '',
              client ? `Tutor: ${client.name}` : '',
              professional ? `${professional.name}` : 'Sem responsável',
              `${statusLabels[evt.status] || evt.status}`,
            ]
              .filter(Boolean)
              .join('\n')}
          >
            <div className="flex items-start justify-between gap-1 overflow-hidden">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 min-w-0">
                  <span className={cn('h-2 w-2 rounded-full shrink-0', statusDot)} />
                  <span className="text-[9px] font-bold shrink-0">{timeLabel}</span>
                  <span className="text-[10px] font-bold truncate">
                    {pet?.name || 'Pet'}
                  </span>
                </div>

                <div className="flex items-center gap-1 mt-0.5">
                  {evt.serviceType === 'hospitalization' && (
                    <span className="text-[8px] font-bold text-red-600 bg-red-50 px-0.5 rounded border border-red-200">INT</span>
                  )}

                </div>
              </div>
            </div>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onClick={() => onEventClick(evt)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </ContextMenuItem>

          <ContextMenuSeparator />

          {evt.status === 'scheduled' && (
            <ContextMenuItem onClick={() => onUpdateStatus?.(evt.id, 'confirmed')}>
              <Badge className="mr-2 h-2 w-2 rounded-full bg-blue-500 p-0" />
              Confirmar Atendimento
            </ContextMenuItem>
          )}

          {evt.status !== 'cancelled' && evt.status !== 'completed' && (
            <ContextMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirmCancel(evt)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancelar Agendamento
            </ContextMenuItem>
          )}

          {evt.status === 'cancelled' && (
            <ContextMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirmDelete(evt)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Agendamento
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  return (
    <div className="flex flex-col h-full border rounded-2xl bg-background overflow-hidden shadow-sm">
      {/* Cabeçalho dos dias */}
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {WEEK_DAYS.map((label) => (
          <div
            key={label}
            className="px-2 py-3 text-center text-sm font-semibold text-muted-foreground border-r last:border-r-0"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Grade mensal — uma linha por semana */}
      <div className="flex flex-col flex-1">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 flex-1 border-b last:border-b-0">
            {week.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd')
              const dayEvents = eventsByDay.get(dayKey) || []
              const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS)
              const hiddenCount = Math.max(dayEvents.length - MAX_VISIBLE_EVENTS, 0)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isToday = isSameDay(day, new Date())
              const isDragOver = dragOverDay === dayKey
              const isFirstOfMonth = day.getDate() === 1

              return (
                <div
                  key={dayKey}
                  className={cn(
                    'border-r last:border-r-0 p-2 relative transition-colors',
                    !isCurrentMonth && 'bg-muted/20',
                    isDragOver && 'bg-orange-50',
                  )}
                  onDragOver={(e) => { e.preventDefault(); setDragOverDay(dayKey) }}
                  onDragLeave={() => { if (dragOverDay === dayKey) setDragOverDay(null) }}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOverDay(null)
                    const eventId = e.dataTransfer.getData('text/plain')
                    if (!eventId) return
                    handleDropOnDay(day, eventId)
                  }}
                >
                  {/* Número do dia + mês no dia 1 */}
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto w-full justify-start rounded-lg p-0 hover:bg-transparent"
                    onClick={() => onTimeClick(day)}
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          'inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-semibold',
                          isToday
                            ? 'bg-orange-500 text-white'
                            : isCurrentMonth
                              ? 'text-foreground'
                              : 'text-muted-foreground',
                        )}
                      >
                        {format(day, 'd', { locale: ptBR })}
                      </div>
                      {isFirstOfMonth && (
                        <span className={cn(
                          'text-xs font-semibold capitalize',
                          isCurrentMonth ? 'text-muted-foreground' : 'text-muted-foreground/60',
                        )}>
                          {format(day, 'MMM', { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </Button>

                  {/* Lista de eventos */}
                  <div className="mt-1.5 space-y-1.5">
                    {visibleEvents.map((evt) => renderEventCard(evt))}
                    {hiddenCount > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto w-full justify-start rounded-lg px-2 py-1 text-[11px] font-medium text-orange-600 hover:bg-orange-50"
                        onClick={() => setSummaryDay(day)}
                      >
                        +{hiddenCount} agendamento{hiddenCount > 1 ? 's' : ''}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <Dialog open={!!confirmCancel} onOpenChange={() => setConfirmCancel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Agendamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar este agendamento?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCancel(null)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmCancel) onCancelAppointment(confirmCancel)
                setConfirmCancel(null)
              }}
            >
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Agendamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o agendamento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmDelete) onDeleteAppointment(confirmDelete)
                setConfirmDelete(null)
              }}
            >
              Sim, Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!summaryDay} onOpenChange={() => setSummaryDay(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-2xl shadow-2xl">
          <DialogHeader className="p-6 bg-orange-500 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl">Resumo do Dia</DialogTitle>
                <DialogDescription className="text-orange-50 opacity-90">
                  {summaryDay && format(summaryDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] p-6 bg-white">
            <div className="space-y-4">
              {summaryDay && (() => {
                const dayKey = format(summaryDay, 'yyyy-MM-dd')
                const dayEvents = eventsByDay.get(dayKey) || []

                if (dayEvents.length === 0) {
                  return <div className="text-center py-8 text-muted-foreground">Nenhum agendamento para este dia.</div>
                }

                return dayEvents.map(evt => {
                  const pet = pets.find(p => p.id === evt.petId)
                  const time = format(new Date(evt.date), 'HH:mm')
                  const dotClass = getStatusDotClass(evt.status)

                  return (
                    <div
                      key={evt.id}
                      className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all cursor-pointer"
                      onClick={() => {
                        onEventClick(evt)
                        setSummaryDay(null)
                      }}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="text-sm font-bold text-slate-400 group-hover:text-orange-500 transition-colors">
                          {time}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn("h-2 w-2 rounded-full", dotClass)} />
                            <div className="font-bold text-slate-900 truncate">
                              {pet?.name || 'Pet'}
                            </div>
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">
                            {evt.serviceType === 'grooming' ? 'Banho e Tosa' :
                              evt.serviceType === 'consultation' ? 'Consulta' :
                                evt.serviceType === 'hospitalization' ? 'Internação' : 'Hospedagem'}
                          </div>
                        </div>
                      </div>
                      <Pencil className="h-4 w-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
                    </div>
                  )
                })
              })()}
            </div>
          </ScrollArea>

          <div className="p-4 bg-slate-50 border-t flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSummaryDay(null)}>
              Fechar
            </Button>
            {summaryDay && !isBefore(startOfDay(summaryDay), startOfDay(new Date())) && (
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                onClick={() => {
                  if (summaryDay) onTimeClick(summaryDay)
                  setSummaryDay(null)
                }}
              >
                Novo Agendamento
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}