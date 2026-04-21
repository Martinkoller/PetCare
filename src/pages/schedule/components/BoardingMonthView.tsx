import { useMemo, useState } from 'react'
import {
  addDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import {
  Appointment,
  Client,
  Pet,
} from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Pencil, XCircle, Trash2 } from 'lucide-react'

interface BoardingMonthViewProps {
  currentDate: Date
  events: Appointment[]
  pets?: Pet[]
  clients?: Client[]
  onEventClick: (event: Appointment) => void
  onCancelAppointment: (event: Appointment) => void
  onDeleteAppointment: (event: Appointment) => void
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MAX_VISIBLE_EVENTS = 4

function getBoardingDates(evt: Appointment) {
  const checkIn = startOfDay(new Date(evt.date))

  const eventAny = evt as any

  const rawCheckOut =
    eventAny.endDate ??
    eventAny.checkoutDate ??
    eventAny.checkOutDate ??
    eventAny.boardingEndDate ??
    eventAny.boardingEnd ??
    eventAny.end ??
    null

  const checkOut = rawCheckOut
    ? endOfDay(new Date(rawCheckOut))
    : endOfDay(new Date(new Date(evt.date).getTime() + 24 * 60 * 60 * 1000))

  return { checkIn, checkOut }
}

function isBoardingActiveOnDay(evt: Appointment, day: Date) {
  const { checkIn, checkOut } = getBoardingDates(evt)
  const dayStart = startOfDay(day)
  const dayEnd = endOfDay(day)

  return checkIn <= dayEnd && checkOut >= dayStart
}

function getBoardingStatusMeta(status: string) {
  switch (status) {
    case 'scheduled':
      return {
        dot: 'bg-orange-500',
        card: 'bg-orange-50 border-orange-200 text-orange-900',
        badge: (
          <Badge
            variant="secondary"
            className="bg-orange-100 text-orange-800 border-orange-200 text-[9px] h-4 px-1.5"
          >
            Reservado
          </Badge>
        ),
      }

    case 'confirmed':
      return {
        dot: 'bg-emerald-500',
        card: 'bg-emerald-50 border-emerald-200 text-emerald-900',
        badge: (
          <Badge
            variant="secondary"
            className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[9px] h-4 px-1.5"
          >
            Confirmado
          </Badge>
        ),
      }

    case 'checked_in':
    case 'in_progress':
      return {
        dot: 'bg-blue-500',
        card: 'bg-blue-50 border-blue-200 text-blue-900',
        badge: (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 border-blue-200 text-[9px] h-4 px-1.5"
          >
            Hospedado
          </Badge>
        ),
      }

    case 'checked_out':
    case 'completed':
      return {
        dot: 'bg-slate-500',
        card: 'bg-slate-50 border-slate-200 text-slate-800',
        badge: (
          <Badge
            variant="outline"
            className="bg-slate-50 text-slate-700 border-slate-200 text-[9px] h-4 px-1.5"
          >
            Encerrado
          </Badge>
        ),
      }

    case 'cancelled':
      return {
        dot: 'bg-red-500',
        card: 'bg-red-50 border-red-200 text-red-900',
        badge: (
          <Badge
            variant="secondary"
            className="bg-red-100 text-red-800 border-red-200 text-[9px] h-4 px-1.5"
          >
            Cancelado
          </Badge>
        ),
      }

    default:
      return {
        dot: 'bg-slate-400',
        card: 'bg-slate-50 border-slate-200 text-slate-800',
        badge: null,
      }
  }
}

export function BoardingMonthView({
  currentDate,
  events,
  pets = [],
  clients = [],
  onEventClick,
  onCancelAppointment,
  onDeleteAppointment,
}: BoardingMonthViewProps) {
  const [confirmCancel, setConfirmCancel] = useState<Appointment | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Appointment | null>(null)

  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate])
  const monthEnd = useMemo(() => endOfMonth(currentDate), [currentDate])

  const calendarStart = useMemo(
    () => startOfWeek(monthStart, { weekStartsOn: 0 }),
    [monthStart],
  )

  const calendarEnd = useMemo(
    () => endOfWeek(monthEnd, { weekStartsOn: 0 }),
    [monthEnd],
  )

  const calendarDays = useMemo(() => {
    const days: Date[] = []
    let cursor = calendarStart

    while (cursor <= calendarEnd) {
      days.push(cursor)
      cursor = addDays(cursor, 1)
    }

    return days
  }, [calendarStart, calendarEnd])

  const boardingEvents = useMemo(() => {
    return events
      .filter((evt) => evt.serviceType === 'boarding')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [events])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>()

    for (const day of calendarDays) {
      const key = format(day, 'yyyy-MM-dd')
      map.set(key, [])
    }

    for (const day of calendarDays) {
      const key = format(day, 'yyyy-MM-dd')
      const dayEvents = boardingEvents.filter((evt) => isBoardingActiveOnDay(evt, day))

      dayEvents.sort((a, b) => {
        const aStart = new Date(a.date).getTime()
        const bStart = new Date(b.date).getTime()
        return aStart - bStart
      })

      map.set(key, dayEvents)
    }

    return map
  }, [calendarDays, boardingEvents])

  const renderBoardingCard = (evt: Appointment, day: Date) => {
    const pet = pets.find((p) => p.id === evt.petId)
    const client = pet ? clients.find((c) => c.id === pet.clientId) : undefined
    const { checkIn, checkOut } = getBoardingDates(evt)
    const isStart = isSameDay(day, checkIn)
    const isEnd = isSameDay(day, checkOut)

    const meta = getBoardingStatusMeta(evt.status)

    const dayFlag = isStart
      ? 'Check-in'
      : isEnd
        ? 'Check-out'
        : 'Hospedado'

    return (
      <ContextMenu key={`${evt.id}-${format(day, 'yyyy-MM-dd')}`}>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              'rounded-lg border px-2 py-1.5 text-left shadow-sm cursor-pointer transition-all hover:shadow-md',
              meta.card,
            )}
            onClick={() => onEventClick(evt)}
            title={[
              `Pet: ${pet?.name || 'Pet'}`,
              client ? `Tutor: ${client.name}` : '',
              `Check-in: ${format(checkIn, 'dd/MM/yyyy', { locale: ptBR })}`,
              `Check-out: ${format(checkOut, 'dd/MM/yyyy', { locale: ptBR })}`,
              `Situação do dia: ${dayFlag}`,
            ]
              .filter(Boolean)
              .join('\n')}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', meta.dot)} />
                  <span className="text-[11px] font-semibold truncate">
                    {pet?.name || 'Pet'}
                  </span>
                </div>

                <div className="mt-0.5 text-[10px] truncate opacity-85">
                  {client?.name ? `Tutor: ${client.name}` : 'Sem tutor'}
                </div>

                <div className="mt-0.5 text-[10px] font-medium opacity-85">
                  {dayFlag}
                </div>
              </div>

              <div className="shrink-0">
                {meta.badge}
              </div>
            </div>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onClick={() => onEventClick(evt)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar Hospedagem
          </ContextMenuItem>
          <ContextMenuSeparator />
          {evt.status === 'cancelled' ? (
            <ContextMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirmDelete(evt)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Agendamento
            </ContextMenuItem>
          ) : (
            <ContextMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirmCancel(evt)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancelar Hospedagem
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

      {/* Grade mensal */}
      <div className="grid grid-cols-7 auto-rows-fr flex-1">
        {calendarDays.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd')
          const dayEvents = eventsByDay.get(dayKey) || []
          const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS)
          const hiddenCount = Math.max(dayEvents.length - MAX_VISIBLE_EVENTS, 0)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={dayKey}
              className={cn(
                'min-h-[170px] border-r border-b p-2 relative',
                !isCurrentMonth && 'bg-muted/20',
              )}
            >
              {/* Número do dia */}
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

              {/* Lista de hospedagens ativas no dia */}
              <div className="mt-2 space-y-1.5">
                {visibleEvents.map((evt) => renderBoardingCard(evt, day))}

                {hiddenCount > 0 && (
                  <div className="rounded-lg px-2 py-1 text-[11px] font-medium text-orange-600 bg-orange-50 border border-orange-100">
                    +{hiddenCount} hospedagem{hiddenCount > 1 ? 'ens' : ''}
                  </div>
                )}

                {dayEvents.length === 0 && (
                  <div className="h-6 rounded-md border border-dashed border-transparent" />
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={!!confirmCancel} onOpenChange={() => setConfirmCancel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Hospedagem</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar esta hospedagem?
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