import { useMemo, useState } from 'react'
import {
  addDays,
  endOfDay,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  startOfDay,
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
import { Pencil, XCircle, Trash2, Plus } from 'lucide-react'

interface BoardingWeekViewProps {
  currentDate: Date
  events: Appointment[]
  pets?: Pet[]
  clients?: Client[]
  onEventClick: (event: Appointment) => void
  onCancelAppointment: (event: Appointment) => void
  onDeleteAppointment: (event: Appointment) => void
  onUpdateStatus?: (id: string, status: Appointment['status']) => void
}

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
        row: 'border-orange-200 bg-orange-50/70',
        cell: 'bg-orange-50 border-orange-200 text-orange-900',
        dot: 'bg-orange-500',
        label: 'Reservado',
      }

    case 'confirmed':
      return {
        row: 'border-emerald-200 bg-emerald-50/70',
        cell: 'bg-emerald-50 border-emerald-200 text-emerald-900',
        dot: 'bg-emerald-500',
        label: 'Confirmado',
      }

    case 'checked_in':
    case 'in_progress':
      return {
        row: 'border-blue-200 bg-blue-50/70',
        cell: 'bg-blue-50 border-blue-200 text-blue-900',
        dot: 'bg-blue-500',
        label: 'Hospedado',
      }

    case 'checked_out':
    case 'completed':
      return {
        row: 'border-slate-200 bg-slate-50/70',
        cell: 'bg-slate-50 border-slate-200 text-slate-800',
        dot: 'bg-slate-500',
        label: 'Encerrado',
      }

    case 'cancelled':
      return {
        row: 'border-red-200 bg-red-50/70',
        cell: 'bg-red-50 border-red-200 text-red-900',
        dot: 'bg-red-500',
        label: 'Cancelado',
      }

    default:
      return {
        row: 'border-slate-200 bg-slate-50/70',
        cell: 'bg-slate-50 border-slate-200 text-slate-800',
        dot: 'bg-slate-400',
        label: 'Hospedagem',
      }
  }
}

function getDayState(evt: Appointment, day: Date) {
  const { checkIn, checkOut } = getBoardingDates(evt)

  if (isSameDay(day, checkIn)) return 'checkin'
  if (isSameDay(day, checkOut)) return 'checkout'
  return 'stay'
}

function getDayStateLabel(state: 'checkin' | 'stay' | 'checkout') {
  switch (state) {
    case 'checkin':
      return 'Check-in'
    case 'checkout':
      return 'Check-out'
    default:
      return 'Hospedado'
  }
}

