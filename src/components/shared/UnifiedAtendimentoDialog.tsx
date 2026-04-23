"use client"

import * as React from 'react'
import { 
  X, 
  Stethoscope, 
  Hotel, 
  Hospital, 
  Scissors, 
  Syringe,
  Plus,
  ChevronDown,
  Info,
  Calendar,
  Clock,
  User as UserIcon,
  CheckCircle2,
  Timer
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { Appointment, ServiceType, Pet, Client } from '@/lib/types'
import { usePetStore } from '@/stores/PetContext'
import { useClientStore } from '@/stores/ClientContext'
import { useAppointmentStore } from '@/stores/AppointmentStore'
import { useProfessionals } from '@/hooks/useProfessionals'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Sub-components
import { ClinicFields } from '../atendimento/ClinicFields'
import { GroomingFields } from '../atendimento/GroomingFields'
import { BoardingFields } from '../atendimento/BoardingFields'
import { HospitalizationFields } from '../atendimento/HospitalizationFields'
import { VaccinationFields } from '../atendimento/VaccinationFields'

interface UnifiedAtendimentoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment?: Partial<Appointment>
  onSave?: (appointment: Appointment) => void
  readOnly?: boolean
}

const SERVICE_CONFIGS: Record<ServiceType, { label: string; icon: any; color: string; dot: string; defaultStatus: string }> = {
  consultation: { label: 'Consulta Médica', icon: Stethoscope, color: 'text-blue-600 bg-blue-50', dot: 'bg-blue-400', defaultStatus: 'Agendado' },
  boarding: { label: 'Hospedagem', icon: Hotel, color: 'text-orange-600 bg-orange-50', dot: 'bg-orange-400', defaultStatus: 'Reservado' },
  hospitalization: { label: 'Internação', icon: Hospital, color: 'text-rose-600 bg-rose-50', dot: 'bg-rose-400', defaultStatus: 'Admitido' },
  grooming: { label: 'Banho e Tosa', icon: Scissors, color: 'text-cyan-600 bg-cyan-50', dot: 'bg-cyan-400', defaultStatus: 'Agendado' },
  vaccination: { label: 'Vacinação', icon: Syringe, color: 'text-emerald-600 bg-emerald-50', dot: 'bg-emerald-400', defaultStatus: 'Agendado' },
}

