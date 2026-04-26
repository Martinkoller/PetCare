import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useHospitalizationStore } from '@/stores/HospitalizationContext'
import { Activity, HeartPulse, Brain, Droplets } from 'lucide-react'
import { HospitalizationStay } from '@/lib/types'

interface EvolutionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stay: HospitalizationStay
}

export function EvolutionModal({ open, onOpenChange, stay }: EvolutionModalProps) {
  const { addLog } = useHospitalizationStore()
  
  const [vitals, setVitals] = useState({
    heartRate: '',
    respiratoryRate: '',
    temperature: '',
    mucousMembranes: 'Normocoradas',
    capillaryRefillTime: '< 2s',
    hydrationLevel: 'Hidratado (< 5%)',
    consciousness: 'Alerta/Ativo'
  })
  const [notes, setNotes] = useState('')

  const handleSave = async () => {
    await addLog(stay.id, {
      petId: stay.petId,
      vitals,
      notes
    })
    onOpenChange(false)
    setNotes('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Evolução Clínica: {stay.pet?.name}
          </DialogTitle>
          <DialogDescription>Registre e visualize as evoluções clínicas da internação.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-red-600">
                <HeartPulse className="h-4 w-4" /> Parâmetros Vitais
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">FC (bpm)</Label>
                  <Input 
                    type="number" 
                    value={vitals.heartRate} 
                    onChange={e => setVitals({...vitals, heartRate: e.target.value})} 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">FR (mpm)</Label>
                  <Input 
                    type="number" 
                    value={vitals.respiratoryRate} 
                    onChange={e => setVitals({...vitals, respiratoryRate: e.target.value})} 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Temperatura (°C)</Label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    value={vitals.temperature} 
                    onChange={e => setVitals({...vitals, temperature: e.target.value})} 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">TPC</Label>
                  <Select value={vitals.capillaryRefillTime} onValueChange={v => setVitals({...vitals, capillaryRefillTime: v})}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="< 2s">{'< 2s'}</SelectItem>
                      <SelectItem value="2-3s">2-3s</SelectItem>
                      <SelectItem value="> 3s">{'> 3s'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-blue-600">
                <Droplets className="h-4 w-4" /> Avaliação Clínica
              </h3>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Mucosas</Label>
                  <Select value={vitals.mucousMembranes} onValueChange={v => setVitals({...vitals, mucousMembranes: v})}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normocoradas">Normocoradas</SelectItem>
                      <SelectItem value="Pálidas">Pálidas</SelectItem>
                      <SelectItem value="Congestas">Congestas</SelectItem>
                      <SelectItem value="Ictéricas">Ictéricas</SelectItem>
                      <SelectItem value="Cianóticas">Cianóticas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Hidratação</Label>
                  <Select value={vitals.hydrationLevel} onValueChange={v => setVitals({...vitals, hydrationLevel: v})}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hidratado (< 5%)">Hidratado (&lt; 5%)</SelectItem>
                      <SelectItem value="Leve (5-7%)">Leve (5-7%)</SelectItem>
                      <SelectItem value="Moderada (8-9%)">Moderada (8-9%)</SelectItem>
                      <SelectItem value="Grave (> 10%)">Grave (&gt; 10%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Brain className="h-3 w-3" /> Consciência
                  </Label>
                  <Select value={vitals.consciousness} onValueChange={v => setVitals({...vitals, consciousness: v})}>
                    <SelectTrigger className="h-9 font-medium"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alerta/Ativo">Alerta/Ativo</SelectItem>
                      <SelectItem value="Apatia/Quietude">Apatia/Quietude</SelectItem>
                      <SelectItem value="Estupor">Estupor</SelectItem>
                      <SelectItem value="Comatoso">Comatoso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" /> Notas de Evolução (Progresso Clínico)
            </Label>
            <Textarea 
              placeholder="Descreva o estado atual, alimentação, micção/defecação e resposta ao tratamento..."
              className="min-h-[120px]"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="bg-muted/10 -mx-6 -mb-6 p-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            onClick={handleSave}
            disabled={!notes}
          >
            Salvar Evolução Médica
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
