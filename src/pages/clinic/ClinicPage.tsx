import { useMemo, useState } from 'react'
import { useAppointmentStore } from '@/stores/AppointmentStore'
import { useConfigStore } from '@/stores/ConfigStore'
import { useClientStore } from '@/stores/ClientContext'
import { usePetStore } from '@/stores/PetContext'
import { Appointment, Pet } from '@/lib/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  FileText,
  Syringe,
  ClipboardList,
  Clock,
  MessageCircle,
  Play,
  Stethoscope,
  Plus,
  Trash,
  Search,
  Filter,
  Edit,
  CheckCircle2,
  Timer,
  AlertTriangle,
  CalendarDays,
} from 'lucide-react'
import { format } from 'date-fns'
import { ConsultationModal } from './ConsultationModal'
import { PatientHistorySheet } from './PatientHistorySheet'
import { UnifiedAtendimentoDialog } from '@/components/shared/UnifiedAtendimentoDialog'
import { useProfessionals } from '@/hooks/useProfessionals'
import { useAuthStore } from '@/stores/useAuthStore'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import WhatsAppConfirmDialog from '@/components/shared/WhatsAppConfirmDialog'

type ClinicStage =
  | 'scheduled'
  | 'waiting'
  | 'triage'
  | 'consultation'
  | 'completed'
  | 'cancelled'

const STAGE_TARGET_MINUTES: Record<ClinicStage, number> = {
  scheduled: 0,
  waiting: 15,
  triage: 20,
  consultation: 40,
  completed: 0,
  cancelled: 0,
}

