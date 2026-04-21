import { useState, useEffect } from 'react'
import { Appointment, GroomingStage, Pet } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { usePetStore } from '@/stores/PetContext'
import { useClientStore } from '@/stores/ClientContext'
import { useProfessionals } from '@/hooks/useProfessionals'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  formData: Partial<Appointment>
  onChange: (patch: Partial<Appointment>) => void
  pets: Pet[]
  stages: GroomingStage[]
  readOnly: boolean
  isNew: boolean
  onRequestFinalStage: (stageId: string) => void
}

interface NewPetDraft {
  name: string
  species: string
  breed: string
  clientId: string
}

const EMPTY_PET_DRAFT: NewPetDraft = {
  name: '',
  species: 'dog',
  breed: '',
  clientId: '',
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AtendimentoInfoSection({
  formData,
  onChange,
  pets,
  stages,
  readOnly,
  isNew,
  onRequestFinalStage,
}: Props) {
  const { addPet } = usePetStore()
  const { clients } = useClientStore()
  const { professionals } = useProfessionals()

  const [selectedClientId, setSelectedClientId] = useState('')
  const [localDate, setLocalDate] = useState('')
  const [localTime, setLocalTime] = useState('')
  const [showNewPet, setShowNewPet] = useState(false)
  const [petDraft, setPetDraft] = useState<NewPetDraft>(EMPTY_PET_DRAFT)

  // Initialize client + date/time from formData when editing
  useEffect(() => {
    if (formData.date) {
      const d = new Date(formData.date)
      setLocalDate(format(d, 'yyyy-MM-dd'))
      setLocalTime(format(d, 'HH:mm'))
    } else {
      const now = new Date()
      setLocalDate(format(now, 'yyyy-MM-dd'))
      setLocalTime(format(now, 'HH:mm'))
    }

    if (formData.petId) {
      const pet = pets.find((p) => p.id === formData.petId)
      if (pet) setSelectedClientId(pet.clientId)
    }
  }, [formData.petId, formData.date, pets])

  const filteredPets = selectedClientId
    ? pets.filter((p) => p.clientId === selectedClientId)
    : pets

  const handleDateTimeChange = (newDate: string, newTime: string) => {
    if (newDate && newTime) {
      onChange({ date: new Date(`${newDate}T${newTime}`).toISOString() })
    }
  }

  const handleDateChange = (val: string) => {
    setLocalDate(val)
    handleDateTimeChange(val, localTime)
  }

  const handleTimeChange = (val: string) => {
    setLocalTime(val)
    handleDateTimeChange(localDate, val)
  }

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId)
    onChange({ petId: '' })
  }

  const handleStageChange = (stageId: string) => {
    const stage = stages.find((s) => s.id === stageId)
    if (stage?.isFinal) {
      onRequestFinalStage(stageId)
    } else {
      onChange({ groomingStatus: stageId })
    }
  }

  const handleCreatePet = async () => {
    if (!petDraft.name || !petDraft.clientId || !petDraft.breed) {
      return toast.error('Preencha os dados do pet')
    }
    try {
      await addPet({
        id: '',
        clientId: petDraft.clientId,
        name: petDraft.name,
        species: petDraft.species as Pet['species'],
        breed: petDraft.breed,
        age: 0,
        weight: 0,
        gender: 'male',
        medicalHistory: [],
      })
      setShowNewPet(false)
      setPetDraft(EMPTY_PET_DRAFT)
      toast.success('Pet cadastrado! Selecione-o na lista.')
    } catch {
      toast.error('Erro ao cadastrar pet')
    }
  }

  return (
    <div className="space-y-4">

      {/* ── Cliente ── */}
      {isNew && !readOnly && (
        <div className="grid gap-2">
          <Label>Cliente</Label>
          <Select
            value={selectedClientId}
            onValueChange={handleClientChange}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o cliente..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ── Pet selection ── */}
      {!showNewPet ? (
        <div className="grid gap-2">
          <div className="flex justify-between items-center">
            <Label>Pet</Label>
            {isNew && !readOnly && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => setShowNewPet(true)}
              >
                <UserPlus className="mr-1 h-3 w-3" /> Cadastrar Novo Pet
              </Button>
            )}
          </div>
          <Select
            value={formData.petId}
            onValueChange={(val) => onChange({ petId: val })}
            disabled={!isNew || readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um pet..." />
            </SelectTrigger>
            <SelectContent>
              {filteredPets.map((pet) => (
                <SelectItem key={pet.id} value={pet.id}>
                  {pet.name} ({pet.breed})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-sm">Novo Pet</h4>
            <Button variant="ghost" size="sm" onClick={() => setShowNewPet(false)}>
              Cancelar
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Nome do Pet"
              value={petDraft.name}
              onChange={(e) => setPetDraft({ ...petDraft, name: e.target.value })}
            />
            <Select
              value={petDraft.species}
              onValueChange={(val) => setPetDraft({ ...petDraft, species: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dog">Cachorro</SelectItem>
                <SelectItem value="cat">Gato</SelectItem>
                <SelectItem value="bird">Pássaro</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Raça"
              value={petDraft.breed}
              onChange={(e) => setPetDraft({ ...petDraft, breed: e.target.value })}
            />
            <Select
              value={petDraft.clientId}
              onValueChange={(val) => setPetDraft({ ...petDraft, clientId: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tutor..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" className="w-full" variant="secondary" onClick={handleCreatePet}>
            Salvar e Selecionar Pet
          </Button>
        </div>
      )}

      {/* ── Data + Hora ── */}
      {!readOnly && (
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Data</Label>
            <Input
              type="date"
              value={localDate}
              onChange={(e) => handleDateChange(e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div className="grid gap-2">
            <Label>Hora</Label>
            <Input
              type="time"
              value={localTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              disabled={readOnly}
            />
          </div>
        </div>
      )}

      {/* ── Profissional ── */}
      {professionals.length > 0 && (
        <div className="grid gap-2">
          <Label>Profissional</Label>
          <Select
            value={formData.professionalId || 'unassigned'}
            onValueChange={(val) =>
              onChange({ professionalId: val === 'unassigned' ? undefined : val })
            }
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Sem preferência</SelectItem>
              {professionals.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* ── Priority + Type ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Prioridade</Label>
          <Select
            value={formData.priority || 'normal'}
            onValueChange={(val: Appointment['priority']) => onChange({ priority: val })}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="preferential">Preferencial</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Tipo</Label>
          <Select
            value={formData.appointmentType || 'scheduled'}
            onValueChange={(val: Appointment['appointmentType']) =>
              onChange({ appointmentType: val })
            }
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Agendado</SelectItem>
              <SelectItem value="walkin">Encaixe</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Stage + Status ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Etapa Atual</Label>
          <Select
            value={formData.groomingStatus}
            onValueChange={handleStageChange}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Status Geral</Label>
          <Select
            value={formData.status}
            onValueChange={(val: Appointment['status']) => onChange({ status: val })}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Agendado</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Observations ── */}
      <div className="grid gap-2">
        <Label>Observações</Label>
        <Textarea
          value={formData.notes || ''}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Observações adicionais..."
          disabled={readOnly}
        />
      </div>

    </div>
  )
}
