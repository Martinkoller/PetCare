import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Appointment, Client, Pet } from '@/lib/types'
import { usePetStore } from '@/stores/PetContext'
import { useClientStore } from '@/stores/ClientContext'
import { useConfigStore } from '@/stores/ConfigStore'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  UserPlus,
  Plus,
  CalendarDays,
  Clock3,
  Stethoscope,
  Scissors,
  Building2,
  UserRound,
} from 'lucide-react'
import { ClientDialog } from '@/pages/clients/ClientDialog'
import { PetDialog } from '@/pages/pets/PetDialog'

interface ScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (appointment: Appointment) => void
  appointment?: Partial<Appointment>
  initialDate?: Date
  defaultServiceType?: ServiceType
}

type ServiceType = 'grooming' | 'consultation' | 'boarding'

type BoardingStatus =
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'checked_out'
  | 'completed'
  | 'cancelled'

type GeneralStatus = 'scheduled' | 'confirmed' | 'cancelled'

type AppointmentStatus = BoardingStatus | GeneralStatus

interface FormState {
  id?: string
  clientId: string
  petId: string
  professionalId: string
  serviceType: ServiceType
  date: string
  time: string
  returnDate: string
  returnTime: string
  duration: number
  notes: string
  status: AppointmentStatus
}

function toDateInput(date: Date) {
  return format(date, 'yyyy-MM-dd')
}

function toTimeInput(date: Date) {
  return format(date, 'HH:mm')
}

function combineDateTime(dateStr: string, timeStr: string) {
  return new Date(`${dateStr}T${timeStr}:00`)
}

function isValidDate(d: Date) {
  return !Number.isNaN(d.getTime())
}

function getDefaultServiceDuration(serviceType: ServiceType) {
  switch (serviceType) {
    case 'consultation':
      return 30
    case 'grooming':
      return 60
    case 'boarding':
      return 0
    default:
      return 60
  }
}

function getDefaultTimes(serviceType: ServiceType) {
  if (serviceType === 'boarding') return { start: '09:00', end: '18:00' }
  return { start: '09:00', end: '09:30' }
}

function getDefaultStatus(_serviceType: ServiceType): AppointmentStatus {
  return 'scheduled'
}

function normalizeStatusForService(
  serviceType: ServiceType,
  status?: string,
): AppointmentStatus {
  if (serviceType === 'boarding') {
    const allowed: BoardingStatus[] = [
      'scheduled',
      'confirmed',
      'checked_in',
      'in_progress',
      'checked_out',
      'completed',
      'cancelled',
    ]

    if (status && allowed.includes(status as BoardingStatus)) {
      return status as BoardingStatus
    }

    return 'scheduled'
  }

  const allowed: GeneralStatus[] = ['scheduled', 'confirmed', 'cancelled']

  if (status && allowed.includes(status as GeneralStatus)) {
    return status as GeneralStatus
  }

  return 'scheduled'
}

function getBoardingStatusLabel(status: AppointmentStatus) {
  switch (status) {
    case 'scheduled':
      return 'Reservado'
    case 'confirmed':
      return 'Confirmado'
    case 'checked_in':
      return 'Hospedado'
    case 'in_progress':
      return 'Hospedado'
    case 'checked_out':
      return 'Encerrado'
    case 'completed':
      return 'Encerrado'
    case 'cancelled':
      return 'Cancelado'
    default:
      return 'Reservado'
  }
}

function getBoardingStatusBadgeClass(status: AppointmentStatus) {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-300'
    case 'checked_in':
    case 'in_progress':
      return 'bg-blue-50 text-blue-700 border-blue-300'
    case 'checked_out':
    case 'completed':
      return 'bg-slate-50 text-slate-700 border-slate-300'
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-300'
    default:
      return 'bg-orange-50 text-orange-700 border-orange-300'
  }
}

function getGeneralStatusLabel(status: AppointmentStatus) {
  switch (status) {
    case 'scheduled':
      return 'Agendado'
    case 'confirmed':
      return 'Confirmado'
    case 'cancelled':
      return 'Cancelado'
    default:
      return 'Agendado'
  }
}

function getGeneralStatusBadgeClass(status: AppointmentStatus) {
  switch (status) {
    case 'confirmed':
      return 'bg-blue-50 text-blue-700 border-blue-300'
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-300'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-300'
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case 'groomer':
      return 'Tosador(a)'
    case 'veterinarian':
      return 'Veterinário(a)'
    case 'attendant':
      return 'Atendente'
    case 'admin':
      return 'Admin'
    default:
      return role
  }
}

