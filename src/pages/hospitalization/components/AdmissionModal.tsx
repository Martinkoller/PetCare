import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { usePetStore } from '@/stores/PetContext'
import { useClientStore } from '@/stores/ClientContext'
import { useHospitalizationStore } from '@/stores/HospitalizationContext'
import { Search } from 'lucide-react'
import { HospitalizationOrigin, HospitalizationStatus } from '@/lib/types'

interface AdmissionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdmissionModal({ open, onOpenChange }: AdmissionModalProps) {
  const { pets } = usePetStore()
  const { clients } = useClientStore()
  const { admitPet } = useHospitalizationStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPetId, setSelectedPetId] = useState('')
  const [reason, setReason] = useState('')
  const [kennel, setKennel] = useState('')

  const [origin, setOrigin] = useState<HospitalizationOrigin>('walk_in')
  const [attendingVetName, setAttendingVetName] = useState('')
  const [weightAtAdmission, setWeightAtAdmission] = useState('')
  const [triageLevel, setTriageLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [presumptiveDiagnosis, setPresumptiveDiagnosis] = useState('')
  const [initialNotes, setInitialNotes] = useState('')
  const [initialStatus, setInitialStatus] = useState<HospitalizationStatus>('admitted')
  const [errorMessage, setErrorMessage] = useState('')

  const filteredPets = useMemo(() => {
    if (!searchTerm) return []
    const term = searchTerm.toLowerCase()

    return pets
      .filter((p) => {
        const tutorName = clients.find((c) => c.id === p.clientId)?.name?.toLowerCase() || ''
        return (
          p.name.toLowerCase().includes(term) ||
          tutorName.includes(term)
        )
      })
      .slice(0, 10)
  }, [pets, clients, searchTerm])

  const resetForm = () => {
    setSelectedPetId('')
    setSearchTerm('')
    setReason('')
    setKennel('')
    setOrigin('walk_in')
    setAttendingVetName('')
    setWeightAtAdmission('')
    setTriageLevel('medium')
    setPresumptiveDiagnosis('')
    setInitialNotes('')
    setInitialStatus('admitted')
    setErrorMessage('')
  }

  const handleAdmit = async () => {
    try {
      setErrorMessage('')

      if (!selectedPetId || !reason.trim() || !kennel.trim()) return

      await admitPet({
        petId: selectedPetId,
        reasonForAdmission: reason.trim(),
        kennelNumber: kennel.trim(),
        origin,
        attendingVetName: attendingVetName.trim() || undefined,
        weightAtAdmission: weightAtAdmission ? Number(weightAtAdmission) : undefined,
        triageLevel,
        presumptiveDiagnosis: presumptiveDiagnosis.trim() || undefined,
        initialNotes: initialNotes.trim() || undefined,
        admittedAt: new Date().toISOString(),
        status: initialStatus,
      })

      onOpenChange(false)
      resetForm()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao admitir paciente.')
    }
  }

  const selectedPet = pets.find((p) => p.id === selectedPetId)
  const selectedTutor = clients.find((c) => c.id === selectedPet?.clientId)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) resetForm()
      }}
    >
      <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Admitir Paciente na Internação</DialogTitle>
          <DialogDescription>
            Preencha os dados para iniciar a internação do paciente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="space-y-2">
            <Label>Buscar Pet ou Tutor</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nome do pet ou tutor..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  if (selectedPetId) setSelectedPetId('')
                }}
                className="pl-8"
              />
            </div>

            {filteredPets.length > 0 && !selectedPetId && (
              <div className="border rounded-md mt-1 divide-y shadow-sm bg-white">
                {filteredPets.map((pet) => (
                  <button
                    key={pet.id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex justify-between items-center"
                    onClick={() => {
                      setSelectedPetId(pet.id)
                      setSearchTerm(pet.name)
                    }}
                  >
                    <span>
                      <strong>{pet.name}</strong> ({pet.breed || 'Sem raça'})
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Tutor: {clients.find((c) => c.id === pet.clientId)?.name || 'Não informado'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {selectedPetId && (
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-md flex justify-between items-center gap-3">
                <div>
                  <div className="text-sm text-blue-700 font-medium">
                    Pet Selecionado: {selectedPet?.name}
                  </div>
                  <div className="text-xs text-blue-600">
                    Tutor: {selectedTutor?.name || 'Não informado'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPetId('')
                    setSearchTerm('')
                  }}
                  className="text-xs text-blue-500 hover:underline"
                >
                  Trocar
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Motivo da Internação *</Label>
              <Input
                placeholder="Ex: Parvovirose, pós-operatório..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Leito / Identificação *</Label>
              <Input
                placeholder="Ex: UTI-01, Canil-A..."
                value={kennel}
                onChange={(e) => setKennel(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Origem</Label>
              <Select value={origin} onValueChange={(v: HospitalizationOrigin) => setOrigin(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk_in">Demanda espontânea</SelectItem>
                  <SelectItem value="appointment">Agenda</SelectItem>
                  <SelectItem value="emergency">Emergência</SelectItem>
                  <SelectItem value="post_surgery">Pós-cirúrgico</SelectItem>
                  <SelectItem value="return">Retorno</SelectItem>
                  <SelectItem value="referral">Encaminhamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status Inicial</Label>
              <Select value={initialStatus} onValueChange={(v: HospitalizationStatus) => setInitialStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admitted">Admitido</SelectItem>
                  <SelectItem value="under_observation">Em observação</SelectItem>
                  <SelectItem value="treatment">Em tratamento</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Veterinário Responsável</Label>
              <Input
                placeholder="Ex: Dr. Marcelo"
                value={attendingVetName}
                onChange={(e) => setAttendingVetName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Peso de Entrada (kg)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 4.25"
                value={weightAtAdmission}
                onChange={(e) => setWeightAtAdmission(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Prioridade / Gravidade</Label>
              <Select
                value={triageLevel}
                onValueChange={(v: 'low' | 'medium' | 'high' | 'critical') => setTriageLevel(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Diagnóstico Presumido</Label>
            <Input
              placeholder="Ex: Gastroenterite aguda, intoxicação, pós-operatório..."
              value={presumptiveDiagnosis}
              onChange={(e) => setPresumptiveDiagnosis(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Observações Iniciais</Label>
            <Textarea
              className="min-h-[100px]"
              placeholder="Ex: paciente prostrado, tutor relata vômitos desde ontem, sem alimentação..."
              value={initialNotes}
              onChange={(e) => setInitialNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="bg-muted/10 -mx-6 -mb-6 p-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleAdmit}
            disabled={!selectedPetId || !reason.trim() || !kennel.trim()}
          >
            Confirmar Admissão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}