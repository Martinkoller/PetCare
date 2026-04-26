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
    eventAny.boardingStay?.checkOut ??
    eventAny.returnDate ??
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
        row: 'border-orange-400 bg-orange-200/70',
        cell: 'bg-orange-200 border-orange-400 text-orange-900',
        dot: 'bg-orange-500',
        label: 'Reservado',
      }

    case 'confirmed':
      return {
        row: 'border-emerald-400 bg-emerald-200/70',
        cell: 'bg-emerald-200 border-emerald-400 text-emerald-900',
        dot: 'bg-emerald-500',
        label: 'Confirmado',
      }

    case 'checked_in':
    case 'in_progress':
      return {
        row: 'border-blue-400 bg-blue-200/70',
        cell: 'bg-blue-200 border-blue-400 text-blue-900',
        dot: 'bg-blue-500',
        label: 'Hospedado',
      }

    case 'checked_out':
    case 'completed':
      return {
        row: 'border-slate-400 bg-slate-200/70',
        cell: 'bg-slate-200 border-slate-400 text-slate-800',
        dot: 'bg-slate-500',
        label: 'Encerrado',
      }

    case 'cancelled':
      return {
        row: 'border-red-400 bg-red-200/70',
        cell: 'bg-red-200 border-red-400 text-red-900',
        dot: 'bg-red-500',
        label: 'Cancelado',
      }

    default:
      return {
        row: 'border-slate-400 bg-slate-200/70',
        cell: 'bg-slate-200 border-slate-400 text-slate-800',
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

    // Índices das colunas visíveis na semana
    const firstCol = weekDays.findIndex((d) => isBoardingActiveOnDay(evt, d))
    const lastCol = weekDays.reduce((acc, d, i) => isBoardingActiveOnDay(evt, d) ? i : acc, -1)

    const colStart = firstCol === -1 ? 0 : firstCol
    const colSpan = lastCol === -1 ? 0 : lastCol - firstCol + 1
    const checkInDay = weekDays.find((d) => getDayState(evt, d) === 'checkin')
    const checkOutDay = weekDays.find((d) => getDayState(evt, d) === 'checkout')

    return (
      <ContextMenu key={evt.id}>
        <ContextMenuTrigger asChild>
          <div className="relative border-b" style={{ minHeight: '64px' }}>
            {/* Grade de fundo para manter bordas dos dias */}
            <div className="grid grid-cols-7 h-full absolute inset-0 pointer-events-none">
              {weekDays.map((_, i) => (
                <div key={i} className="border-r last:border-r-0 h-full" />
              ))}
            </div>

            {/* Barra contínua */}
            {colSpan > 0 && (
              <div
                className="absolute inset-y-2 cursor-pointer"
                style={{
                  left: `calc(${colStart} / 7 * 100% + 6px)`,
                  right: `calc(${6 - lastCol} / 7 * 100% + 6px)`,
                }}
                onClick={() => onEventClick(evt)}
                title={[
                  `Pet: ${pet?.name || 'Pet'}`,
                  client ? `Tutor: ${client.name}` : '',
                  `Check-in: ${format(checkIn, 'dd/MM/yyyy', { locale: ptBR })}`,
                  `Check-out: ${format(checkOut, 'dd/MM/yyyy', { locale: ptBR })}`,
                  `Status: ${statusMeta.label}`,
                ].filter(Boolean).join('\n')}
              >
                <div
                  className={cn(
                    'h-full flex items-center border shadow-sm transition-all hover:shadow-md px-3 gap-3',
                    statusMeta.cell,
                    getDayState(evt, weekDays[firstCol]) === 'checkin' ? 'rounded-l-xl' : '',
                    getDayState(evt, weekDays[lastCol]) === 'checkout' ? 'rounded-r-xl' : '',
                  )}
                >
                  {/* Check-in badge */}
                  {checkInDay && (
                    <div className="flex flex-col shrink-0">
                      <span className="text-[9px] font-semibold uppercase tracking-wide opacity-70">Check-in</span>
                      <span className="text-[10px] font-bold">{format(checkIn, 'dd/MM', { locale: ptBR })}</span>
                    </div>
                  )}

                  {/* Info central */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold truncate">{pet?.name || 'Pet'}</div>
                    <div className="text-[10px] truncate opacity-75">{client?.name || 'Sem tutor'}</div>
                  </div>

                  {/* Check-out badge */}
                  {checkOutDay && (
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-[9px] font-semibold uppercase tracking-wide opacity-70">Check-out</span>
                      <span className="text-[10px] font-bold">{format(checkOut, 'dd/MM', { locale: ptBR })}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onClick={() => onEventClick(evt)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar Hospedagem
          </ContextMenuItem>

          <ContextMenuSeparator />

          {evt.status === 'scheduled' && (
            <ContextMenuItem onClick={() => onUpdateStatus?.(evt.id, 'confirmed')}>
              <Badge className="mr-2 h-2 w-2 rounded-full bg-emerald-500 p-0" />
              Confirmar Reserva
            </ContextMenuItem>
          )}

          {evt.status !== 'cancelled' && evt.status !== 'checked_out' && (
            <ContextMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirmCancel(evt)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancelar Hospedagem
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