function getServiceTypeLabel(serviceType: ServiceType) {
  switch (serviceType) {
    case 'grooming':
      return 'Banho e Tosa'
    case 'consultation':
      return 'Consulta Médica'
    case 'boarding':
      return 'Hospedagem'
    default:
      return 'Atendimento'
  }
}

function getServiceTypeBadgeClass(serviceType: ServiceType) {
  switch (serviceType) {
    case 'grooming':
      return 'bg-purple-50 text-purple-700 border-purple-300'
    case 'consultation':
      return 'bg-blue-50 text-blue-700 border-blue-300'
    case 'boarding':
      return 'bg-orange-50 text-orange-700 border-orange-300'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-300'
  }
}

function getServiceIcon(serviceType: ServiceType) {
  switch (serviceType) {
    case 'grooming':
      return <Scissors className="h-4 w-4" />
    case 'consultation':
      return <Stethoscope className="h-4 w-4" />
    case 'boarding':
      return <Building2 className="h-4 w-4" />
    default:
      return <CalendarDays className="h-4 w-4" />
  }
}

export function ScheduleDialog({
  open,
  onOpenChange,
  onSave,
  appointment,
  initialDate,
  defaultServiceType,
}: ScheduleDialogProps) {
  const { pets } = usePetStore()
  const { clients } = useClientStore()
  const { profiles } = useConfigStore()

  const safeInitialDate = useMemo(() => initialDate ?? new Date(), [initialDate])

  const [form, setForm] = useState<FormState>({
    clientId: '',
    petId: '',
    professionalId: '',
    serviceType: 'grooming',
    date: toDateInput(safeInitialDate),
    time: '09:00',
    returnDate: toDateInput(safeInitialDate),
    returnTime: '18:00',
    duration: 60,
    notes: '',
    status: 'scheduled',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [petDialogOpen, setPetDialogOpen] = useState(false)

  const petsForClient = useMemo(
    () => (form.clientId ? pets.filter((p) => p.clientId === form.clientId) : []),
    [pets, form.clientId],
  )

  const selectedPet = useMemo(
    () => pets.find((p) => p.id === form.petId),
    [pets, form.petId],
  )

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === form.clientId),
    [clients, form.clientId],
  )

  const availableProfessionals = useMemo(() => {
    const eligible = profiles.filter((p) =>
      ['groomer', 'veterinarian', 'attendant', 'admin'].includes(p.role),
    )

    if (form.serviceType === 'grooming') {
      return eligible.filter((p) =>
        ['groomer', 'admin', 'attendant'].includes(p.role),
      )
    }

    if (form.serviceType === 'consultation') {
      return eligible.filter((p) =>
        ['veterinarian', 'admin'].includes(p.role),
      )
    }

    return eligible
  }, [profiles, form.serviceType])

  useEffect(() => {
    if (!open) return

    const serviceType =
      (appointment?.serviceType as ServiceType) ||
      defaultServiceType ||
      'grooming'

    const defaultTimes = getDefaultTimes(serviceType)

    const startDate = appointment?.date ? new Date(appointment.date) : safeInitialDate
    const endDate =
      appointment?.returnDate && serviceType === 'boarding'
        ? new Date(appointment.returnDate)
        : safeInitialDate

    const safeStart = isValidDate(startDate) ? startDate : safeInitialDate
    const safeEnd = isValidDate(endDate) ? endDate : safeInitialDate

    const existingPet = appointment?.petId
      ? pets.find((p) => p.id === appointment.petId)
      : undefined

    setForm({
      id: appointment?.id,
      clientId: existingPet?.clientId || '',
      petId: appointment?.petId || '',
      professionalId: appointment?.professionalId || '',
      serviceType,
      date: toDateInput(safeStart),
      time: appointment?.date ? toTimeInput(safeStart) : defaultTimes.start,
      returnDate: toDateInput(safeEnd),
      returnTime:
        appointment?.returnDate && serviceType === 'boarding'
          ? toTimeInput(safeEnd)
          : defaultTimes.end,
      duration: appointment?.duration ?? getDefaultServiceDuration(serviceType),
      notes: appointment?.notes || '',
      status: normalizeStatusForService(serviceType, appointment?.status),
    })

    setErrors({})
  }, [open, appointment, safeInitialDate, pets, defaultServiceType])

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      if (!prev[field]) return prev
      const clone = { ...prev }
      delete clone[field]
      return clone
    })
  }

  const handleClientChange = (clientId: string) => {
    setForm((prev) => ({ ...prev, clientId, petId: '' }))
    setErrors((prev) => {
      const clone = { ...prev }
      delete clone.clientId
      delete clone.petId
      return clone
    })
  }

  const handleServiceTypeChange = (value: ServiceType) => {
    const defaultTimes = getDefaultTimes(value)

    setForm((prev) => {
      const eligibleForNewType = profiles.filter((p) => {
        if (!['groomer', 'veterinarian', 'attendant', 'admin'].includes(p.role)) {
          return false
        }

        if (value === 'grooming') {
          return ['groomer', 'admin', 'attendant'].includes(p.role)
        }

        if (value === 'consultation') {
          return ['veterinarian', 'admin'].includes(p.role)
        }

        return true
      })

      const currentProfStillValid = eligibleForNewType.some(
        (p) => p.id === prev.professionalId,
      )

      const nextDuration =
        value === 'boarding'
          ? 0
          : prev.serviceType === 'boarding'
            ? getDefaultServiceDuration(value)
            : prev.duration || getDefaultServiceDuration(value)

      return {
        ...prev,
        serviceType: value,
        duration: nextDuration,
        time: value === 'boarding' ? defaultTimes.start : prev.time || defaultTimes.start,
        returnTime: value === 'boarding' ? defaultTimes.end : prev.returnTime,
        professionalId: currentProfStillValid ? prev.professionalId : '',
        status:
          prev.serviceType === value
            ? normalizeStatusForService(value, prev.status)
            : getDefaultStatus(value),
      }
    })

    setErrors({})
  }

  const autoFixBoardingDates = () => {
    if (form.serviceType !== 'boarding') return

    const start = combineDateTime(form.date, form.time || '09:00')
    const end = combineDateTime(form.returnDate, form.returnTime || '18:00')

    if (!isValidDate(start) || !isValidDate(end)) return

    if (end <= start) {
      const corrected = new Date(start)
      corrected.setDate(corrected.getDate() + 1)
      corrected.setHours(18, 0, 0, 0)

      setForm((prev) => ({
        ...prev,
        returnDate: toDateInput(corrected),
        returnTime: toTimeInput(corrected),
      }))

      toast.info('Saída ajustada automaticamente', {
        description: 'Corrigida para o próximo dia às 18:00.',
      })
    }
  }

  const validate = () => {
    const errs: Record<string, string> = {}

    if (!form.clientId) errs.clientId = 'Selecione um tutor.'
    if (!form.petId) errs.petId = 'Selecione um pet.'

    if (form.serviceType !== 'boarding' && !form.professionalId) {
      errs.professionalId = 'Selecione um profissional.'
    }

    if (!form.date) errs.date = 'Informe a data.'
    if (!form.time) errs.time = 'Informe o horário.'

    const start = combineDateTime(form.date, form.time || '09:00')
    if (!isValidDate(start)) errs.date = 'Data/hora inválida.'

    if (form.serviceType === 'boarding') {
      if (!form.returnDate) errs.returnDate = 'Informe a data de saída.'
      if (!form.returnTime) errs.returnTime = 'Informe o horário de saída.'

      const end = combineDateTime(form.returnDate, form.returnTime || '18:00')

      if (!isValidDate(end)) {
        errs.returnDate = 'Saída inválida.'
      } else if (isValidDate(start) && end <= start) {
        errs.returnDate = 'A saída deve ser posterior à entrada.'
      }
    } else {
      if (!form.duration || form.duration <= 0) {
        errs.duration = 'Informe uma duração válida.'
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const buildAppointment = (): Appointment | null => {
    const start = combineDateTime(form.date, form.time || '09:00')
    if (!isValidDate(start)) return null

    const boardingReturn =
      form.serviceType === 'boarding'
        ? combineDateTime(form.returnDate, form.returnTime || '18:00')
        : null

    if (
      form.serviceType === 'boarding' &&
      (!boardingReturn || !isValidDate(boardingReturn))
    ) {
      return null
    }

    return {
      id: form.id || crypto.randomUUID(),
      petId: form.petId,
      professionalId: form.professionalId || '',
      serviceType: form.serviceType,
      date: start.toISOString(),
      duration: form.serviceType === 'boarding' ? 0 : Number(form.duration || 0),
      notes: form.notes || '',
      status: form.status as Appointment['status'],
      price: 0,
      ...(form.serviceType === 'boarding'
        ? { returnDate: boardingReturn!.toISOString() }
        : { returnDate: undefined }),
    }
  }

  const handleSubmit = () => {
    if (form.serviceType === 'boarding') {
      autoFixBoardingDates()
    }

    if (!validate()) {
      toast.error('Revise os campos obrigatórios.')
      return
    }

    const result = buildAppointment()

    if (!result) {
      toast.error('Não foi possível montar o agendamento.')
      return
    }

    onSave(result)
  }

  const handleClientSaved = (client: Client) => {
    setForm((prev) => ({ ...prev, clientId: client.id, petId: '' }))
    setClientDialogOpen(false)
    toast.success(`Tutor "${client.name}" cadastrado e selecionado.`)
  }

  const handlePetSaved = (pet: Pet) => {
    setForm((prev) => ({ ...prev, petId: pet.id }))
    setPetDialogOpen(false)
    toast.success(`Pet "${pet.name}" cadastrado e selecionado.`)
  }

  const isBoarding = form.serviceType === 'boarding'
  const isEditing = !!form.id

  const startDT = form.date && form.time ? combineDateTime(form.date, form.time) : null
  const endDT =
    form.returnDate && form.returnTime
      ? combineDateTime(form.returnDate, form.returnTime)
      : null

  const selectedProfessional = useMemo(
    () => profiles.find((p) => p.id === form.professionalId),
    [profiles, form.professionalId],
  )

  const professionalSelectValue =
    isBoarding
      ? (form.professionalId || '__none__')
      : (form.professionalId || undefined)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-auto">
          <DialogHeader className="pb-1">
            <DialogTitle className="flex items-center gap-2">
              {getServiceIcon(form.serviceType)}
              {isEditing ? 'Editar Atendimento' : 'Novo Atendimento'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados principais do atendimento para salvar na agenda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* RESUMO SUPERIOR */}
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge
                  variant="outline"
                  className={getServiceTypeBadgeClass(form.serviceType)}
                >
                  {getServiceTypeLabel(form.serviceType)}
                </Badge>

                <Badge
                  variant="outline"
                  className={
                    isBoarding
                      ? getBoardingStatusBadgeClass(form.status)
                      : getGeneralStatusBadgeClass(form.status)
                  }
                >
                  {isBoarding
                    ? getBoardingStatusLabel(form.status)
                    : getGeneralStatusLabel(form.status)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border bg-background/70 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Tutor / Pet
                  </div>
                  <div className="mt-1 font-medium truncate">
                    {selectedClient?.name || 'Não selecionado'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {selectedPet?.name
                      ? `${selectedPet.name}${selectedPet.breed ? ` • ${selectedPet.breed}` : ''}`
                      : 'Pet não selecionado'}
                  </div>
                </div>

                <div className="rounded-lg border bg-background/70 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Responsável
                  </div>
                  <div className="mt-1 font-medium truncate">
                    {selectedProfessional?.name || 'Não definido'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {selectedProfessional?.role
                      ? getRoleLabel(selectedProfessional.role)
                      : isBoarding
                        ? 'Opcional para hospedagem'
                        : 'Obrigatório'}
                  </div>
                </div>

                <div className="rounded-lg border bg-background/70 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Agendamento
                  </div>
                  <div className="mt-1 font-medium truncate">
                    {form.date
                      ? format(new Date(`${form.date}T00:00:00`), 'dd/MM/yyyy')
                      : '--/--/----'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {isBoarding
                      ? `Entrada ${form.time || '--:--'}`
                      : `${form.time || '--:--'} • ${form.duration || 0} min`}
                  </div>
                </div>
              </div>
            </div>

            {/* TIPO */}
            <div className="space-y-2">
              <Label>Tipo de Atendimento</Label>
              <Select
                value={form.serviceType}
                onValueChange={(v) => handleServiceTypeChange(v as ServiceType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grooming">Banho e Tosa</SelectItem>
                  <SelectItem value="consultation">Consulta Médica</SelectItem>
                  <SelectItem value="boarding">Hospedagem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* TUTOR + PET */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Tutor <span className="text-red-500">*</span>
                </Label>

                <div className="flex gap-2">
                  <Select value={form.clientId} onValueChange={handleClientChange}>
                    <SelectTrigger
                      className={errors.clientId ? 'border-red-500 flex-1' : 'flex-1'}
                    >
                      <SelectValue placeholder="Selecione o tutor" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                          {c.phone ? ` • ${c.phone}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Novo tutor"
                    onClick={() => setClientDialogOpen(true)}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>

                {errors.clientId && (
                  <p className="text-xs text-red-500">{errors.clientId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Pet <span className="text-red-500">*</span>
                </Label>

                <div className="flex gap-2">
                  <Select
                    value={form.petId || undefined}
                    onValueChange={(v) => setField('petId', v)}
                    disabled={!form.clientId}
                  >
                    <SelectTrigger
                      className={errors.petId ? 'border-red-500 flex-1' : 'flex-1'}
                    >
                      <SelectValue
                        placeholder={
                          form.clientId
                            ? petsForClient.length === 0
                              ? 'Nenhum pet cadastrado para este tutor'
                              : 'Selecione o pet'
                            : 'Selecione o tutor primeiro'
                        }
                      />
                    </SelectTrigger>

                    <SelectContent>
                      {petsForClient.map((pet) => (
                        <SelectItem key={pet.id} value={pet.id}>
                          {pet.name}
                          {pet.breed ? ` • ${pet.breed}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Novo pet"
                    disabled={!form.clientId}
                    onClick={() => setPetDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {errors.petId && (
                  <p className="text-xs text-red-500">{errors.petId}</p>
                )}
              </div>
            </div>

            {/* INFO SELECIONADA */}
            {selectedClient && selectedPet && (
              <div className="rounded-lg border bg-muted/20 px-3 py-3 text-sm flex flex-wrap gap-x-5 gap-y-2">
                <span className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Tutor:</span>
                  <strong>{selectedClient.name}</strong>
                </span>

                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Pet:</span>
                  <strong>
                    {selectedPet.name}
                    {selectedPet.breed ? ` • ${selectedPet.breed}` : ''}
                  </strong>
                </span>
              </div>
            )}

            {/* PROFISSIONAL + STATUS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {isBoarding ? 'Responsável (Opcional)' : 'Profissional'}
                  {!isBoarding && <span className="text-red-500"> *</span>}
                </Label>

                <Select
                  value={professionalSelectValue}
                  onValueChange={(v) =>
                    setField('professionalId', v === '__none__' ? '' : v)
                  }
                >
                  <SelectTrigger
                    className={errors.professionalId ? 'border-red-500' : ''}
                  >
                    <SelectValue
                      placeholder={
                        isBoarding
                          ? 'Sem responsável definido'
                          : 'Selecione o profissional'
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {isBoarding && (
                      <SelectItem value="__none__">Sem responsável definido</SelectItem>
                    )}

                    {availableProfessionals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {p.role ? ` • ${getRoleLabel(p.role)}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {errors.professionalId && (
                  <p className="text-xs text-red-500">{errors.professionalId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{isBoarding ? 'Status da Hospedagem' : 'Status do Atendimento'}</Label>

                {isBoarding ? (
                  <Select
                    value={form.status}
                    onValueChange={(v) => setField('status', v as BoardingStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Reservado</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="checked_in">Hospedado (Check-in)</SelectItem>
                      <SelectItem value="in_progress">Hospedado (Em curso)</SelectItem>
                      <SelectItem value="checked_out">Encerrado (Check-out)</SelectItem>
                      <SelectItem value="completed">Encerrado (Finalizado)</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value={form.status}
                    onValueChange={(v) => setField('status', v as GeneralStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Agendado</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <div className="pt-1">
                  <Badge
                    variant="outline"
                    className={
                      isBoarding
                        ? getBoardingStatusBadgeClass(form.status)
                        : getGeneralStatusBadgeClass(form.status)
                    }
                  >
                    {isBoarding
                      ? getBoardingStatusLabel(form.status)
                      : getGeneralStatusLabel(form.status)}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* DATAS / HORÁRIOS */}
            {!isBoarding && (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/15 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium mb-3">
                    <CalendarDays className="h-4 w-4" />
                    Dados do atendimento
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>
                        Data <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={form.date}
                        onChange={(e) => setField('date', e.target.value)}
                        className={errors.date ? 'border-red-500' : ''}
                      />
                      {errors.date && (
                        <p className="text-xs text-red-500">{errors.date}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Horário <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="time"
                        value={form.time}
                        onChange={(e) => setField('time', e.target.value)}
                        className={errors.time ? 'border-red-500' : ''}
                      />
                      {errors.time && (
                        <p className="text-xs text-red-500">{errors.time}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Duração (min) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        min={5}
                        step={5}
                        value={form.duration || ''}
                        onChange={(e) => setField('duration', Number(e.target.value))}
                        className={errors.duration ? 'border-red-500' : ''}
                      />
                      {errors.duration && (
                        <p className="text-xs text-red-500">{errors.duration}</p>
                      )}
                    </div>
                  </div>
                </div>

                {startDT && isValidDate(startDT) && (
                  <div className="rounded-lg border bg-muted/20 px-3 py-3 text-sm">
                    <div className="flex items-center gap-2 font-medium">
                      <Clock3 className="h-4 w-4" />
                      Resumo do atendimento
                    </div>
                    <div className="mt-2 text-muted-foreground">
                      {format(startDT, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      {' • '}
                      <strong>{form.duration || 0} min</strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isBoarding && (
              <div className="space-y-4">
                <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-3 text-sm text-orange-900">
                  <strong>Entrada</strong> = início da estadia &nbsp;•&nbsp;
                  <strong>Saída Prevista</strong> = fim da estadia
                </div>

                <div className="rounded-lg border bg-muted/15 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium mb-3">
                    <Building2 className="h-4 w-4" />
                    Dados da hospedagem
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        Entrada <span className="text-red-500">*</span>
                      </Label>

                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={form.date}
                          onChange={(e) => setField('date', e.target.value)}
                          onBlur={autoFixBoardingDates}
                          className={errors.date ? 'border-red-500' : ''}
                        />
                        <Input
                          type="time"
                          value={form.time}
                          onChange={(e) => setField('time', e.target.value)}
                          onBlur={autoFixBoardingDates}
                          className={errors.time ? 'border-red-500' : ''}
                        />
                      </div>

                      {(errors.date || errors.time) && (
                        <p className="text-xs text-red-500">
                          {errors.date || errors.time}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Saída Prevista <span className="text-red-500">*</span>
                      </Label>

                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={form.returnDate}
                          onChange={(e) => setField('returnDate', e.target.value)}
                          onBlur={autoFixBoardingDates}
                          className={errors.returnDate ? 'border-red-500' : ''}
                        />
                        <Input
                          type="time"
                          value={form.returnTime}
                          onChange={(e) => setField('returnTime', e.target.value)}
                          onBlur={autoFixBoardingDates}
                          className={errors.returnTime ? 'border-red-500' : ''}
                        />
                      </div>

                      {(errors.returnDate || errors.returnTime) && (
                        <p className="text-xs text-red-500">
                          {errors.returnDate || errors.returnTime}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {startDT && isValidDate(startDT) && endDT && isValidDate(endDT) && (
                  <div className="rounded-lg border bg-muted/20 px-3 py-3 text-sm space-y-2">
                    <div className="font-medium">Resumo da hospedagem</div>

                    <div>
                      <span className="text-muted-foreground">Entrada:</span>{' '}
                      <strong>
                        {format(startDT, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </strong>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Saída:</span>{' '}
                      <strong>
                        {format(endDT, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </strong>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Status:</span>{' '}
                      <strong>{getBoardingStatusLabel(form.status)}</strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* OBSERVAÇÕES */}
            <div className="space-y-2">
              <Label>Notas / Observações</Label>
              <Textarea
                placeholder={
                  isBoarding
                    ? 'Ex.: medicação, restrições, alimentação, rotina do pet...'
                    : 'Ex.: observações sobre o atendimento...'
                }
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>

            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleSubmit}
            >
              {isEditing ? 'Salvar Alterações' : 'Criar Atendimento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        onSave={handleClientSaved}
      />

      <PetDialog
        open={petDialogOpen}
        onOpenChange={setPetDialogOpen}
        onSave={handlePetSaved}
        initialClientId={form.clientId || undefined}
      />
    </>
  )
}