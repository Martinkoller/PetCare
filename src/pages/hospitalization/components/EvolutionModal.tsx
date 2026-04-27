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
import { Activity, HeartPulse, Brain, Droplets, ClipboardList } from 'lucide-react'
import { HospitalizationStay, HospitalizationLogType, HospitalizationStatus } from '@/lib/types'

interface EvolutionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stay: HospitalizationStay
}

export function EvolutionModal({ open, onOpenChange, stay }: EvolutionModalProps) {
  const { addLog } = useHospitalizationStore()

  const [logType, setLogType] = useState<HospitalizationLogType>('medical_evolution')

  const [vitals, setVitals] = useState({
    heartRate: '',
    respiratoryRate: '',
    temperature: '',
    mucousMembranes: 'Normocoradas',
    capillaryRefillTime: '< 2s',
    hydrationLevel: 'Hidratado (< 5%)',
    consciousness: 'Alerta/Ativo',
  })

  const [painScore, setPainScore] = useState('0')
  const [appetite, setAppetite] = useState<'normal' | 'partial' | 'refused'>('normal')
  const [urination, setUrination] = useState<'yes' | 'no' | 'unknown'>('unknown')
  const [defecation, setDefecation] = useState<'yes' | 'no' | 'unknown'>('unknown')
  const [vomiting, setVomiting] = useState<'no' | 'yes'>('no')
  const [diarrhea, setDiarrhea] = useState<'no' | 'yes'>('no')

  const [notes, setNotes] = useState('')
  const [conduct, setConduct] = useState('')
  const [statusAfter, setStatusAfter] = useState<HospitalizationStatus>(stay.status)
  const [errorMessage, setErrorMessage] = useState('')

  const resetForm = () => {
    setLogType('medical_evolution')
    setVitals({
      heartRate: '',
      respiratoryRate: '',
      temperature: '',
      mucousMembranes: 'Normocoradas',
      capillaryRefillTime: '< 2s',
      hydrationLevel: 'Hidratado (< 5%)',
      consciousness: 'Alerta/Ativo',
    })
    setPainScore('0')
    setAppetite('normal')
    setUrination('unknown')
    setDefecation('unknown')
    setVomiting('no')
    setDiarrhea('no')
    setNotes('')
    setConduct('')
    setStatusAfter(stay.status)
    setErrorMessage('')
  }

  const handleSave = async () => {
    try {
      setErrorMessage('')

      await addLog(stay.id, {
        petId: stay.petId,
        type: logType,
        eventAt: new Date().toISOString(),
        vitals: {
          heartRate: vitals.heartRate ? Number(vitals.heartRate) : undefined,
          respiratoryRate: vitals.respiratoryRate ? Number(vitals.respiratoryRate) : undefined,
          temperature: vitals.temperature ? Number(vitals.temperature) : undefined,
          mucousMembranes: vitals.mucousMembranes,
          capillaryRefillTime: vitals.capillaryRefillTime,
          hydrationLevel: vitals.hydrationLevel,
          consciousness: vitals.consciousness,
          painScore: painScore ? Number(painScore) : undefined,
        },
        clinical: {
          appetite,
          urination,
          defecation,
          vomiting: vomiting === 'yes',
          diarrhea: diarrhea === 'yes',
        },
        notes: notes.trim(),
        conduct: conduct.trim() || undefined,
        statusAfter,
      })

      onOpenChange(false)
      resetForm()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao salvar evolução.')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) resetForm()
      }}
    >
      <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Evolução Clínica: {stay.pet?.name}
          </DialogTitle>
          <DialogDescription>
            Registre e visualize as evoluções clínicas da internação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Registro</Label>
              <Select value={logType} onValueChange={(v: HospitalizationLogType) => setLogType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical_evolution">Evolução Médica</SelectItem>
                  <SelectItem value="nursing">Enfermagem / Monitoramento</SelectItem>
                  <SelectItem value="medication">Medicação</SelectItem>
                  <SelectItem value="incident">Intercorrência</SelectItem>
                  <SelectItem value="procedure">Procedimento</SelectItem>
                  <SelectItem value="owner_contact">Contato com Tutor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status Após Evolução</Label>
              <Select value={statusAfter} onValueChange={(v: HospitalizationStatus) => setStatusAfter(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admitted">Admitido</SelectItem>
                  <SelectItem value="under_observation">Em observação</SelectItem>
                  <SelectItem value="treatment">Em tratamento</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                  <SelectItem value="ready_for_discharge">Apto para alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">FR (mpm)</Label>
                  <Input
                    type="number"
                    value={vitals.respiratoryRate}
                    onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Temperatura (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={vitals.temperature}
                    onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Dor (0-10)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={painScore}
                    onChange={(e) => setPainScore(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">TPC</Label>
                  <Select
                    value={vitals.capillaryRefillTime}
                    onValueChange={(v) => setVitals({ ...vitals, capillaryRefillTime: v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
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
                  <Select
                    value={vitals.mucousMembranes}
                    onValueChange={(v) => setVitals({ ...vitals, mucousMembranes: v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
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
                  <Select
                    value={vitals.hydrationLevel}
                    onValueChange={(v) => setVitals({ ...vitals, hydrationLevel: v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
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
                  <Select
                    value={vitals.consciousness}
                    onValueChange={(v) => setVitals({ ...vitals, consciousness: v })}
                  >
                    <SelectTrigger className="h-9 font-medium">
                      <SelectValue />
                    </SelectTrigger>
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

          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-emerald-700">
              <ClipboardList className="h-4 w-4" /> Checks Operacionais
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Alimentação</Label>
                <Select value={appetite} onValueChange={(v: 'normal' | 'partial' | 'refused') => setAppetite(v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Aceitou bem</SelectItem>
                    <SelectItem value="partial">Aceitação parcial</SelectItem>
                    <SelectItem value="refused">Recusou</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Micção</Label>
                <Select value={urination} onValueChange={(v: 'yes' | 'no' | 'unknown') => setUrination(v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Sim</SelectItem>
                    <SelectItem value="no">Não</SelectItem>
                    <SelectItem value="unknown">Não avaliado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Defecação</Label>
                <Select value={defecation} onValueChange={(v: 'yes' | 'no' | 'unknown') => setDefecation(v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Sim</SelectItem>
                    <SelectItem value="no">Não</SelectItem>
                    <SelectItem value="unknown">Não avaliado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Vômito</Label>
                <Select value={vomiting} onValueChange={(v: 'yes' | 'no') => setVomiting(v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Não</SelectItem>
                    <SelectItem value="yes">Sim</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Diarreia</Label>
                <Select value={diarrhea} onValueChange={(v: 'yes' | 'no') => setDiarrhea(v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Não</SelectItem>
                    <SelectItem value="yes">Sim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              Notas de Evolução *
            </Label>
            <Textarea
              placeholder="Descreva o estado atual, resposta ao tratamento, comportamento, alimentação e observações relevantes..."
              className="min-h-[120px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Conduta / Plano</Label>
            <Textarea
              placeholder="Ex: manter fluidoterapia, reavaliar em 4h, repetir hemograma, manter observação..."
              className="min-h-[100px]"
              value={conduct}
              onChange={(e) => setConduct(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="bg-muted/10 -mx-6 -mb-6 p-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            onClick={handleSave}
            disabled={!notes.trim()}
          >
            Salvar Evolução
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}