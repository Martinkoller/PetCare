import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { Appointment } from '@/lib/types'

interface HospitalizationFieldsProps {
  formData: Partial<Appointment>
  onChange: (patch: Partial<Appointment>) => void
  readOnly?: boolean
}

export function HospitalizationFields({ formData, onChange, readOnly }: HospitalizationFieldsProps) {
  const currentLevel = formData.criticismLevel || 'moderate'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nível de criticidade</Label>
          <Select 
            value={currentLevel}
            onValueChange={(v) => onChange({ criticismLevel: v as any })}
            disabled={readOnly}
          >
            <SelectTrigger className="rounded-2xl h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="moderate">Moderada</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="icu">UTI</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Motivo da internação</Label>
          <Textarea
            className="rounded-2xl min-h-[100px]"
            value={formData.notes || ''}
            onChange={(e) => onChange({ notes: e.target.value })}
            disabled={readOnly}
            placeholder="Motivo clínico da admissão..."
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Plano inicial / conduta</Label>
          <Textarea
            className="rounded-2xl min-h-[100px]"
            value={formData.anamnesis || ''}
            onChange={(e) => onChange({ anamnesis: e.target.value })}
            disabled={readOnly}
            placeholder="Protocolo inicial a ser seguido..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Monitoramento</Label>
          <Select disabled={readOnly}>
            <SelectTrigger className="rounded-2xl h-11">
              <SelectValue placeholder="Selecione a frequência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2h">A cada 2h</SelectItem>
              <SelectItem value="4h">A cada 4h</SelectItem>
              <SelectItem value="6h">A cada 6h</SelectItem>
              <SelectItem value="continuous">Contínuo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Canil / Leito</Label>
          <Select disabled={readOnly}>
            <SelectTrigger className="rounded-2xl h-11">
              <SelectValue placeholder="Selecione o leito" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="l1">Leito 01</SelectItem>
              <SelectItem value="l2">Leito 02</SelectItem>
              <SelectItem value="uti1">UTI 01</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3 pt-7">
          <Checkbox id="dailyFollowup" disabled={readOnly} defaultChecked={currentLevel === 'high' || currentLevel === 'icu'} />
          <Label htmlFor="dailyFollowup" className="text-sm font-medium cursor-pointer">Acionar protocolo intensivo</Label>
        </div>
      </div>
    </div>
  )
}