export default function ClinicPage() {
  const {
    appointments,
    updateAppointmentStatus,
    addAppointment,
    updateAppointment,
    deleteAppointment,
  } = useAppointmentStore()
  const { pets } = usePetStore()
  const { clients } = useClientStore()
  const { sendManualNotification } = useConfigStore()
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null)
  const [historyPet, setHistoryPet] = useState<Pet | null>(null)
  const [isNewConsultationOpen, setIsNewConsultationOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null)

  const { professionals } = useProfessionals()
  const { user } = useAuthStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [professionalFilter, setProfessionalFilter] = useState<string>('all')
  const [pendingWA, setPendingWA] = useState<{ clientId: string; clientName: string; petName: string; phone?: string; message: string } | null>(null)

  const consultations = useMemo(
    () =>
      appointments
        .filter((a) => a.serviceType === 'consultation')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [appointments],
  )

  const getPet = (id: string) => pets.find((p) => p.id === id)
  const getClient = (petId: string) => {
    const pet = getPet(petId)
    return pet ? clients.find((c) => c.id === pet.clientId) : null
  }

  const getStage = (apt: Appointment): ClinicStage => {
    if (apt.status === 'cancelled') return 'cancelled'
    if (apt.status === 'completed' || apt.clinicalStatus === 'completed') {
      return 'completed'
    }

    if (apt.clinicalStatus === 'triage') return 'triage'
    if (apt.clinicalStatus === 'consultation') return 'consultation'

    if (apt.status === 'scheduled') return 'scheduled'
    return 'waiting'
  }

  const now = new Date()
  const todayKey = now.toISOString().split('T')[0]

  const todaysConsultations = useMemo(
    () =>
      consultations
        .filter((a) => 
          a.date.startsWith(todayKey) && 
          a.status !== 'cancelled' &&
          (professionalFilter === 'all' || a.professionalId === professionalFilter)
        )
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [consultations, todayKey, professionalFilter],
  )

  const todaysReturns = useMemo(
    () =>
      consultations.filter(
        (a) =>
          a.returnDate &&
          a.returnDate.startsWith(todayKey) &&
          (professionalFilter === 'all' || a.professionalId === professionalFilter)
      ),
    [consultations, todayKey, professionalFilter],
  )

  const queueItems = todaysConsultations.map((apt) => {
    const stage = getStage(apt)
    const scheduledAt = new Date(apt.date)
    const elapsed = Math.max(
      0,
      Math.floor((now.getTime() - scheduledAt.getTime()) / 60000),
    )
    const target = STAGE_TARGET_MINUTES[stage]
    const isDelayed =
      target > 0 &&
      elapsed > target &&
      stage !== 'completed' &&
      stage !== 'cancelled' &&
      stage !== 'scheduled'

    return {
      apt,
      stage,
      elapsed,
      target,
      isDelayed,
    }
  })

  const waitingCount = queueItems.filter((q) => q.stage === 'waiting').length
  const triageCount = queueItems.filter((q) => q.stage === 'triage').length
  const consultationCount = queueItems.filter((q) => q.stage === 'consultation').length
  const completedCount = queueItems.filter((q) => q.stage === 'completed').length
  const delayedCount = queueItems.filter((q) => q.isDelayed).length

  const filteredConsultations = consultations.filter((a) => {
    const pet = pets.find((p) => p.id === a.petId)
    const client = pet ? clients.find((c) => c.id === pet.clientId) : null

    const matchesSearch =
      pet?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const stage = getStage(a)
    const matchesStatus = statusFilter === 'all' || stage === statusFilter || a.status === statusFilter
    const matchesProfessional = professionalFilter === 'all' || a.professionalId === professionalFilter

    return matchesSearch && matchesStatus && matchesProfessional
  })

  const handleWhatsApp = (pet: Pet) => {
    const client = clients.find((c) => c.id === pet.clientId)
    if (client) {
      setPendingWA({
        clientId: client.id,
        clientName: client.name,
        petName: pet.name,
        phone: client.phone,
        message: `Olá ${client.name}! Aqui é da Clínica Veterinária. Gostaríamos de falar sobre ${pet.name}. Por favor, entre em contato conosco.`,
      })
    }
  }

  const handleConfirmWA = (message: string) => {
    if (!pendingWA) return
    sendManualNotification(
      pendingWA.clientId,
      pendingWA.clientName,
      message,
      'geral_personalizado',
      pendingWA.petName,
      pendingWA.phone,
    )
    setPendingWA(null)
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'waiting':
      case 'scheduled':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'triage':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'consultation':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'waiting':
        return 'Aguardando'
      case 'triage':
        return 'Em Triagem'
      case 'consultation':
        return 'Em Consulta'
      case 'completed':
        return 'Finalizado'
      case 'scheduled':
        return 'Agendado'
      case 'in_progress':
        return 'Em Andamento'
      case 'confirmed':
        return 'Confirmado'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status
    }
  }

  const handleCheckIn = (apt: Appointment) => {
    updateAppointmentStatus(apt.id, 'in_progress', undefined, 'waiting')
    toast.success('Paciente confirmado na fila de atendimento.')
  }

  const handleStartTriage = (apt: Appointment) => {
    updateAppointmentStatus(apt.id, 'in_progress', undefined, 'triage')
    setSelectedAppointment({ ...apt, status: 'in_progress', clinicalStatus: 'triage' })
  }

  const handleStartConsultation = (apt: Appointment) => {
    updateAppointmentStatus(apt.id, 'in_progress', undefined, 'consultation')
    setSelectedAppointment({
      ...apt,
      status: 'in_progress',
      clinicalStatus: 'consultation',
    })
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta consulta?')) {
      await deleteAppointment(id)
      toast.success('Consulta excluida com sucesso.')
    }
  }

  const handleSaveAppointment = async (apt: Appointment) => {
    try {
      if (editingAppointment) {
        await updateAppointment(apt)
        toast.success('Consulta atualizada!')
        setEditingAppointment(null)
      } else {
        await addAppointment(apt)
        toast.success('Consulta agendada!')
      }
      setIsNewConsultationOpen(false)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clinica Veterinaria</h1>
          <p className="text-muted-foreground">
            Rotina assistencial com fila, triagem, consulta e prontuario.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {user && (
            <Select
              value={professionalFilter}
              onValueChange={setProfessionalFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Ver todas as consultas</SelectItem>
                <SelectItem value={user.id}>Minha Agenda</SelectItem>
                {professionals
                  .filter((p) => p.id !== user.id)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={() => {
              setEditingAppointment(null)
              setIsNewConsultationOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Nova Consulta
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Aguardando</p>
            <p className="text-2xl font-bold">{waitingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Em Triagem</p>
            <p className="text-2xl font-bold">{triageCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Em Consulta</p>
            <p className="text-2xl font-bold">{consultationCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Finalizadas Hoje</p>
            <p className="text-2xl font-bold">{completedCount}</p>
          </CardContent>
        </Card>
        <Card className={cn(delayedCount > 0 && 'border-red-200 bg-red-50/40')}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Fora do SLA</p>
            <p className="text-2xl font-bold">{delayedCount}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="workflow" className="space-y-6">
        <TabsList>
          <TabsTrigger value="workflow">Fluxo do Dia</TabsTrigger>
          <TabsTrigger value="returns">Retornos Hoje ({todaysReturns.length})</TabsTrigger>
          <TabsTrigger value="list">Todas as Consultas</TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Fila Operacional (Hoje)</CardTitle>
                    <CardDescription>
                      Sequencia recomendada: check-in, triagem, consulta e alta.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 text-xs flex-wrap">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-gray-400" /> Aguardando
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" /> Triagem
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-400" /> Consulta
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {queueItems.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                      Nenhuma consulta agendada para hoje.
                    </div>
                  )}
                  {queueItems.map(({ apt, stage, elapsed, target, isDelayed }) => {
                    const pet = getPet(apt.petId)

                    return (
                      <div
                        key={apt.id}
                        className={cn(
                          'flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4 bg-card hover:bg-muted/30 transition-colors',
                          isDelayed && 'border-red-200 bg-red-50/20',
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center justify-center w-14 h-14 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                            <span className="text-lg font-bold">
                              {format(new Date(apt.date), 'HH:mm')}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold">{pet?.name}</h3>
                              <Badge variant="outline">{pet?.species}</Badge>
                              <Badge
                                variant="secondary"
                                className={cn('text-xs', getStatusColor(stage))}
                              >
                                {getStatusLabel(stage)}
                              </Badge>
                              {stage !== 'scheduled' && stage !== 'completed' && stage !== 'cancelled' && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-xs',
                                    isDelayed
                                      ? 'border-red-300 text-red-700 bg-red-50'
                                      : 'border-amber-300 text-amber-700 bg-amber-50',
                                  )}
                                >
                                  <Timer className="h-3 w-3 mr-1" />
                                  {elapsed} min {target > 0 ? `/ SLA ${target}` : ''}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {pet?.breed} - {pet?.age} anos
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                          {pet && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleWhatsApp(pet)}
                              title="Mensagem ao tutor"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          )}

                          {stage === 'scheduled' && (
                            <Button
                              variant="outline"
                              onClick={() => handleCheckIn(apt)}
                              className="border-gray-300"
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Check-in
                            </Button>
                          )}

                          {stage === 'waiting' && (
                            <Button
                              variant="outline"
                              className="border-yellow-200 hover:bg-yellow-50 text-yellow-700"
                              onClick={() => handleStartTriage(apt)}
                            >
                              <ClipboardList className="mr-2 h-4 w-4" /> Iniciar Triagem
                            </Button>
                          )}

                          {stage === 'triage' && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => setSelectedAppointment(apt)}
                              >
                                <ClipboardList className="mr-2 h-4 w-4" /> Continuar Triagem
                              </Button>
                              <Button
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleStartConsultation(apt)}
                              >
                                <Stethoscope className="mr-2 h-4 w-4" /> Iniciar Consulta
                              </Button>
                            </div>
                          )}

                          {(stage === 'consultation' || stage === 'completed') && (
                            <Button
                              variant={stage === 'completed' ? 'secondary' : 'default'}
                              className={cn(
                                stage === 'consultation' && 'bg-blue-600 hover:bg-blue-700',
                              )}
                              onClick={() => setSelectedAppointment(apt)}
                            >
                              {stage === 'completed' ? (
                                <>
                                  <FileText className="mr-2 h-4 w-4" /> Prontuario
                                </>
                              ) : (
                                <>
                                  <Play className="mr-2 h-4 w-4" /> Continuar
                                </>
                              )}
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            title="Ver Historico"
                            onClick={() => setHistoryPet(pet || null)}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                  <CardTitle>Rotinas da Clinica</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <Button
                    variant="secondary"
                    className="w-full justify-start"
                    onClick={() => {
                      setEditingAppointment(null)
                      setIsNewConsultationOpen(true)
                    }}
                  >
                    <Stethoscope className="mr-2 h-4 w-4" /> Abrir nova consulta
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full justify-start"
                    onClick={() => {
                      const delayed = queueItems.find((q) => q.isDelayed)
                      if (!delayed) {
                        toast.info('Nao ha pacientes fora do SLA no momento.')
                        return
                      }
                      setSelectedAppointment(delayed.apt)
                    }}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" /> Priorizar atraso
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full justify-start"
                    onClick={() => toast.info('Use o prontuario para registrar vacinas e documentos.')}
                  >
                    <Syringe className="mr-2 h-4 w-4" /> Registrar vacina
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pacientes Recentes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pets.slice(0, 5).map((pet) => (
                    <div
                      key={pet.id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-muted p-2 rounded-md transition-colors group"
                      onClick={() => setHistoryPet(pet)}
                    >
                      <Avatar>
                        <AvatarImage src={pet.avatar} />
                        <AvatarFallback>{pet.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">{pet.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{pet.breed}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-green-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleWhatsApp(pet)
                        }}
                      >
                        <MessageCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="returns" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <CardTitle className="text-amber-600 flex items-center gap-2 flex-wrap">
                    <CalendarDays className="h-5 w-5" /> Retornos Programados para Hoje
                  </CardTitle>
                  <CardDescription>
                    Pacientes com retorno agendado na finalização de consultas anteriores.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {todaysReturns.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border rounded-lg bg-muted/20">
                  Nenhum retorno agendado para hoje.
                </div>
              ) : (
                <div className="grid gap-3">
                  {todaysReturns.map((apt) => {
                    const pet = getPet(apt.petId)
                    return (
                      <div
                        key={apt.id}
                        className="flex flex-col sm:flex-row justify-between p-4 border border-amber-200 bg-amber-50 rounded-lg gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={pet?.avatar} />
                            <AvatarFallback>{pet?.name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold">{pet?.name}</p>
                            <p className="text-sm text-muted-foreground">{pet?.breed}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {pet && (
                            <Button
                              variant="outline"
                              className="border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
                              onClick={() => handleWhatsApp(pet)}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" /> Agendar Horário
                            </Button>
                          )}
                          <Button 
                            onClick={() => {
                              // Se clicar em iniciar, abrimos o agendamento rapido?
                              setEditingAppointment(null)
                              setIsNewConsultationOpen(true)
                            }}
                          >
                            Nova Consulta
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <CardTitle>Historico e Agenda de Consultas</CardTitle>
                  <CardDescription>
                    Visualize e gerencie todas as consultas.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por pet ou cliente..."
                      className="pl-9 w-[200px] lg:w-[300px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[170px]">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <SelectValue placeholder="Status" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="scheduled">Agendado</SelectItem>
                      <SelectItem value="waiting">Aguardando</SelectItem>
                      <SelectItem value="triage">Triagem</SelectItem>
                      <SelectItem value="consultation">Consulta</SelectItem>
                      <SelectItem value="completed">Concluido</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data / Hora</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Tutor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConsultations.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Nenhuma consulta encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredConsultations.map((apt) => {
                    const pet = getPet(apt.petId)
                    const client = getClient(apt.petId)
                    const stage = getStage(apt)

                    return (
                      <TableRow key={apt.id}>
                        <TableCell>
                          <div className="font-medium">
                            {format(new Date(apt.date), 'dd/MM/yyyy')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(apt.date), 'HH:mm')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={pet?.avatar} />
                              <AvatarFallback>{pet?.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <span>{pet?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{client?.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn(getStatusColor(stage))}
                          >
                            {getStatusLabel(stage)}
                          </Badge>
                        </TableCell>
                        <TableCell>R$ {apt.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Atender"
                                onClick={() => setSelectedAppointment(apt)}
                              >
                                <Stethoscope className="h-4 w-4 text-blue-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Editar"
                              onClick={() => {
                                setEditingAppointment(apt)
                                setIsNewConsultationOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(apt.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedAppointment && getPet(selectedAppointment.petId) && (
        <ConsultationModal
          open={!!selectedAppointment}
          onOpenChange={(open) => !open && setSelectedAppointment(null)}
          appointment={selectedAppointment}
          pet={getPet(selectedAppointment.petId)!}
          onShowHistory={() => {
            const pet = getPet(selectedAppointment.petId)
            if (pet) {
              setHistoryPet(pet)
            }
          }}
        />
      )}

      <PatientHistorySheet
        open={!!historyPet}
        onOpenChange={(open) => !open && setHistoryPet(null)}
        pet={historyPet}
      />

      <UnifiedAtendimentoDialog
        open={isNewConsultationOpen}
        onOpenChange={(open) => {
          setIsNewConsultationOpen(open)
          if (!open) setEditingAppointment(null)
        }}
        onSave={() => {
          setIsNewConsultationOpen(false)
          setEditingAppointment(null)
        }}
        appointment={editingAppointment || { serviceType: 'consultation' }}
      />

      <WhatsAppConfirmDialog
        open={!!pendingWA}
        onOpenChange={(open) => { if (!open) setPendingWA(null) }}
        clientName={pendingWA?.clientName ?? ''}
        petName={pendingWA?.petName}
        defaultMessage={pendingWA?.message ?? ''}
        onConfirm={handleConfirmWA}
      />
    </div>
  )
}
