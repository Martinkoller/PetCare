import { useEffect, useMemo, useRef, useState } from 'react'
import {
  format,
  isSameDay,
  setHours,
  setMinutes,
  startOfDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import {
  Appointment,
  Pet,
  Client,
  Profile,
  BusinessHours,
} from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Pencil, Eye, XCircle, Trash2, Plus } from 'lucide-react'

interface DayViewProps {
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
  startHour?: number
  endHour?: number
  businessHours?: BusinessHours
  activeProfiles?: string[]
}

const statusLabels: Record<string, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  in_progress: 'Em Atendimento',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
  checked_in: 'Hospedado',
  checked_out: 'Encerrado',
};

const HOUR_HEIGHT = 64
const MAX_VISIBLE_COLUMNS = 3
const MIN_EVENT_HEIGHT_PERCENT = 4.2
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

type DayBusinessBlock = {
  isOpenAllDay: boolean
  isClosedAllDay: boolean
  firstStart: number | null
  firstEnd: number | null
  secondStart: number | null
  secondEnd: number | null
}

interface EventLayout {
  event: Appointment
  col: number
  numCols: number
  hiddenCount?: number
  isOverflowAnchor?: boolean
}

const getEventStart = (evt: Appointment) => new Date(evt.date)

const getEventEnd = (evt: Appointment) => {
  return new Date(new Date(evt.date).getTime() + (evt.duration || 30) * 60_000)
}

const safeTimeToMin = (value: unknown): number | null => {
  if (value == null) return null

  if (typeof value === 'string') {
    const match = value.match(/^(\d{1,2}):(\d{2})/)
    if (!match) return null

    const h = Number(match[1])
    const m = Number(match[2])

    if (Number.isNaN(h) || Number.isNaN(m)) return null
    return h * 60 + m
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value
  }

  return null
}

function getServiceLabel(type: string) {
  switch (type) {
    case 'grooming': return 'Banho e Tosa'
    case 'consultation': return 'Consulta'
    case 'hospitalization': return 'Internação'
    default: return 'Hospedagem'
  }
}

function resolveBusinessBlock(businessHours: any, day: Date): DayBusinessBlock {
  if (!businessHours) {
    return {
      isOpenAllDay: true,
      isClosedAllDay: false,
      firstStart: null,
      firstEnd: null,
      secondStart: null,
      secondEnd: null,
    }
  }

  const dayKey = DAY_KEYS[day.getDay()]
  const config = businessHours?.[dayKey]

  if (!config) {
    return {
      isOpenAllDay: true,
      isClosedAllDay: false,
      firstStart: null,
      firstEnd: null,
      secondStart: null,
      secondEnd: null,
    }
  }

  if (config.open === false) {
    return {
      isOpenAllDay: false,
      isClosedAllDay: true,
      firstStart: null,
      firstEnd: null,
      secondStart: null,
      secondEnd: null,
    }
  }

  const start = safeTimeToMin(config.start)
  const end = safeTimeToMin(config.end)
  const breakStart = safeTimeToMin(config.breakStart)
  const breakEnd = safeTimeToMin(config.breakEnd)
  const end2 = safeTimeToMin(config.end2)

  const hasSecondShift =
    breakStart !== null &&
    breakEnd !== null &&
    end2 !== null &&
    breakEnd > breakStart

  const firstStart = start
  const firstEnd = hasSecondShift ? breakStart : end
  const secondStart = hasSecondShift ? breakEnd : null
  const secondEnd = hasSecondShift ? end2 : null

  if (firstStart === null || firstEnd === null) {
    return {
      isOpenAllDay: true,
      isClosedAllDay: false,
      firstStart: null,
      firstEnd: null,
      secondStart: null,
      secondEnd: null,
    }
  }

  return {
    isOpenAllDay: false,
    isClosedAllDay: false,
    firstStart,
    firstEnd,
    secondStart,
    secondEnd,
  }
}

function isWithinBusinessHours(businessHours: any, day: Date, hour: number) {
  const block = resolveBusinessBlock(businessHours, day)

  if (block.isOpenAllDay) return true
  if (block.isClosedAllDay) return false

  const slotStart = hour * 60
  const slotEnd = slotStart + 60

  const overlapsFirst =
    block.firstStart !== null &&
    block.firstEnd !== null &&
    slotStart < block.firstEnd &&
    slotEnd > block.firstStart

  const overlapsSecond =
    block.secondStart !== null &&
    block.secondEnd !== null &&
    slotStart < block.secondEnd &&
    slotEnd > block.secondStart

  return overlapsFirst || overlapsSecond
}



