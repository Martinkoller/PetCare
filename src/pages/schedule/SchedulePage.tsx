import { useEffect, useMemo, useState } from 'react'
import {
  addDays,
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Users,
} from 'lucide-react'

import { DayView } from './components/DayView'
import { WeekView } from './components/WeekView'
import { MonthView } from './components/MonthView'
import { BoardingDayView } from './components/BoardingDayView'
import { BoardingWeekView } from './components/BoardingWeekView'
import { BoardingMonthView } from './components/BoardingMonthView'
import { UnifiedAtendimentoDialog } from '@/components/shared/UnifiedAtendimentoDialog'

import { useAppointmentStore } from '@/stores/AppointmentStore'
import { usePetStore } from '@/stores/PetContext'
import { useClientStore } from '@/stores/ClientContext'
import { useConfigStore } from '@/stores/ConfigStore'

import { Appointment } from '@/lib/types'

type CalendarMode = 'day' | 'week' | 'month'
type ServiceTab = 'work' | 'boarding'

const workLegend = [
  { color: 'bg-slate-200 border border-slate-400', label: 'Agendado' },
  { color: 'bg-blue-200 border border-blue-400', label: 'Confirmado' },
  { color: 'bg-amber-200 border border-amber-400', label: 'Em Atendimento' },
  { color: 'bg-green-200 border border-green-400', label: 'Finalizado' },
  { color: 'bg-red-200 border border-red-400', label: 'Cancelado' },
]

const boardingLegend = [
  { color: 'bg-orange-200 border border-orange-400', label: 'Reservado' },
  { color: 'bg-emerald-200 border border-emerald-400', label: 'Confirmado' },
  { color: 'bg-blue-200 border border-blue-400', label: 'Hospedado' },
  { color: 'bg-slate-200 border border-slate-400', label: 'Encerrado' },
  { color: 'bg-red-200 border border-red-400', label: 'Cancelado' },
]

const workStatusOptions = [
  { value: 'scheduled', label: 'Agendado' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'in_progress', label: 'Em Atendimento' },
  { value: 'completed', label: 'Finalizado' },
  { value: 'cancelled', label: 'Cancelado' },
]

const boardingStatusOptions = [
  { value: 'scheduled', label: 'Reservado' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'checked_in', label: 'Hospedado' },
  { value: 'in_progress', label: 'Hospedado' },
  { value: 'checked_out', label: 'Encerrado' },
  { value: 'completed', label: 'Encerrado' },
  { value: 'cancelled', label: 'Cancelado' },
]

const viewButtonClass = (active: boolean) =>
  cn(
    'h-10 px-4 rounded-xl border text-sm font-medium transition-all',
    active
      ? 'bg-orange-500 text-white border-orange-500 shadow-sm hover:bg-orange-600'
      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
  )

