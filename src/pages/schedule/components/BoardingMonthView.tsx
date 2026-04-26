import { useMemo, useState } from 'react'
import {
  addDays,
  endOfDay,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Appointment, Client, Pet } from '@/lib/types'
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

interface BoardingMonthViewProps {
  currentDate: Date
  events: Appointment[]
  pets?: Pet[]
  clients?: Client[]
  onEventClick: (event: Appointment) => void
  onCancelAppointment: (event: Appointment) => void
  onDeleteAppointment: (event: Appointment) => void
  onUpdateStatus?: (id: string, status: Appointment['status']) => void
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Layout constants (px)
const DAY_HEADER_H = 36  // altura reservada para número do dia
const BAR_H = 22         // altura de cada barra
const BAR_GAP = 3        // espaçamento vertical entre barras
const BAR_TOP_PAD = 4    // padding acima da primeira barra
const CELL_PAD = 4       // padding horizontal da célula

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

function getBoardingStatusMeta(status: string) {
  switch (status) {
    case 'scheduled':
      return { dot: 'bg-orange-500', bar: 'bg-orange-200 border-orange-400 text-orange-900', label: 'Reservado' }
    case 'confirmed':
      return { dot: 'bg-emerald-500', bar: 'bg-emerald-200 border-emerald-400 text-emerald-900', label: 'Confirmado' }
    case 'checked_in':
    case 'in_progress':
      return { dot: 'bg-blue-500', bar: 'bg-blue-200 border-blue-400 text-blue-900', label: 'Hospedado' }
    case 'checked_out':
    case 'completed':
      return { dot: 'bg-slate-500', bar: 'bg-slate-200 border-slate-400 text-slate-800', label: 'Encerrado' }
    case 'cancelled':
      return { dot: 'bg-red-500', bar: 'bg-red-200 border-red-400 text-red-900', label: 'Cancelado' }
    default:
      return { dot: 'bg-orange-500', bar: 'bg-orange-200 border-orange-400 text-orange-900', label: 'Reservado' }
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
  onUpdateStatus,
}: BoardingMonthViewProps) {
  const [confirmCancel, setConfirmCancel] = useState<Appointment | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Appointment | null>(null)

  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate])
  const calendarStart = useMemo(() => startOfWeek(monthStart, { weekStartsOn: 0 }), [monthStart])

  // Sempre 6 semanas completas — exibe o mês seguinte quando há espaço
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

  const boardingEvents = useMemo(() =>
    events
      .filter((e) => e.serviceType === 'boarding')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events],
  )

  // Para cada semana: calcula as barras com posição colStart/colSpan e row (sem sobreposição)
  const weekLayouts = useMemo(() => {
    return weeks.map((week) => {
      const weekStart = week[0]
      const weekEnd = week[6]

      const eventsInWeek = boardingEvents.filter((evt) => {
        const { checkIn, checkOut } = getBoardingDates(evt)
        return checkIn <= endOfDay(weekEnd) && checkOut >= startOfDay(weekStart)
      })

      type Bar = {
        evt: Appointment
        colStart: number
        colSpan: number
        isStart: boolean
        isEnd: boolean
        row: number
      }

      const bars: Bar[] = []
      // rowOccupancy[row] = lista de índices de coluna ocupados
      const rowOccupancy: number[][] = []

      for (const evt of eventsInWeek) {
        const { checkIn, checkOut } = getBoardingDates(evt)

        // Primeiro dia visível na semana (checkIn antes da semana → col 0)
        const firstIdx = week.findIndex((d) => startOfDay(d) >= startOfDay(checkIn))
        const effectiveStart = firstIdx === -1 ? 0 : firstIdx

        // Último dia visível na semana (checkOut depois da semana → col 6)
        let effectiveEnd = 6
        for (let i = 6; i >= 0; i--) {
          if (startOfDay(week[i]) <= startOfDay(checkOut)) { effectiveEnd = i; break }
        }

        const colSpan = effectiveEnd - effectiveStart + 1

        // Encontra row livre
        let row = 0
        while (true) {
          if (!rowOccupancy[row]) { rowOccupancy[row] = []; break }
          const conflict = rowOccupancy[row].some(
            (c) => c >= effectiveStart && c <= effectiveEnd,
          )
          if (!conflict) break
          row++
        }
        if (!rowOccupancy[row]) rowOccupancy[row] = []
        for (let c = effectiveStart; c <= effectiveEnd; c++) {
          rowOccupancy[row].push(c)
        }

        bars.push({
          evt,
          colStart: effectiveStart,
          colSpan,
          isStart: isSameDay(checkIn, week[effectiveStart]) && firstIdx !== -1,
          isEnd: effectiveEnd !== -1 && isSameDay(checkOut, week[effectiveEnd]),
          row,
        })
      }

      const maxRow = bars.reduce((m, b) => Math.max(m, b.row), -1)
      const barsHeight = maxRow >= 0 ? (maxRow + 1) * (BAR_H + BAR_GAP) : 0
      const minHeight = DAY_HEADER_H + BAR_TOP_PAD + barsHeight + 8

      return { week, bars, minHeight }
    })
  }, [weeks, boardingEvents])

  const renderContextMenu = (evt: Appointment, child: React.ReactNode) => {
    return (
      <ContextMenu key={evt.id}>
        <ContextMenuTrigger asChild>{child}</ContextMenuTrigger>
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
    <div className="flex flex-col h-full border rounded-2xl bg-background overflow-hidden shadow-sm">
      {/* Cabeçalho dos dias da semana */}
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

      {/* Grade: uma linha por semana */}
      <div className="flex flex-col flex-1">
        {weekLayouts.map(({ week, bars, minHeight }, weekIdx) => (
          <div
            key={weekIdx}
            className="relative grid grid-cols-7 border-b last:border-b-0 flex-1"
            style={{ minHeight }}
          >
            {/* Fundo: células dos dias */}
            {week.map((day) => {
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isToday = isSameDay(day, new Date())
              const isFirstOfMonth = day.getDate() === 1

              return (
                <div
                  key={format(day, 'yyyy-MM-dd')}
                  className={cn(
                    'border-r last:border-r-0 p-1.5',
                    !isCurrentMonth && 'bg-muted/20',
                  )}
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
                      {format(day, 'd')}
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
                </div>
              )
            })}

            {/* Barras contínuas absolutas sobrepostas */}
            {bars.map(({ evt, colStart, colSpan, isStart, isEnd, row }) => {
              const { checkIn, checkOut } = getBoardingDates(evt)
              const meta = getBoardingStatusMeta(evt.status)
              const pet = pets.find((p) => p.id === evt.petId)
              const client = pet ? clients.find((c) => c.id === pet.clientId) : undefined
              const top = DAY_HEADER_H + BAR_TOP_PAD + row * (BAR_H + BAR_GAP)

              const bar = (
                <div
                  className="absolute cursor-pointer"
                  style={{
                    top,
                    height: BAR_H,
                    left: `calc(${colStart} / 7 * 100% + ${CELL_PAD}px)`,
                    right: `calc(${7 - colStart - colSpan} / 7 * 100% + ${CELL_PAD}px)`,
                  }}
                  onClick={() => onEventClick(evt)}
                  title={[
                    `Pet: ${pet?.name || 'Pet'}`,
                    client ? `Tutor: ${client.name}` : '',
                    `Check-in: ${format(checkIn, 'dd/MM/yyyy', { locale: ptBR })}`,
                    `Check-out: ${format(checkOut, 'dd/MM/yyyy', { locale: ptBR })}`,
                    `Status: ${meta.label}`,
                  ].filter(Boolean).join('\n')}
                >
                  <div
                    className={cn(
                      'h-full flex items-center border text-[10px] font-semibold px-2 gap-1.5 overflow-hidden',
                      meta.bar,
                      isStart ? 'rounded-l-full pl-2.5' : 'rounded-l-none',
                      isEnd ? 'rounded-r-full pr-2.5' : 'rounded-r-none',
                    )}
                  >
                    {isStart && (
                      <span className="shrink-0 font-bold opacity-75">
                        {format(checkIn, 'dd/MM', { locale: ptBR })}
                      </span>
                    )}
                    <span className="truncate">
                      {pet?.name || 'Pet'}
                      {client?.name ? ` · ${client.name}` : ''}
                    </span>
                    {isEnd && (
                      <span className="shrink-0 font-bold opacity-75 ml-auto">
                        {format(checkOut, 'dd/MM', { locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>
              )

              return renderContextMenu(evt, bar)
            })}
          </div>
        ))}
      </div>

      <Dialog open={!!confirmCancel} onOpenChange={() => setConfirmCancel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Hospedagem</DialogTitle>
            <DialogDescription>Tem certeza que deseja cancelar esta hospedagem?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCancel(null)}>Voltar</Button>
            <Button
              variant="destructive"
              onClick={() => { if (confirmCancel) onCancelAppointment(confirmCancel); setConfirmCancel(null) }}
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
            <DialogDescription>Tem certeza que deseja excluir o agendamento? Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Voltar</Button>
            <Button
              variant="destructive"
              onClick={() => { if (confirmDelete) onDeleteAppointment(confirmDelete); setConfirmDelete(null) }}
            >
              Sim, Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