function layoutOverlappingEvents(events: Appointment[]): EventLayout[] {
  if (events.length === 0) return []

  const sorted = [...events].sort(
    (a, b) => getEventStart(a).getTime() - getEventStart(b).getTime(),
  )

  const overlaps = (a: Appointment, b: Appointment) =>
    getEventStart(a).getTime() < getEventEnd(b).getTime() &&
    getEventStart(b).getTime() < getEventEnd(a).getTime()

  const clusters: Appointment[][] = []

  for (const evt of sorted) {
    const target = clusters.find((cluster) =>
      cluster.some((item) => overlaps(item, evt)),
    )

    if (target) target.push(evt)
    else clusters.push([evt])
  }

  const layouts: EventLayout[] = []

  for (const cluster of clusters) {
    const colEnds: number[] = []
    const assignments: { event: Appointment; col: number }[] = []

    for (const evt of cluster) {
      const start = getEventStart(evt).getTime()
      const end = getEventEnd(evt).getTime()

      let col = colEnds.length

      for (let i = 0; i < colEnds.length; i++) {
        if (colEnds[i] <= start) {
          col = i
          break
        }
      }

      if (col < colEnds.length) colEnds[col] = end
      else colEnds.push(end)

      assignments.push({ event: evt, col })
    }

    const actualCols = colEnds.length

    if (actualCols <= MAX_VISIBLE_COLUMNS) {
      for (const { event, col } of assignments) {
        layouts.push({ event, col, numCols: actualCols })
      }
      continue
    }

    const visibleAssignments = assignments.filter(
      (item) => item.col < MAX_VISIBLE_COLUMNS,
    )
    const overflowAssignments = assignments.filter(
      (item) => item.col >= MAX_VISIBLE_COLUMNS,
    )

    for (const { event, col } of visibleAssignments) {
      const isLastVisibleCol = col === MAX_VISIBLE_COLUMNS - 1
      const hiddenCount = isLastVisibleCol ? overflowAssignments.length : 0

      layouts.push({
        event,
        col,
        numCols: MAX_VISIBLE_COLUMNS,
        hiddenCount,
        isOverflowAnchor: isLastVisibleCol && overflowAssignments.length > 0,
      })
    }
  }

  return layouts
}