export default function SchedulePage() {
  const { appointments, updateAppointment, addAppointment, refreshAppointments, deleteAppointment, updateAppointmentStatus } = useAppointmentStore()
  const { pets } = usePetStore()
  const { clients } = useClientStore()
  const { businessHours, profiles } = useConfigStore()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [mode, setMode] = useState<CalendarMode>('week')
  const [serviceTab, setServiceTab] = useState<ServiceTab>('work')

  const [activeProfiles, setActiveProfiles] = useState<string[]>([])
  const [activeStatuses, setActiveStatuses] = useState<string[]>([])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isReadOnly, setIsReadOnly] = useState(false)

  useEffect(() => {
    let start, end;
    if (mode === 'day') {
      start = format(currentDate, 'yyyy-MM-ddT00:00:00');
      end = format(currentDate, 'yyyy-MM-ddT23:59:59');
    } else if (mode === 'week') {
      const s = startOfWeek(currentDate, { weekStartsOn: 0 });
      const e = endOfWeek(currentDate, { weekStartsOn: 0 });
      start = format(s, 'yyyy-MM-ddT00:00:00');
      end = format(e, 'yyyy-MM-ddT23:59:59');
    } else {
      const s = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const e = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      start = format(s, 'yyyy-MM-ddT00:00:00');
      end = format(e, 'yyyy-MM-ddT23:59:59');
    }
    refreshAppointments(start, end)
  }, [refreshAppointments, currentDate, mode])

  const statusOptions =
    serviceTab === 'boarding' ? boardingStatusOptions : workStatusOptions

  const legendItems =
    serviceTab === 'boarding' ? boardingLegend : workLegend

  const { startHour, endHour } = useMemo(() => {
    const timeToMin = (t: string) => {
      const [h, m] = t.split(':').map(Number)
      return h * 60 + (m || 0)
    }
    let minMin = 7 * 60
    let maxMin = 19 * 60
    if (businessHours && !('openHour' in businessHours) && !('closeHour' in businessHours)) {
      Object.values(businessHours).forEach((day: any) => {
        if (!day?.open) return
        if (day.start) {
          const m = timeToMin(day.start)
          if (m < minMin) minMin = m
        }
        const ends = [day.end, day.end2].filter(Boolean)
        ends.forEach((t: string) => {
          const m = timeToMin(t)
          if (m > maxMin) maxMin = m
        })
      })
    }
    return {
      startHour: Math.floor(minMin / 60),
      endHour: Math.ceil(maxMin / 60),
    }
  }, [businessHours])

  const filteredEvents = useMemo(() => {
    return appointments.filter((evt) => {
      const isBoarding = evt.serviceType === 'boarding'

      if (serviceTab === 'boarding' && !isBoarding) return false
      if (serviceTab === 'work' && isBoarding) return false

      if (activeProfiles.length > 0) {
        const profId = evt.professionalId || 'unassigned'
        if (!activeProfiles.includes(profId)) return false
      }

      if (activeStatuses.length > 0) {
        if (!activeStatuses.includes(evt.status)) return false
      }

      return true
    })
  }, [appointments, serviceTab, activeProfiles, activeStatuses])

  const headerLabel = useMemo(() => {
    const prefix = serviceTab === 'work' ? 'Agenda de Trabalho' : 'Hospedagem'

    if (mode === 'day') {
      return `${prefix} • ${format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", {
        locale: ptBR,
      })}`
    }

    if (mode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 })
      const end = endOfWeek(currentDate, { weekStartsOn: 0 })

      return `${prefix} • ${format(start, 'dd/MM', { locale: ptBR })} a ${format(
        end,
        'dd/MM/yyyy',
        { locale: ptBR },
      )}`
    }

    return `${prefix} • ${format(currentDate, "MMMM 'de' yyyy", {
      locale: ptBR,
    })}`
  }, [currentDate, mode, serviceTab])

  const handlePrev = () => {
    if (mode === 'day') setCurrentDate((prev) => subDays(prev, 1))
    else if (mode === 'week') setCurrentDate((prev) => subWeeks(prev, 1))
    else setCurrentDate((prev) => subMonths(prev, 1))
  }

  const handleNext = () => {
    if (mode === 'day') setCurrentDate((prev) => addDays(prev, 1))
    else if (mode === 'week') setCurrentDate((prev) => addWeeks(prev, 1))
    else setCurrentDate((prev) => addMonths(prev, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleTimeClick = (date: Date) => {
    setSelectedAppointment(null)
    setSelectedDate(date)
    setIsReadOnly(false)
    setDialogOpen(true)
  }

  const handleNewAppointment = () => {
    setSelectedAppointment(null)
    setSelectedDate(new Date())
    setIsReadOnly(false)
    setDialogOpen(true)
  }

  const handleEventClick = (event: Appointment) => {
    const isCompleted = event.status === 'completed' || event.status === 'checked_out'
    
    setSelectedAppointment(event)
    setSelectedDate(null)
    setIsReadOnly(isCompleted)
    setDialogOpen(true)
  }

  const handleEventDrop = async (event: Appointment, newDate: Date) => {
    if (event.status === 'completed') {
      if (!window.confirm('Este agendamento está FINALIZADO. Deseja alterar o horário?')) {
        return
      }
    }
    await updateAppointment({
      ...event,
      date: newDate.toISOString(),
    })
  }

  const handleCancelAppointment = async (event: Appointment) => {
    await updateAppointment({
      ...event,
      status: 'cancelled',
    })
  }

  const handleDeleteAppointment = async (event: Appointment) => {
    await deleteAppointment(event.id)
  }

  const toggleProfile = (profileId: string) => {
    setActiveProfiles((prev) =>
      prev.includes(profileId)
        ? prev.filter((id) => id !== profileId)
        : [...prev, profileId],
    )
  }

  const toggleStatus = (status: string) => {
    setActiveStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((id) => id !== status)
        : [...prev, status],
    )
  }

  const clearFilters = () => {
    setActiveProfiles([])
    setActiveStatuses([])
  }

  const renderCurrentView = () => {
    if (serviceTab === 'boarding') {
      if (mode === 'day') {
        return (
          <BoardingDayView
            currentDate={currentDate}
            events={filteredEvents}
            pets={pets}
            clients={clients}
            onEventClick={handleEventClick}
            onCancelAppointment={handleCancelAppointment}
            onDeleteAppointment={handleDeleteAppointment}
            onUpdateStatus={(id, status) => updateAppointmentStatus(id, status)}
          />
        )
      }

      if (mode === 'week') {
        return (
          <BoardingWeekView
            currentDate={currentDate}
            events={filteredEvents}
            pets={pets}
            clients={clients}
            onEventClick={handleEventClick}
            onCancelAppointment={handleCancelAppointment}
            onDeleteAppointment={handleDeleteAppointment}
            onUpdateStatus={(id, status) => updateAppointmentStatus(id, status)}
          />
        )
      }

      return (
        <BoardingMonthView
          currentDate={currentDate}
          events={filteredEvents}
          pets={pets}
          clients={clients}
          onEventClick={handleEventClick}
          onCancelAppointment={handleCancelAppointment}
          onDeleteAppointment={handleDeleteAppointment}
          onUpdateStatus={(id, status) => updateAppointmentStatus(id, status)}
        />
      )
    }

    if (mode === 'day') {
      return (
        <DayView
          currentDate={currentDate}
          events={filteredEvents}
          pets={pets}
          clients={clients}
          profiles={profiles}
          onEventClick={handleEventClick}
          onCancelAppointment={handleCancelAppointment}
          onDeleteAppointment={handleDeleteAppointment}
          onTimeClick={handleTimeClick}
          onEventDrop={handleEventDrop}
          onUpdateStatus={(id, status) => updateAppointmentStatus(id, status)}
          startHour={startHour}
          endHour={endHour}
          businessHours={businessHours}
          activeProfiles={activeProfiles}
        />
      )
    }

    if (mode === 'week') {
      return (
        <WeekView
          currentDate={currentDate}
          events={filteredEvents}
          pets={pets}
          clients={clients}
          profiles={profiles}
          onEventClick={handleEventClick}
          onCancelAppointment={handleCancelAppointment}
          onDeleteAppointment={handleDeleteAppointment}
          onTimeClick={handleTimeClick}
          onEventDrop={handleEventDrop}
          onUpdateStatus={(id, status) => updateAppointmentStatus(id, status)}
          mode={mode}
          startHour={startHour}
          endHour={endHour}
          businessHours={businessHours}
          activeProfiles={activeProfiles}
        />
      )
    }

    return (
      <MonthView
        currentDate={currentDate}
        events={filteredEvents}
        pets={pets}
        clients={clients}
        profiles={profiles}
        onEventClick={handleEventClick}
        onCancelAppointment={handleCancelAppointment}
        onDeleteAppointment={handleDeleteAppointment}
        onTimeClick={handleTimeClick}
        onEventDrop={handleEventDrop}
        onUpdateStatus={(id, status) => updateAppointmentStatus(id, status)}
        activeProfiles={activeProfiles}
      />
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground capitalize">{headerLabel}</p>
        </div>

        <Button
          className="h-11 px-5 rounded-xl bg-orange-500 hover:bg-orange-600"
          onClick={handleNewAppointment}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      {/* Painel superior */}
      <div className="rounded-2xl border bg-background p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Bloco esquerdo */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border bg-white p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                className="h-8 px-3 rounded-lg font-medium"
                onClick={handleToday}
              >
                Hoje
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1 rounded-xl border bg-white p-1">
              <Button
                className={viewButtonClass(mode === 'day')}
                onClick={() => setMode('day')}
              >
                Dia
              </Button>
              <Button
                className={viewButtonClass(mode === 'week')}
                onClick={() => setMode('week')}
              >
                Semana
              </Button>
              <Button
                className={viewButtonClass(mode === 'month')}
                onClick={() => setMode('month')}
              >
                Mês
              </Button>
            </div>
          </div>

          {/* Bloco direito */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border bg-white p-1">
              <Button
                className={viewButtonClass(serviceTab === 'work')}
                onClick={() => {
                  setServiceTab('work')
                  setActiveStatuses([])
                }}
              >
                Agenda de Trabalho
              </Button>
              <Button
                className={viewButtonClass(serviceTab === 'boarding')}
                onClick={() => {
                  setServiceTab('boarding')
                  setActiveStatuses([])
                }}
              >
                Hospedagem
              </Button>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 rounded-xl">
                  <Users className="mr-2 h-4 w-4" />
                  Profissionais
                  {activeProfiles.length > 0 && (
                    <Badge className="ml-2 h-5 px-1.5 text-[10px] bg-orange-500 hover:bg-orange-500">
                      {activeProfiles.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <div className="space-y-3">
                  <div className="text-sm font-semibold">Filtrar por profissionais</div>

                  <div className="space-y-2 max-h-72 overflow-auto pr-1">
                    <label className="flex items-center gap-3 rounded-lg border p-2 cursor-pointer hover:bg-muted/40">
                      <Checkbox
                        checked={activeProfiles.includes('unassigned')}
                        onCheckedChange={() => toggleProfile('unassigned')}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">Sem responsável</div>
                      </div>
                    </label>

                    {profiles?.map((profile) => (
                      <label
                        key={profile.id}
                        className="flex items-center gap-3 rounded-lg border p-2 cursor-pointer hover:bg-muted/40"
                      >
                        <Checkbox
                          checked={activeProfiles.includes(profile.id)}
                          onCheckedChange={() => toggleProfile(profile.id)}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{profile.name}</div>
                          {profile.role && (
                            <div className="text-xs text-muted-foreground truncate">
                              {profile.role}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 rounded-xl">
                  <Filter className="mr-2 h-4 w-4" />
                  Status
                  {activeStatuses.length > 0 && (
                    <Badge className="ml-2 h-5 px-1.5 text-[10px] bg-orange-500 hover:bg-orange-500">
                      {activeStatuses.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <div className="space-y-3">
                  <div className="text-sm font-semibold">Filtrar por status</div>

                  <div className="space-y-2">
                    {statusOptions.map((status) => (
                      <label
                        key={`${status.value}-${status.label}`}
                        className="flex items-center gap-3 rounded-lg border p-2 cursor-pointer hover:bg-muted/40"
                      >
                        <Checkbox
                          checked={activeStatuses.includes(status.value)}
                          onCheckedChange={() => toggleStatus(status.value)}
                        />
                        <div className="text-sm font-medium">{status.label}</div>
                      </label>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {(activeProfiles.length > 0 || activeStatuses.length > 0) && (
              <Button
                variant="ghost"
                className="h-10 rounded-xl"
                onClick={clearFilters}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-3 flex flex-wrap gap-4 border-t pt-3">
          {legendItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <span className={cn('h-3 w-3 rounded-full', item.color)} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Chips filtros ativos */}
        {(activeProfiles.length > 0 || activeStatuses.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
            {activeProfiles.map((profileId) => {
              if (profileId === 'unassigned') {
                return (
                  <Badge
                    key={profileId}
                    variant="secondary"
                    className="rounded-full px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200"
                  >
                    Prof.: Sem responsável
                  </Badge>
                )
              }

              const profile = profiles?.find((p) => p.id === profileId)

              return (
                <Badge
                  key={profileId}
                  variant="secondary"
                  className="rounded-full px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200"
                >
                  Prof.: {profile?.name || 'Sem nome'}
                </Badge>
              )
            })}

            {activeStatuses.map((statusId) => {
              const status = statusOptions.find((s) => s.value === statusId)

              return (
                <Badge
                  key={statusId}
                  variant="secondary"
                  className="rounded-full px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200"
                >
                  Status: {status?.label || statusId}
                </Badge>
              )
            })}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-h-0">
        {renderCurrentView()}
      </div>

      <UnifiedAtendimentoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointment={selectedAppointment ? selectedAppointment : (selectedDate ? { date: selectedDate.toISOString() } : undefined)}
        readOnly={isReadOnly}
        onSave={() => {
          setDialogOpen(false)
          setSelectedAppointment(null)
          setSelectedDate(null)
        }}
      />
    </div>
  )
}
