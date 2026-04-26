import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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

  const filteredPets = useMemo(() => {
    if (!searchTerm) return []
    const term = searchTerm.toLowerCase()
    return pets.filter(p => 
      p.name.toLowerCase().includes(term) || 
      clients.find(c => c.id === p.clientId)?.name.toLowerCase().includes(term)
    ).slice(0, 10)
  }, [pets, clients, searchTerm])

  const handleAdmit = async () => {
    if (!selectedPetId || !reason) return
    await admitPet({
      petId: selectedPetId,
      reasonForAdmission: reason,
      kennelNumber: kennel || 'TBD'
    })
    onOpenChange(false)
    // Reset form
    setSelectedPetId('')
    setSearchTerm('')
    setReason('')
    setKennel('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Admitir Paciente na Internação</DialogTitle>
          <DialogDescription>Preencha os dados para iniciar a internação do paciente.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Buscar Pet ou Tutor</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nome do pet ou tutor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            {filteredPets.length > 0 && !selectedPetId && (
              <div className="border rounded-md mt-1 divide-y shadow-sm bg-white">
                {filteredPets.map(pet => (
                  <button
                    key={pet.id}
                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex justify-between items-center"
                    onClick={() => {
                      setSelectedPetId(pet.id)
                      setSearchTerm(pet.name)
                    }}
                  >
                    <span><strong>{pet.name}</strong> ({pet.breed})</span>
                    <span className="text-xs text-muted-foreground">
                      Tutor: {clients.find(c => c.id === pet.clientId)?.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {selectedPetId && (
               <div className="bg-blue-50 border border-blue-100 p-2 rounded-md flex justify-between items-center group">
                  <span className="text-sm text-blue-700 font-medium">Pet Selecionado: {searchTerm}</span>
                  <button onClick={() => setSelectedPetId('')} className="text-xs text-blue-500 hover:underline">Trocar</button>
               </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Motivo da Internação</Label>
            <Input 
              placeholder="Ex: Parvovirose, Pós-operatório..." 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Leito / Identificação</Label>
            <Input 
              placeholder="Ex: UTI-01, Canil-A..." 
              value={kennel}
              onChange={(e) => setKennel(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleAdmit}
            disabled={!selectedPetId || !reason}
          >
            Confirmar Admissão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
