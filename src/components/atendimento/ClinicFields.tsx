import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { Appointment } from '@/lib/types'

interface ClinicFieldsProps {
  formData: Partial<Appointment>
  onChange: (patch: Partial<Appointment>) => void
  readOnly?: boolean
}

export function ClinicFields({ formData, onChange, readOnly }: ClinicFieldsProps) {
  const modes = [
    { value: 'routine', label: 'Consulta de rotina', description: 'Atendimento padrão' },
    { value: 'return', label: 'Retorno', description: 'Reavaliação clínica' },
    { value: 'urgency', label: 'Urgência', description: 'Atendimento prioritário' },
  ]

  const currentMode = formData.clinicalMode || 'routine'

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Modalidade da consulta
        </Label>
        <div className="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {modes.map((mode) => (
            <button
              key={mode.value}
              type="button"
              disabled={readOnly}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all",
                currentMode === mode.value
                  ? "border-blue-200 bg-blue-50 ring-1 ring-blue-200"
                  : "border-slate-200 hover:border-slate-300"
              )}
              onClick={() => onChange({ clinicalMode: mode.value as any })}
            >
              <div className="text-sm font-semibold">{mode.label}</div>
              <div className="text-xs text-slate-500 mt-1">{mode.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {currentMode === 'routine' && (
          <>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Motivo da consulta</Label>
              <Textarea
                className="rounded-2xl min-h-[100px]"
                value={formData.notes || ''}
                onChange={(e) => onChange({ notes: e.target.value })}
                disabled={readOnly}
                placeholder="Descreva o motivo principal..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Anamnese inicial</Label>
              <Textarea
                className="rounded-2xl min-h-[100px]"
                value={formData.anamnesis || ''}
                onChange={(e) => onChange({ anamnesis: e.target.value })}
                disabled={readOnly}
                placeholder="Histórico relatado pelo tutor..."
              />
            </div>
          </>
        )}
        
        {currentMode === 'return' && (
          <>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Atendimento de origem</Label>
              <Select disabled={readOnly}>
                <SelectTrigger className="rounded-2xl h-11">
                  <SelectValue placeholder="Selecione a consulta anterior" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last">Última consulta (15/04/2026)</SelectItem>
                  <SelectItem value="none">Outra...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Evolução relatada</Label>
              <Textarea
                className="rounded-2xl min-h-[100px]"
                value={formData.notes || ''}
                onChange={(e) => onChange({ notes: e.target.value })}
                disabled={readOnly}
                placeholder="Como o pet evoluiu desde a última consulta?"
              />
            </div>
          </>
        )}

        {currentMode === 'urgency' && (
          <>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Sinais imediatos</Label>
              <Textarea
                className="rounded-2xl min-h-[100px]"
                value={formData.notes || ''}
                onChange={(e) => onChange({ notes: e.target.value })}
                disabled={readOnly}
                placeholder="Descreva a emergência..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Classificação de risco</Label>
              <Select disabled={readOnly}>
                <SelectTrigger className="rounded-2xl h-11">
                  <SelectValue placeholder="Selecione o risco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixo</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                  <SelectItem value="emergency">Emergência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Origem</Label>
          <Select 
            value={formData.appointmentType || 'scheduled'}
            onValueChange={(v) => onChange({ appointmentType: v as any })}
            disabled={readOnly}
          >
            <SelectTrigger className="rounded-2xl h-11">
              <SelectValue placeholder="Selecione a origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Agendado</SelectItem>
              <SelectItem value="walkin">Encaixe</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Prioridade</Label>
          <Select 
            value={formData.priority || 'normal'}
            onValueChange={(v) => onChange({ priority: v as any })}
            disabled={readOnly}
          >
            <SelectTrigger className="rounded-2xl h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="preferential">Preferencial</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3 pt-7">
          <Checkbox id="generateRecord" disabled={readOnly} defaultChecked />
          <Label htmlFor="generateRecord" className="text-sm font-medium cursor-pointer">Gerar prontuário</Label>
        </div>
      </div>
    </div>
  )
}
