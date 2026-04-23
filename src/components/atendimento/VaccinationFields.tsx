import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { Appointment } from '@/lib/types'

interface VaccinationFieldsProps {
  formData: Partial<Appointment>
  onChange: (patch: Partial<Appointment>) => void
  readOnly?: boolean
}

export function VaccinationFields({ formData, onChange, readOnly }: VaccinationFieldsProps) {
  const vaccines = [
    { value: 'v10', label: 'V10' },
    { value: 'rabies', label: 'Antirrábica' },
    { value: 'giardia', label: 'Giárdia' },
  ]

  const currentVaccine = formData.notes?.split('|')[0] || 'v10'

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Vacina prevista
        </Label>
        <div className="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {vaccines.map((v) => (
            <button
              key={v.value}
              type="button"
              disabled={readOnly}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all",
                currentVaccine === v.value
                  ? "border-emerald-200 bg-emerald-50 ring-1 ring-emerald-200"
                  : "border-slate-200 hover:border-slate-300"
              )}
              onClick={() => onChange({ notes: `${v.value}|${formData.notes?.split('|')[1] || ''}` })}
            >
              <div className="text-sm font-semibold">{v.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Fabricante / lote</Label>
          <Input 
            placeholder="Ex.: Zoetis - L123" 
            className="rounded-2xl h-11" 
            disabled={readOnly}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Aplicador</Label>
          <Select disabled={readOnly}>
            <SelectTrigger className="rounded-2xl h-11">
              <SelectValue placeholder="Selecione o aplicador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vet">Veterinário</SelectItem>
              <SelectItem value="tech">Técnico</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Dose</Label>
          <Select disabled={readOnly}>
            <SelectTrigger className="rounded-2xl h-11">
              <SelectValue placeholder="Reforço anual" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1ª dose</SelectItem>
              <SelectItem value="2">2ª dose</SelectItem>
              <SelectItem value="3">3ª dose</SelectItem>
              <SelectItem value="annual">Reforço anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Próxima dose</Label>
          <Input 
            type="date" 
            className="rounded-2xl h-11" 
            disabled={readOnly}
          />
        </div>
        <div className="flex items-center gap-3 pt-7">
          <Checkbox id="nextDose" disabled={readOnly} defaultChecked />
          <Label htmlFor="nextDose" className="text-sm font-medium cursor-pointer">Gerar próxima aplicação</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className={cn("flex items-center gap-3 rounded-2xl border border-slate-200 px-4 h-11 bg-slate-50", !readOnly && "cursor-pointer")}>
          <Checkbox className="rounded border-slate-300" disabled={readOnly} />
          <span className="text-sm font-medium">Conferir carteira vacinal</span>
        </label>
        <label className={cn("flex items-center gap-3 rounded-2xl border border-slate-200 px-4 h-11 bg-slate-50", !readOnly && "cursor-pointer")}>
          <Checkbox className="rounded border-slate-300" disabled={readOnly} />
          <span className="text-sm font-medium">Alertar tutor (WhatsApp)</span>
        </label>
      </div>
    </div>
  )
}
