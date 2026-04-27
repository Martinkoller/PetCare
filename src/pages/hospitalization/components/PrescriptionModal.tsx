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
import {
  HospitalizationStay,
  HospitalizationPrescriptionType,
  HospitalizationPrescriptionFrequency,
} from '@/lib/types'

interface PrescriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stay: HospitalizationStay
}

export function PrescriptionModal({ open, onOpenChange, stay }: PrescriptionModalProps) {
  const { createPrescription } = useHospitalizationStore()

  const [type, setType] = useState<HospitalizationPrescriptionType>('medication')
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [frequency, setFrequency] = useState<HospitalizationPrescriptionFrequency>('q8h')
  const [customFrequencyHours, setCustomFrequencyHours] = useState('')
  const [quantity, setQuantity] = useState('')
  const [route, setRoute] = useState('')
  const [createdByName, setCreatedByName] = useState('')
  const [endAt, setEndAt] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const resetForm = () => {
    setType('medication')
    setTitle('')
    setInstructions('')
    setFrequency('q8h')
    setCustomFrequencyHours('')
    setQuantity('')
    setRoute('')
    setCreatedByName('')
    setEndAt('')
    setErrorMessage('')
  }

  const handleSave = async () => {
    try {
      setErrorMessage('')

      if (!title.trim()) {
        setErrorMessage('Informe o título da prescrição.')
        return
      }

      if (frequency === 'custom' && (!customFrequencyHours || Number(customFrequencyHours) <= 0)) {
        setErrorMessage('Informe um intervalo personalizado válido.')
        return
      }

      await createPrescription(stay.id, {
        petId: stay.petId,
        type,
        title: title.trim(),
        instructions: instructions.trim() || undefined,
        frequency,
        customFrequencyHours: frequency === 'custom' ? Number(customFrequencyHours) : undefined,
        startAt: new Date().toISOString(),
        endAt: endAt ? new Date(endAt).toISOString() : undefined,
        quantity: quantity.trim() || undefined,
        route: route.trim() || undefined,
        createdByName: createdByName.trim() || undefined,
      })

      onOpenChange(false)
      resetForm()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao criar prescrição.')
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Prescrição Assistencial</DialogTitle>
          <DialogDescription>
            Crie uma prescrição operacional para {stay.pet?.name}.
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
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v: HospitalizationPrescriptionType) => setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medication">Medicação</SelectItem>
                  <SelectItem value="fluid_therapy">Fluidoterapia</SelectItem>
                  <SelectItem value="feeding">Alimentação</SelectItem>
                  <SelectItem value="exam">Exame</SelectItem>
                  <SelectItem value="procedure">Procedimento</SelectItem>
                  <SelectItem value="monitoring">Monitoramento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frequência</Label>
              <Select value={frequency} onValueChange={(v: HospitalizationPrescriptionFrequency) => setFrequency(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Dose / ação única</SelectItem>
                  <SelectItem value="q4h">A cada 4h</SelectItem>
                  <SelectItem value="q6h">A cada 6h</SelectItem>
                  <SelectItem value="q8h">A cada 8h</SelectItem>
                  <SelectItem value="q12h">A cada 12h</SelectItem>
                  <SelectItem value="q24h">A cada 24h</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {frequency === 'custom' && (
            <div className="space-y-2">
              <Label>Intervalo Personalizado (horas)</Label>
              <Input
                type="number"
                min="1"
                value={customFrequencyHours}
                onChange={(e) => setCustomFrequencyHours(e.target.value)}
                placeholder="Ex: 3"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Título da Prescrição *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Ceftriaxona 500mg IV"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantidade / Dose</Label>
              <Input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ex: 500mg / 10mL / 1 sachê"
              />
            </div>

            <div className="space-y-2">
              <Label>Via / Forma</Label>
              <Input
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                placeholder="Ex: IV / VO / SC / bomba"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Instruções / Conduta</Label>
            <Textarea
              className="min-h-[100px]"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ex: administrar lentamente, reavaliar em 30 min, manter em bomba..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Profissional Responsável</Label>
              <Input
                value={createdByName}
                onChange={(e) => setCreatedByName(e.target.value)}
                placeholder="Ex: Dr. Marcelo"
              />
            </div>

            <div className="space-y-2">
              <Label>Encerrar Prescrição em (opcional)</Label>
              <Input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="bg-muted/10 -mx-6 -mb-6 p-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-violet-600 hover:bg-violet-700 text-white"
            onClick={handleSave}
            disabled={!title.trim()}
          >
            Criar Prescrição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}