export function DayView({
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
  startHour = 7,
  endHour = 19,
  businessHours,
  activeProfiles = [],
}: DayViewProps) {
  const [confirmCancel, setConfirmCancel] = useState<Appointment | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Appointment | null>(null)
  const [dragOverCell, setDragOverCell] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const startMinutes = startHour * 60
    const endMinutes = endHour * 60

    if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
      container.scrollTop = 0
      return
    }

    const totalMinutes = (endHour - startHour) * 60
    const targetMinutes = Math.max(startMinutes, currentMinutes - 90)
    const scrollRatio = (targetMinutes - startMinutes) / totalMinutes

    container.scrollTop = Math.max(0, scrollRatio * (container.scrollHeight * 0.75))
  }, [startHour, endHour, currentDate])

  const hourSlots = useMemo(() => {
    const slots: number[] = []
    for (let h = startHour; h < endHour; h++) slots.push(h)
    return slots
  }, [startHour, endHour])

  const filteredEvents = useMemo(() => {
    return events
      .filter((evt) => evt.serviceType !== 'boarding')
      .filter((evt) => isSameDay(new Date(evt.date), currentDate))
      .filter((evt) => {
        if (activeProfiles.length === 0) return true

        return (
          activeProfiles.includes(evt.professionalId || 'unassigned') ||
          (!evt.professionalId && activeProfiles.includes('unassigned'))
        )
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [events, currentDate, activeProfiles])

  const layouts = useMemo(
    () => layoutOverlappingEvents(filteredEvents),
    [filteredEvents],
  )

  const businessBlock = resolveBusinessBlock(businessHours, currentDate)

  const disabledBlocks = useMemo(() => {
    return hourSlots.map((hour, slotIndex) => {
      const enabled = isWithinBusinessHours(businessHours, currentDate, hour)

      let showOutsideLabel = false

      if (!enabled) {
        if (businessBlock.isClosedAllDay) {
          showOutsideLabel = slotIndex === 0
        } else {
          const prevHour = slotIndex > 0 ? hourSlots[slotIndex - 1] : null
          const prevEnabled =
            prevHour !== null
              ? isWithinBusinessHours(businessHours, currentDate, prevHour)
              : false

          showOutsideLabel = slotIndex === 0 || prevEnabled
        }
      }

      return { hour, enabled, showOutsideLabel }
    })
  }, [hourSlots, businessHours, currentDate, businessBlock])

  const currentLine = useMemo(() => {
    if (!isSameDay(currentDate, currentTime)) return null

    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes()
    const startMinutes = startHour * 60
    const endMinutes = endHour * 60

    if (currentMinutes < startMinutes || currentMinutes > endMinutes) return null

    const top =
      ((currentMinutes - startMinutes) / ((endHour - startHour) * 60)) * 100

    return { top }
  }, [currentDate, currentTime, startHour, endHour])

  const totalGridHeight = (endHour - startHour) * HOUR_HEIGHT

  const renderEventCard = (
    evt: Appointment,
    style: React.CSSProperties,
    compact: boolean,
    overflowHint?: number,
  ) => {
    const pet = pets.find((p) => String(p.id) === String(evt.petId))
    const professional = profiles.find(
      (p) => String(p.id) === String(evt.professionalId),
    )
    const client = pet
      ? clients.find((c) => String(c.id) === String((pet as any).clientId))
      : undefined
    const serviceLabel = getServiceLabel(evt.serviceType)
    const start = getEventStart(evt)
    const timeLabel = format(start, 'HH:mm')
    const hasOverflow = typeof overflowHint === 'number' && overflowHint > 0

    const substatus = evt.clinicalStatus || evt.groomingStatus;

    const eventClasses = cn(
      'absolute rounded-xl border shadow-sm overflow-hidden z-20 hover:z-30 cursor-pointer transition-shadow',
      evt.status === 'scheduled' && 'bg-slate-50 border-slate-200 text-slate-800',
      evt.status === 'confirmed' && 'bg-blue-50 border-blue-200 text-blue-900',
      evt.status === 'in_progress' && 'bg-amber-50 border-amber-200 text-amber-900',
      evt.status === 'completed' && 'bg-green-50 border-green-200 text-green-900',
      evt.status === 'cancelled' && 'bg-red-50 border-red-200 text-red-900',
      evt.serviceType === 'hospitalization' && 'border-l-red-500 border-l-4',
    )

    return (
      <ContextMenu key={evt.id}>
        <ContextMenuTrigger asChild>
          <div
            className={eventClasses}
            style={style}
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
            <div className="h-full flex flex-col justify-center px-3 py-1 relative">
              <div className="flex items-center gap-2 truncate leading-none">
                <span className="text-[12px] font-bold text-slate-700 shrink-0">{timeLabel}</span>
                <span className="text-[13px] font-bold text-slate-900 truncate">{pet?.name || 'Pet'}</span>
                {evt.serviceType === 'hospitalization' && (
                  <Badge variant="outline" className="h-4 px-1 text-[8px] bg-red-50 text-red-600 border-red-200 shrink-0">INT</Badge>
                )}
              </div>



              {!compact && (
                <div className="mt-2 space-y-1">
                  <div className="truncate text-[11px] opacity-85 flex items-center gap-1.5">
                    <span className="w-1 h-3 bg-slate-300 rounded-full" />
                    {serviceLabel}
                  </div>

                  {client && (
                    <div className="truncate text-[10px] opacity-70">
                      Tutor: {client.name}
                    </div>
                  )}

                  {professional && (
                    <div className="truncate text-[10px] opacity-70 italic">
                      Responsável: {professional.name}
                    </div>
                  )}
                </div>
              )}

              {hasOverflow ? (
                <div className="mt-1.5 text-[9px] font-bold opacity-80 bg-white/50 w-fit px-1.5 py-0.5 rounded-md border">
                  +{overflowHint} conflitos
                </div>
              ) : null}
            </div>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onClick={() => onEventClick(evt)}>
            {evt.status === 'completed' || evt.status === 'checked_out' ? (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </>
            ) : (
              <>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </>
            )}
          </ContextMenuItem>

          <ContextMenuSub>
            <ContextMenuSubTrigger disabled={evt.status === 'completed'}>
              <span className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Ações
              </span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-56">
              {evt.status === 'scheduled' && (
                <ContextMenuItem onClick={() => onUpdateStatus?.(evt.id, 'confirmed')}>
                  <Badge className="mr-2 h-2 w-2 rounded-full bg-blue-500 p-0" />
                  Confirmar Atendimento
                </ContextMenuItem>
              )}

              {evt.status !== 'cancelled' && evt.status !== 'completed' && (
                <>
                  {evt.status === 'scheduled' && <ContextMenuSeparator />}
                  <ContextMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setConfirmCancel(evt)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancelar Agendamento
                  </ContextMenuItem>
                </>
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
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  return (
    <div className="flex flex-col h-full border rounded-2xl bg-background overflow-hidden shadow-sm">
      <div className="border-b bg-muted/30 px-4 py-3 text-center">
        <div className="text-sm font-semibold capitalize">
          {format(currentDate, 'EEEE', { locale: ptBR })}
        </div>

        <div
          className={cn(
            'mt-1 inline-flex h-8 min-w-8 items-center justify-center rounded-full px-3 text-xs font-medium',
            isSameDay(currentDate, new Date())
              ? 'bg-orange-500 text-white'
              : 'text-muted-foreground',
          )}
        >
          {format(currentDate, 'dd/MM')}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto relative">
        <div
          className="grid grid-cols-[72px_1fr] relative"
          style={{ minHeight: `${totalGridHeight}px` }}
        >
          <div className="border-r bg-background sticky left-0 z-10">
            {hourSlots.map((hour) => (
              <div
                key={`hour-${hour}`}
                className="border-b px-2 pt-1 text-right text-xs text-muted-foreground"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          <div className="relative">
            {disabledBlocks.map(({ hour, enabled, showOutsideLabel }) => {
              const cellKey = `${format(currentDate, 'yyyy-MM-dd')}-${hour}`
              const isDragOver = dragOverCell === cellKey

              return (
                <Button
                  key={cellKey}
                  type="button"
                  variant="ghost"
                  className={cn(
                    'w-full justify-start rounded-none border-b px-0 h-auto relative',
                    enabled
                      ? 'hover:bg-muted/20 bg-background'
                      : 'bg-slate-100/80 bg-[linear-gradient(135deg,rgba(148,163,184,0.08)_25%,transparent_25%,transparent_50%,rgba(148,163,184,0.08)_50%,rgba(148,163,184,0.08)_75%,transparent_75%,transparent)] bg-[length:12px_12px]',
                    isDragOver && 'bg-orange-50 ring-1 ring-orange-300',
                  )}
                  style={{ height: `${HOUR_HEIGHT}px` }}
                  onClick={() => {
                    if (!enabled) return
                    const clickDate = setMinutes(setHours(startOfDay(currentDate), hour), 0)
                    onTimeClick(clickDate)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    if (!enabled) return
                    setDragOverCell(cellKey)
                  }}
                  onDragLeave={() => {
                    if (dragOverCell === cellKey) setDragOverCell(null)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOverCell(null)

                    if (!enabled) return

                    const eventId = e.dataTransfer.getData('text/plain')
                    const evt = filteredEvents.find((item) => item.id === eventId)
                    if (!evt) return

                    const originalDate = new Date(evt.date)
                    const newDate = new Date(currentDate)
                    newDate.setHours(hour, originalDate.getMinutes(), 0, 0)

                    onEventDrop(evt, newDate)
                  }}
                >
                  {!enabled && showOutsideLabel && (
                    <span className="absolute left-2 top-1.5 text-[9px] font-medium text-slate-500 pointer-events-none bg-white/70 px-1 rounded-sm">
                      Fora de expediente
                    </span>
                  )}
                </Button>
              )
            })}

            {currentLine && (
              <div
                className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 pointer-events-none"
                style={{ top: `${currentLine.top}%` }}
              />
            )}

            {layouts.map(({ event: evt, col, numCols, hiddenCount, isOverflowAnchor }) => {
              const eventStart = getEventStart(evt)
              const eventEnd = getEventEnd(evt)

              const gridStartMinutes = startHour * 60
              const gridEndMinutes = endHour * 60

              const rawStartMinutes =
                eventStart.getHours() * 60 + eventStart.getMinutes()
              const rawEndMinutes =
                eventEnd.getHours() * 60 + eventEnd.getMinutes()

              if (
                rawEndMinutes <= gridStartMinutes ||
                rawStartMinutes >= gridEndMinutes
              ) {
                return null
              }

              const visibleStartMinutes = Math.max(rawStartMinutes, gridStartMinutes)
              const visibleEndMinutes = Math.min(rawEndMinutes, gridEndMinutes)

              const startMinutes = visibleStartMinutes - gridStartMinutes
              const endMinutes = visibleEndMinutes - gridStartMinutes

              const top =
                (startMinutes / ((endHour - startHour) * 60)) * 100
              const height =
                ((endMinutes - startMinutes) / ((endHour - startHour) * 60)) * 100

              const width = 100 / numCols
              const left = col * width
              const compact =
                height < 10 || numCols >= 3 || (hiddenCount || 0) > 0

              return renderEventCard(
                evt,
                {
                  top: `${top}%`,
                  height: `${Math.max(height, MIN_EVENT_HEIGHT_PERCENT)}%`,
                  left: `calc(${left}% + 4px)`,
                  width: `calc(${width}% - 8px)`,
                },
                compact,
                isOverflowAnchor ? hiddenCount : undefined,
              )
            })}
          </div>
        </div>
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
    </div>
  )
}