export function UnifiedAtendimentoDialog({ 
  open, 
  onOpenChange, 
  appointment, 
  onSave,
  readOnly
}: UnifiedAtendimentoDialogProps) {
  const { pets } = usePetStore()
  const { clients } = useClientStore()
  const { professionals } = useProfessionals()
  const { addAppointment, updateAppointment } = useAppointmentStore()

  const [formData, setFormData] = React.useState<Partial<Appointment>>({
    serviceType: 'consultation',
    date: new Date().toLocaleString('sv').replace(' ', 'T'),
    status: 'scheduled',
    price: 0,
    ...appointment
  })

  // Sync state when dialog opens or appointment changes
  React.useEffect(() => {
    if (open) {
      setFormData({
        serviceType: 'consultation',
        date: new Date().toLocaleString('sv').replace(' ', 'T'),
        status: 'scheduled',
        price: 0,
        ...appointment
      })
      
      if (appointment?.petId) {
        const pet = pets.find(p => p.id === appointment.petId)
        if (pet) setSelectedTutorId(pet.clientId)
      } else {
        setSelectedTutorId('')
      }
    }
  }, [open, appointment, pets])

  const [selectedTutorId, setSelectedTutorId] = React.useState<string>(() => {
    if (formData.petId) {
      const pet = pets.find(p => p.id === formData.petId)
      return pet?.clientId || ''
    }
    return ''
  })

  const [isDetailsOpen, setIsDetailsOpen] = React.useState(true)
  const [isNotesOpen, setIsNotesOpen] = React.useState(false)
  const [isActionsOpen, setIsActionsOpen] = React.useState(false)

  const selectedPet = React.useMemo(() => pets.find(p => p.id === formData.petId), [pets, formData.petId])
  const selectedTutor = React.useMemo(() => clients.find(c => c.id === selectedTutorId), [clients, selectedTutorId])
  const config = SERVICE_CONFIGS[formData.serviceType || 'consultation']

  const handleUpdate = (patch: Partial<Appointment>) => {
    if (readOnly) return
    setFormData(prev => ({ ...prev, ...patch }))
  }

  const handleSave = async () => {
    if (readOnly) return

    if (!formData.petId) {
      toast.error('Por favor, selecione um Pet.')
      return
    }

    if (!formData.date) {
      toast.error('Por favor, defina a data e hora.')
      return
    }
    
    const finalData = {
      ...formData,
    } as Appointment

    try {
      if (formData.id) {
        await updateAppointment(finalData)
      } else {
        await addAppointment(finalData)
      }

      if (onSave) onSave(finalData)
      onOpenChange(false)
    } catch (err) {
      console.error('Save failed:', err)
      toast.error('Erro ao salvar o atendimento.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1220px] h-[95vh] p-0 flex flex-col overflow-hidden bg-white rounded-3xl border-none shadow-2xl">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 -z-10" />
        
        {/* Header */}
        <header className="bg-white border-b border-slate-100 px-6 py-5 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-sm", config.color)}>
                <config.icon className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight">
                  {formData.id ? 'Editar Atendimento' : 'Novo Atendimento'}
                </DialogTitle>
                <DialogDescription className="text-slate-500">
                  Gestão unificada de serviços e prontuários
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tipo</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-semibold text-sm">{config.label}</span>
                <span className={cn("w-2 h-2 rounded-full", config.dot)}></span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {formData.status === 'scheduled' && 'Agendado'}
                  {formData.status === 'confirmed' && 'Confirmado'}
                  {formData.status === 'in_progress' && 'Em Atendimento'}
                  {formData.status === 'completed' && 'Finalizado'}
                  {formData.status === 'cancelled' && 'Cancelado'}
                  {formData.status === 'checked_in' && 'Hospedado'}
                  {formData.status === 'checked_out' && 'Encerrado'}
                </span>
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  formData.status === 'completed' ? 'bg-emerald-400' :
                  formData.status === 'cancelled' ? 'bg-rose-400' :
                  formData.status === 'in_progress' ? 'bg-blue-400' :
                  'bg-slate-300'
                )}></span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tutor / Pet</div>
              <div className="mt-1 font-semibold text-sm truncate">
                {selectedPet ? `${selectedTutor?.name || 'Tutor'} / ${selectedPet.name}` : 'Não selecionado'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {selectedPet ? `${selectedPet.species} • ${selectedPet.breed}` : 'Selecione o pet abaixo'}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Agendamento</div>
              <div className="mt-1 font-semibold text-sm">
                {formData.date ? format(parseISO(formData.date), "dd 'de' MMMM", { locale: ptBR }) : '—'}
              </div>
              <div className="text-[11px] text-slate-400">
                {formData.date ? format(parseISO(formData.date), "HH:mm") : 'Defina data/hora'}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Cadastro Inicial */}
          <section className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
              <div className="text-sm font-semibold text-slate-900">Cadastro Inicial</div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Tipo de Atendimento</Label>
                  <Select 
                    value={formData.serviceType} 
                    onValueChange={(v) => handleUpdate({ serviceType: v as ServiceType })}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="h-11 rounded-2xl border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">Consulta Médica</SelectItem>
                      <SelectItem value="grooming">Banho e Tosa</SelectItem>
                      <SelectItem value="boarding">Hospedagem</SelectItem>
                      <SelectItem value="hospitalization">Internação</SelectItem>
                      <SelectItem value="vaccination">Vacinação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="lg:col-span-4">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Tutor</Label>
                  <Select value={selectedTutorId} onValueChange={setSelectedTutorId} disabled={readOnly}>
                    <SelectTrigger className="h-11 rounded-2xl border-slate-300">
                      <SelectValue placeholder="Selecione o tutor" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="lg:col-span-5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Pet</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={formData.petId} 
                      onValueChange={(v) => handleUpdate({ petId: v })}
                      disabled={!selectedTutorId || readOnly}
                    >
                      <SelectTrigger className="h-11 rounded-2xl border-slate-300 flex-1">
                        <SelectValue placeholder={selectedTutorId ? "Selecione o pet" : "Selecione o tutor primeiro"} />
                      </SelectTrigger>
                      <SelectContent>
                        {pets.filter(p => p.clientId === selectedTutorId).map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" className="h-11 w-11 rounded-2xl text-blue-600">+</Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                <div className="lg:col-span-4">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Responsável</Label>
                  <Select 
                    value={formData.professionalId} 
                    onValueChange={(v) => handleUpdate({ professionalId: v })}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="h-11 rounded-2xl border-slate-300">
                      <SelectValue placeholder="Selecione o responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      {professionals.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="lg:col-span-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(v) => handleUpdate({ status: v as any })}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="h-11 rounded-2xl border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled" disabled={appointment?.id && formData.status !== 'scheduled'}>Agendado</SelectItem>
                      <SelectItem 
                        value="confirmed" 
                        disabled={appointment?.id && appointment.status !== 'scheduled' && appointment.status !== 'confirmed'}
                      >
                        Confirmado
                      </SelectItem>
                      <SelectItem 
                        value="in_progress" 
                        disabled={appointment?.id && appointment.status !== 'in_progress'}
                      >
                        Em Atendimento
                      </SelectItem>
                      <SelectItem 
                        value="completed" 
                        disabled={appointment?.id && appointment.status !== 'completed'}
                      >
                        Finalizado
                      </SelectItem>
                      <SelectItem 
                        value="cancelled" 
                        disabled={appointment?.id && !['scheduled', 'confirmed', 'cancelled'].includes(appointment.status)}
                      >
                        Cancelado
                      </SelectItem>
                      {formData.serviceType === 'boarding' && (
                        <>
                          <SelectItem value="checked_in" disabled={appointment?.id && appointment.status !== 'checked_in'}>Hospedado (Check-in)</SelectItem>
                          <SelectItem value="checked_out" disabled={appointment?.id && appointment.status !== 'checked_out'}>Encerrado (Check-out)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="lg:col-span-5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Data e Hora</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="date" 
                      className="h-11 rounded-2xl border-slate-300" 
                      value={formData.date?.split('T')[0]}
                      disabled={readOnly}
                      onChange={(e) => {
                        const time = formData.date?.split('T')[1] || '09:00:00'
                        handleUpdate({ date: `${e.target.value}T${time}` })
                      }}
                    />
                    <Input 
                      type="time" 
                      className="h-11 rounded-2xl border-slate-300 w-32" 
                      value={formData.date?.split('T')[1]?.substring(0, 5)}
                      disabled={readOnly}
                      onChange={(e) => {
                        const date = formData.date?.split('T')[0] || format(new Date(), 'yyyy-MM-dd')
                        handleUpdate({ date: `${date}T${e.target.value}:00` })
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Detalhes Específicos */}
          <section className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <button 
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              className="w-full px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between hover:bg-slate-100/50 transition-colors"
            >
              <div>
                <div className="text-sm font-semibold text-slate-900">Detalhes do Atendimento</div>
                <div className="text-xs text-slate-500">Campos específicos para {config.label}</div>
              </div>
              <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", isDetailsOpen && "rotate-180")} />
            </button>
            {isDetailsOpen && (
              <div className="p-6">
                {formData.serviceType === 'consultation' && <ClinicFields formData={formData} onChange={handleUpdate} readOnly={readOnly} />}
                {formData.serviceType === 'grooming' && <GroomingFields formData={formData} onChange={handleUpdate} readOnly={readOnly} />}
                {formData.serviceType === 'boarding' && <BoardingFields formData={formData} onChange={handleUpdate} readOnly={readOnly} />}
                {formData.serviceType === 'hospitalization' && <HospitalizationFields formData={formData} onChange={handleUpdate} readOnly={readOnly} />}
                {formData.serviceType === 'vaccination' && <VaccinationFields formData={formData} onChange={handleUpdate} readOnly={readOnly} />}
              </div>
            )}
          </section>

          {/* Observações */}
          <section className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <button 
              onClick={() => setIsNotesOpen(!isNotesOpen)}
              className="w-full px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between hover:bg-slate-100/50 transition-colors"
            >
              <div className="text-sm font-semibold text-slate-900">Observações e Notas Internas</div>
              <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", isNotesOpen && "rotate-180")} />
            </button>
            {isNotesOpen && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Observações internas</Label>
                  <Textarea 
                    className="rounded-2xl min-h-[100px]" 
                    placeholder="Notas visíveis apenas para a equipe..."
                    value={formData.notes || ''}
                    disabled={readOnly}
                    onChange={(e) => handleUpdate({ notes: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Instruções para tutor</Label>
                  <Textarea 
                    className="rounded-2xl min-h-[100px]" 
                    placeholder="Orientações que serão enviadas ao tutor..."
                    disabled={readOnly}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Ações e Confirmações */}
          <section className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <button 
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              className="w-full px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between hover:bg-slate-100/50 transition-colors"
            >
              <div className="text-sm font-semibold text-slate-900">Ações Finais e Automações</div>
              <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", isActionsOpen && "rotate-180")} />
            </button>
            {isActionsOpen && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className={cn("flex items-center gap-3 rounded-2xl border border-slate-200 px-4 h-12 bg-slate-50", !readOnly && "cursor-pointer")}>
                    <Checkbox defaultChecked disabled={readOnly} />
                    <span className="text-sm font-medium">Confirmar via WhatsApp</span>
                  </label>
                  <label className={cn("flex items-center gap-3 rounded-2xl border border-slate-200 px-4 h-12 bg-slate-50", !readOnly && "cursor-pointer")}>
                    <Checkbox defaultChecked disabled={readOnly} />
                    <span className="text-sm font-medium">Gerar cobrança antecipada</span>
                  </label>
                  <label className={cn("flex items-center gap-3 rounded-2xl border border-slate-200 px-4 h-12 bg-slate-50", !readOnly && "cursor-pointer")}>
                    <Checkbox disabled={readOnly} />
                    <span className="text-sm font-medium">Bloquear horário na agenda</span>
                  </label>
                </div>
              </div>
            )}
          </section>
        </main>

        {/* Footer */}
        <footer className="shrink-0 border-t border-slate-100 bg-white px-6 py-4 flex items-center justify-between gap-4">
          <Button variant="ghost" className="h-11 px-5 rounded-2xl text-slate-500" onClick={() => onOpenChange(false)}>
            {readOnly ? 'Fechar' : 'Cancelar'}
          </Button>
          {!readOnly && (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="ghost" className="h-11 px-5 rounded-2xl text-blue-700 hover:bg-blue-50">
                Salvar como Rascunho
              </Button>
              <Button 
                className="h-11 px-8 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
                onClick={handleSave}
              >
                Gravar
              </Button>
            </div>
          )}
        </footer>
      </DialogContent>
    </Dialog>
  )
}
