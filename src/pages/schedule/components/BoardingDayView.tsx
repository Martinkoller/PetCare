import { useMemo, useState } from 'react'
import {
  endOfDay,
  format,
  isSameDay,
  isWithinInterval,
  startOfDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Appointment, Pet, Client } from '@/lib/types'
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

interface BoardingDayViewProps {
  currentDate: Date
  events: Appointment[]
  pets?: Pet[]
  clients?: Client[]
  onEventClick: (event: Appointment) => void
  onCancelAppointment: (event: Appointment) => void
  onDeleteAppointment: (event: Appointment) => void
}

function getBoardingStatusMeta(status?: string) {
  switch (status) {
    case 'scheduled':
      return {
        dot: 'bg-orange-500',
        card: 'bg-orange-50 border-orange-200 text-orange-900',
        label: 'Reservado',
      }
    case 'confirmed':
      return {
        dot: 'bg-emerald-500',
        card: 'bg-emerald-50 border-emerald-200 text-emerald-900',
        label: 'Confirmado',
      }
    case 'checked_in':
    case 'in_progress':
      return {
        dot: 'bg-blue-500',
        card: 'bg-blue-50 border-blue-200 text-blue-900',
        label: 'Hospedado',
      }
    case 'checked_out':
    case 'completed':
      return {
        dot: 'bg-slate-500',
        card: 'bg-slate-50 border-slate-200 text-slate-800',
        label: 'Encerrado',
      }
    case 'cancelled':
      return {
        dot: 'bg-red-500',
        card: 'bg-red-50 border-red-200 text-red-900',
        label: 'Cancelado',
      }
    default:
      return {
        dot: 'bg-orange-500',
        card: 'bg-orange-50 border-orange-200 text-orange-900',
        label: 'Reservado',
      }
  }
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

function BoardingCard({
  evt,
  pets,
  clients,
  onEventClick,
  onCancel,
  onDelete,
}: {
  evt: Appointment
  pets: Pet[]
  clients: Client[]
  onEventClick: (event: Appointment) => void
  onCancel: (event: Appointment) => void
  onDelete: (event: Appointment) => void
}) {
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const pet = pets.find((p) => p.id === evt.petId)
  const client = pet ? clients.find((c) => c.id === pet.clientId) : undefined
  const statusMeta = getBoardingStatusMeta(evt.status)
  const { checkIn, checkOut } = getBoardingDates(evt)

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'w-full rounded-2xl border shadow-sm text-left overflow-hidden transition-shadow hover:shadow-md',
              statusMeta.card,
            )}
            onClick={() => onEventClick(evt)}
            title={[
              `Pet: ${pet?.name || 'Pet'}`,
              client ? `Tutor: ${client.name}` : '',
              `Check-in: ${format(checkIn, 'dd/MM/yyyy')}`,
              `Check-out: ${format(checkOut, 'dd/MM/yyyy')}`,
              `Status: ${statusMeta.label}`,
            ]
              .filter(Boolean)
              .join('\n')}
          >
            <div className="flex">
              <div className="w-1.5 shrink-0 bg-current opacity-80" />

              <div className="min-w-0 flex-1 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', statusMeta.dot)} />
                      <span className="truncate text-sm font-semibold">
                        {pet?.name || 'Pet'}
                      </span>
                    </div>

                    {client && (
                      <div className="mt-1 truncate text-xs opacity-85">
                        Tutor: {client.name}
                      </div>
                    )}
                  </div>

                  <Badge
                    variant="outline"
                    className="h-6 px-2 text-[10px] leading-none bg-white/60 border-current/10 shrink-0"
                  >
                    {statusMeta.label}
                  </Badge>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <div className="rounded-xl bg-white/40 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide opacity-70">
                      Check-in
                    </div>
                    <div className="text-xs font-medium">
                      {format(checkIn, "dd/MM/yyyy")}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white/40 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide opacity-70">
                      Check-out
                    </div>
                    <div className="text-xs font-medium">
                      {format(checkOut, "dd/MM/yyyy")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </button>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onClick={() => onEventClick(evt)}>
            <Pencil className="mr-2 h-4 w-4" /> Editar
          </ContextMenuItem>
          <ContextMenuSeparator />
          {evt.status === 'cancelled' ? (
            <ContextMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir Agendamento
            </ContextMenuItem>
          ) : (
            <ContextMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirmCancel(true)}
            >
              <XCircle className="mr-2 h-4 w-4" /> Cancelar Hospedagem
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Hospedagem</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar esta hospedagem?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCancel(false)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onCancel(evt)
                setConfirmCancel(false)
              }}
            >
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Agendamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o agendamento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(evt)
                setConfirmDelete(false)
              }}
            >
              Sim, Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function BoardingSection({
  title,
  description,
  items,
  pets,
  clients,
  onEventClick,
  onCancelAppointment,
  onDeleteAppointment,
  emptyText,
}: {
  title: string
  description: string
  items: Appointment[]
  pets?: Pet[]
  clients?: Client[]
  onEventClick: (event: Appointment) => void
  onCancelAppointment: (event: Appointment) => void
  onDeleteAppointment: (event: Appointment) => void
  emptyText: string
}) {
  return (
    <div className="rounded-2xl border bg-background shadow-sm">
      <div className="border-b px-4 py-3">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>

      <div className="p-4">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((evt) => (
              <BoardingCard
                key={evt.id}
                evt={evt}
                pets={pets || []}
                clients={clients || []}
                onEventClick={onEventClick}
                onCancel={onCancelAppointment}
                onDelete={onDeleteAppointment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function BoardingDayView({
  currentDate,
  events,
  pets = [],
  clients = [],
  onEventClick,
  onCancelAppointment,
  onDeleteAppointment,
}: BoardingDayViewProps) {
  const dayStart = startOfDay(currentDate)
  const dayEnd = endOfDay(currentDate)

  const boardingEvents = useMemo(() => {
    return events
      .filter((evt) => evt.serviceType === 'boarding')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [events])

  const checkIns = useMemo(() => {
    return boardingEvents.filter((evt) => {
      const { checkIn } = getBoardingDates(evt)
      return isSameDay(checkIn, currentDate)
    })
  }, [boardingEvents, currentDate])

  const checkOuts = useMemo(() => {
    return boardingEvents.filter((evt) => {
      const { checkOut } = getBoardingDates(evt)
      return isSameDay(checkOut, currentDate)
    })
  }, [boardingEvents, currentDate])

  const hostedToday = useMemo(() => {
    return boardingEvents.filter((evt) => {
      const { checkIn, checkOut } = getBoardingDates(evt)

      const isInDayRange =
        isWithinInterval(dayStart, { start: checkIn, end: checkOut }) ||
        isWithinInterval(dayEnd, { start: checkIn, end: checkOut }) ||
        (checkIn <= dayStart && checkOut >= dayEnd)

      return isInDayRange
    })
  }, [boardingEvents, dayStart, dayEnd])

  const hostedOnly = useMemo(() => {
    const checkInIds = new Set(checkIns.map((item) => item.id))
    const checkOutIds = new Set(checkOuts.map((item) => item.id))

    return hostedToday.filter((evt) => !checkInIds.has(evt.id) && !checkOutIds.has(evt.id))
  }, [hostedToday, checkIns, checkOuts])

  const summary = {
    checkIns: checkIns.length,
    hosted: hostedToday.length,
    checkOuts: checkOuts.length,
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header do dia */}
      <div className="rounded-2xl border bg-background px-4 py-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold capitalize">
              {format(currentDate, 'EEEE', { locale: ptBR })}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="h-7 px-3 rounded-full">
              Check-ins: {summary.checkIns}
            </Badge>

            <Badge variant="outline" className="h-7 px-3 rounded-full">
              Hospedados: {summary.hosted}
            </Badge>

            <Badge variant="outline" className="h-7 px-3 rounded-full">
              Check-outs: {summary.checkOuts}
            </Badge>
          </div>
        </div>
      </div>

      {/* Seções */}
      <div className="grid gap-4 xl:grid-cols-3">
        <BoardingSection
          title="Check-ins do Dia"
          description="Entradas previstas para hoje"
          items={checkIns}
          pets={pets}
          clients={clients}
          onEventClick={onEventClick}
          onCancelAppointment={onCancelAppointment}
          onDeleteAppointment={onDeleteAppointment}
          emptyText="Nenhum check-in previsto para hoje."
        />

        <BoardingSection
          title="Hospedados no Dia"
          description="Pets que permanecem hospedados hoje"
          items={hostedOnly}
          pets={pets}
          clients={clients}
          onEventClick={onEventClick}
          onCancelAppointment={onCancelAppointment}
          onDeleteAppointment={onDeleteAppointment}
          emptyText="Nenhum pet em permanência hoje."
        />

        <BoardingSection
          title="Check-outs do Dia"
          description="Saídas previstas para hoje"
          items={checkOuts}
          pets={pets}
          clients={clients}
          onEventClick={onEventClick}
          onCancelAppointment={onCancelAppointment}
          onDeleteAppointment={onDeleteAppointment}
          emptyText="Nenhum check-out previsto para hoje."
        />
      </div>
    </div>
  )
}