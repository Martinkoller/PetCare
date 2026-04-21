import { useMemo, useState } from 'react'
import { addDays, subDays } from 'date-fns'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DayView } from './components/DayView'
import { WeekView } from './components/WeekView'
import { MonthView } from './components/MonthView'

// Ajuste estes imports conforme sua estrutura real:
import { Appointment, Pet, Client, Profile, BusinessHours } from '@/lib/types'

// Se você já usa hooks/queries reais, mantenha os seus.
// Abaixo está um exemplo de props/estado local para não quebrar a ideia.
type CalendarMode = 'day' | 'week' | 'month'
type ScheduleViewMode = 'work' | 'boarding'

interface SchedulePageProps {
  events: Appointment[]
  pets: Pet[]
  clients: Client[]
  profiles: Profile[]
  businessHours?: BusinessHours
  activeProfiles?: string[]
  onEventClick: (event: Appointment) => void
  onCancelAppointment: (event: Appointment) => void
  onTimeClick: (date: Date) => void
  onEventDrop: (event: Appointment, newDate: Date) => void
}

export default function SchedulePage({
  events,
  pets,
  clients,
  profiles,
  businessHours,
  activeProfiles = [],
  onEventClick,
  onCancelAppointment,
  onTimeClick,
  onEventDrop,
}: SchedulePageProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('week')
  const [scheduleViewMode, setScheduleViewMode] =
    useState<ScheduleViewMode>('work')

  // 🔥 FILTRO PRINCIPAL
  const filteredEvents = useMemo(() => {
    if (scheduleViewMode === 'work') {
      return events.filter(
        (event) =>
          event.serviceType === 'grooming' ||
          event.serviceType === 'consultation',
      )
    }

    if (scheduleViewMode === 'boarding') {
      return events.filter((event) => event.serviceType === 'boarding')
    }

    return events
  }, [events, scheduleViewMode])

  const handlePrev = () => {
    if (calendarMode === 'day') {
      setCurrentDate((prev) => subDays(prev, 1))
      return
    }

    if (calendarMode === 'week') {
      setCurrentDate((prev) => subDays(prev, 7))
      return
    }

    // month
    const prev = new Date(currentDate)
    prev.setMonth(prev.getMonth() - 1)
    setCurrentDate(prev)
  }

  const handleNext = () => {
    if (calendarMode === 'day') {
      setCurrentDate((prev) => addDays(prev, 1))
      return
    }

    if (calendarMode === 'week') {
      setCurrentDate((prev) => addDays(prev, 7))
      return
    }

    // month
    const next = new Date(currentDate)
    next.setMonth(next.getMonth() + 1)
    setCurrentDate(next)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Topo da agenda */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Navegação principal */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handlePrev}>
            Anterior
          </Button>

          <Button variant="outline" onClick={handleToday}>
            Hoje
          </Button>

          <Button variant="outline" onClick={handleNext}>
            Próximo
          </Button>
        </div>

        {/* Modos de visualização da agenda */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border p-1 bg-muted/30">
            <Button
              type="button"
              variant={calendarMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCalendarMode('day')}
            >
              Dia
            </Button>

            <Button
              type="button"
              variant={calendarMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCalendarMode('week')}
            >
              Semana
            </Button>

            <Button
              type="button"
              variant={calendarMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCalendarMode('month')}
            >
              Mês
            </Button>
          </div>
        </div>
      </div>

      {/* 🔥 Alternador: Agenda de Trabalho x Agenda de Hospedagem */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border p-1 bg-muted/30">
          <Button
            type="button"
            size="sm"
            variant={scheduleViewMode === 'work' ? 'default' : 'ghost'}
            onClick={() => setScheduleViewMode('work')}
            className={cn(
              scheduleViewMode === 'work' &&
                'bg-primary text-primary-foreground',
            )}
          >
            Agenda de Trabalho
          </Button>

          <Button
            type="button"
            size="sm"
            variant={scheduleViewMode === 'boarding' ? 'default' : 'ghost'}
            onClick={() => setScheduleViewMode('boarding')}
            className={cn(
              scheduleViewMode === 'boarding' &&
                'bg-primary text-primary-foreground',
            )}
          >
            Agenda de Hospedagem
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          {scheduleViewMode === 'work'
            ? 'Exibindo Banho e Tosa + Consulta'
            : 'Exibindo apenas Hospedagem'}
        </div>
      </div>

      {/* Conteúdo da agenda */}
      <div className="flex-1 min-h-0">
        {calendarMode === 'day' && (
          <DayView
            currentDate={currentDate}
            events={filteredEvents}
            profiles={profiles}
            pets={pets}
            clients={clients}
            onEventClick={onEventClick}
            onCancelAppointment={onCancelAppointment}
            onTimeClick={onTimeClick}
            activeProfiles={activeProfiles}
            businessHours={businessHours}
          />
        )}

        {calendarMode === 'week' && (
          <WeekView
            currentDate={currentDate}
            events={filteredEvents}
            pets={pets}
            clients={clients}
            profiles={profiles}
            onEventClick={onEventClick}
            onCancelAppointment={onCancelAppointment}
            onTimeClick={onTimeClick}
            onEventDrop={onEventDrop}
            mode="week"
            businessHours={businessHours}
            activeProfiles={activeProfiles}
          />
        )}

        {calendarMode === 'month' && (
          <MonthView
            currentDate={currentDate}
            events={filteredEvents}
            pets={pets}
            clients={clients}
            profiles={profiles}
            onEventClick={onEventClick}
            onCancelAppointment={onCancelAppointment}
            onTimeClick={onTimeClick}
            onEventDrop={onEventDrop}
            businessHours={businessHours}
            activeProfiles={activeProfiles}
          />
        )}
      </div>
    </div>
  )
}