export function BoardingWeekView({
  currentDate,
  events,
  pets = [],
  clients = [],
  onEventClick,
  onCancelAppointment,
  onDeleteAppointment,
  onUpdateStatus,
}: BoardingWeekViewProps) {
  const [confirmCancel, setConfirmCancel] = useState<Appointment | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Appointment | null>(null)

  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 0 }),
    [currentDate],
  )

  const weekEnd = useMemo(
    () => endOfWeek(currentDate, { weekStartsOn: 0 }),
    [currentDate],
  )

  const weekDays = useMemo(() => {
    const days: Date[] = []
    let cursor = weekStart

    while (cursor <= weekEnd) {
      days.push(cursor)
      cursor = addDays(cursor, 1)
    }

    return days
  }, [weekStart, weekEnd])

  const boardingEvents = useMemo(() => {
    return events
      .filter((evt) => evt.serviceType === 'boarding')
      .filter((evt) => {
        const { checkIn, checkOut } = getBoardingDates(evt)
        return checkIn <= endOfDay(weekEnd) && checkOut >= startOfDay(weekStart)
      })
      .sort((a, b) => {
        const aStart = new Date(a.date).getTime()
        const bStart = new Date(b.date).getTime()

        if (aStart !== bStart) return aStart - bStart

        const aPet = pets.find((p) => p.id === a.petId)?.name || ''
        const bPet = pets.find((p) => p.id === b.petId)?.name || ''
        return aPet.localeCompare(bPet)
      })
  }, [events, pets, weekStart, weekEnd])

  const renderBoardingRow = (evt: Appointment) => {
    const pet = pets.find((p) => p.id === evt.petId)
    const client = pet ? clients.find((c) => c.id === pet.clientId) : undefined
    const { checkIn, checkOut } = getBoardingDates(evt)
    const statusMeta = getBoardingStatusMeta(evt.status)

    return (
      <ContextMenu key={evt.id}>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              'grid grid-cols-7 border-b hover:bg-muted/20 transition-colors',
              statusMeta.row,
            )}
          >
            {/* 7 dias da semana */}
            {weekDays.map((day, index) => {
              const active = isBoardingActiveOnDay(evt, day)

              if (!active) {
                return (
                  <div
                    key={`${evt.id}-${index}`}
                    className="border-r last:border-r-0 min-h-[78px] bg-background/70"
                  />
                )
              }

              const dayState = getDayState(evt, day)
              const dayStateLabel = getDayStateLabel(dayState)

              const roundedClass =
                dayState === 'checkin'
                  ? 'rounded-l-xl'
                  : dayState === 'checkout'
                    ? 'rounded-r-xl'
                    : ''

              return (
                <div
                  key={`${evt.id}-${index}`}
                  className="border-r last:border-r-0 p-2 min-h-[78px] cursor-pointer"
                  onClick={() => onEventClick(evt)}
                >
                  <div
                    className={cn(
                      'h-full min-h-[60px] rounded-md border px-2 py-2 shadow-sm transition-all hover:shadow-md',
                      statusMeta.cell,
                      roundedClass,
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                        {dayStateLabel}
                      </span>

                      {(dayState === 'checkin' || dayState === 'checkout') && (
                        <span className="text-[10px] font-bold">
                          {format(
                            dayState === 'checkin' ? checkIn : checkOut,
                            'dd/MM',
                            { locale: ptBR },
                          )}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 text-[11px] font-semibold truncate">
                      {pet?.name || 'Pet'}
                    </div>

                    <div className="mt-0.5 text-[10px] truncate opacity-80">
                      {client?.name || 'Sem tutor'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onClick={() => onEventClick(evt)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar Hospedagem
          </ContextMenuItem>

          <ContextMenuSub>
            <ContextMenuSubTrigger disabled={evt.status === 'checked_out'}>
              <span className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Ações
              </span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-56">
              {evt.status === 'scheduled' && (
                <ContextMenuItem onClick={() => onUpdateStatus?.(evt.id, 'confirmed')}>
                  <Badge className="mr-2 h-2 w-2 rounded-full bg-emerald-500 p-0" />
                  Confirmar Reserva
                </ContextMenuItem>
              )}

              {evt.status !== 'cancelled' && evt.status !== 'checked_out' && (
                <>
                  {evt.status === 'scheduled' && <ContextMenuSeparator />}
                  <ContextMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setConfirmCancel(evt)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancelar Hospedagem
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
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-background shadow-sm">
      {/* Cabeçalho */}
      <div className="overflow-x-auto">
        <div>
          <div className="grid grid-cols-7 border-b bg-muted/30">
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className="border-r last:border-r-0 px-3 py-3 text-center"
              >
                <div className="text-xs font-medium uppercase text-muted-foreground">
                  {format(day, 'EEE', { locale: ptBR })}
                </div>

                <div
                  className={cn(
                    'mx-auto mt-1 inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-semibold',
                    isToday(day)
                      ? 'bg-orange-500 text-white'
                      : 'text-foreground',
                  )}
                >
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Linhas */}
          <div className="max-h-[calc(100vh-320px)] overflow-auto">
            {boardingEvents.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                Nenhuma hospedagem encontrada nesta semana.
              </div>
            ) : (
              boardingEvents.map((evt) => renderBoardingRow(evt))
            )}
          </div>
        </div>
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