import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useHospitalizationStore } from '@/stores/HospitalizationContext'
import { HospitalizationStay, DischargeType } from '@/lib/types'

interface DischargeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stay: HospitalizationStay
}

export function DischargeModal({ open, onOpenChange, stay }: DischargeModalProps) {
  const { dischargeStay } = useHospitalizationStore()

  const [dischargeType, setDischargeType] = useState<DischargeType>('discharge')
  const [finalDiagnosis, setFinalDiagnosis] = useState('')
  const [dischargeSummary, setDischargeSummary] = useState('')
  const [dischargeCondition, setDischargeCondition] = useState<'stable' | 'improved' | 'critical' | 'deceased'>('stable')
  const [dischargeInstructions, setDischargeInstructions] = useState('')
  const [dischargeMedications, setDischargeMedications] = useState('')
  const [returnRecommendation, setReturnRecommendation] = useState('')
  const [administrativeNotes, setAdministrativeNotes] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const resetForm = () => {
    setDischargeType('discharge')
    setFinalDiagnosis('')
    setDischargeSummary('')
    setDischargeCondition('stable')
    setDischargeInstructions('')
    setDischargeMedications('')
    setReturnRecommendation('')
    setAdministrativeNotes('')
    setErrorMessage('')
  }

  const handleConfirm = async () => {
    try {
      setErrorMessage('')

      await dischargeStay(stay.id, {
        dischargeType,
        finalDiagnosis: finalDiagnosis.trim() || undefined,
        dischargeSummary: dischargeSummary.trim(),
        dischargeCondition,
        dischargeInstructions: dischargeInstructions.trim() || undefined,
        dischargeMedications: dischargeMedications.trim() || undefined,
        returnRecommendation: returnRecommendation.trim() || undefined,
        administrativeNotes: administrativeNotes.trim() || undefined,
        dischargeAt: new Date().toISOString(),
      })

      onOpenChange(false)
      resetForm()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao encerrar a internação.')
    }
  }

  const isDeath = dischargeType === 'death'

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) resetForm()
      }}
    >
      <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-rose-700">
            Alta / Liberação da Internação
          </DialogTitle>
          <DialogDescription>
            Encerrar a internação de <strong>{stay.pet?.name}</strong> e liberar o leito <strong>{stay.kennelNumber}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Saída</Label>
              <Select value={dischargeType} onValueChange={(v: DischargeType) => setDischargeType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discharge">Alta</SelectItem>
                  <SelectItem value="transfer">Transferência</SelectItem>
                  <SelectItem value="death">Óbito</SelectItem>
                  <SelectItem value="cancelled">Cancelamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Condição na Saída</Label>
              <Select
                value={dischargeCondition}
                onValueChange={(v: 'stable' | 'improved' | 'critical' | 'deceased') => setDischargeCondition(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stable">Estável</SelectItem>
                  <SelectItem value="improved">Melhorado</SelectItem>
                  <SelectItem value="critical">Grave</SelectItem>
                  <SelectItem value="deceased">Óbito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Diagnóstico Final</Label>
            <Input
              placeholder="Ex: Gastroenterite aguda, pós-operatório estável..."
              value={finalDiagnosis}
              onChange={(e) => setFinalDiagnosis(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Resumo Clínico / Encerramento *</Label>
            <Textarea
              className="min-h-[120px]"
              placeholder="Descreva a evolução final, resposta ao tratamento e motivo da alta/encerramento..."
              value={dischargeSummary}
              onChange={(e) => setDischargeSummary(e.target.value)}
            />
          </div>

          {!isDeath && (
            <>
              <div className="space-y-2">
                <Label>Orientações ao Tutor</Label>
                <Textarea
                  className="min-h-[100px]"
                  placeholder="Ex: dieta leve por 3 dias, observar apetite, retornar se houver vômito..."
                  value={dischargeInstructions}
                  onChange={(e) => setDischargeInstructions(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Medicações para Casa</Label>
                <Textarea
                  className="min-h-[100px]"
                  placeholder="Ex: Omeprazol 1x ao dia por 5 dias..."
                  value={dischargeMedications}
                  onChange={(e) => setDischargeMedications(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Retorno Recomendado</Label>
                <Input
                  placeholder="Ex: Reavaliar em 48h"
                  value={returnRecommendation}
                  onChange={(e) => setReturnRecommendation(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Observações Administrativas</Label>
            <Textarea
              className="min-h-[80px]"
              placeholder="Ex: tutor orientado, leito liberado, pendência financeira, etc."
              value={administrativeNotes}
              onChange={(e) => setAdministrativeNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="bg-muted/10 -mx-6 -mb-6 p-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-rose-600 hover:bg-rose-700 text-white"
            onClick={handleConfirm}
            disabled={!dischargeSummary.trim()}
          >
            Confirmar Encerramento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}