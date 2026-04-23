import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { Appointment } from '@/lib/types'

interface BoardingFieldsProps {
  formData: Partial<Appointment>
  onChange: (patch: Partial<Appointment>) => void
  readOnly?: boolean
}

export function BoardingFields({ formData, onChange, readOnly }: BoardingFieldsProps) {
  const needs = ['Medicação', 'Alimentação própria', 'Restrição alimentar', 'Separação de outros pets']
  const items = ['Ração', 'Remédio', 'Coberta', 'Brinquedo', 'Coleira', 'Tapete higiênico']
  const extras = ['Administração de medicação', 'Passeio extra', 'Recreação individual', 'Banho na saída']

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Canil / acomodação *</Label>
          <Select disabled={readOnly}>
            <SelectTrigger className="rounded-2xl h-11">
              <SelectValue placeholder="Selecione a acomodação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kennel_1">Canil 1 (Pequeno)</SelectItem>
              <SelectItem value="kennel_2">Canil 2 (Médio)</SelectItem>
              <SelectItem value="cat_area">Gatil</SelectItem>
              <SelectItem value="premium">Área Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Frequência de alimentação</Label>
          <Select disabled={readOnly}>
            <SelectTrigger className="rounded-2xl h-11">
              <SelectValue placeholder="2x ao dia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2x">2x ao dia</SelectItem>
              <SelectItem value="3x">3x ao dia</SelectItem>
              <SelectItem value="free">Livre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Passeios / recreação</Label>
          <Select disabled={readOnly}>
            <SelectTrigger className="rounded-2xl h-11">
              <SelectValue placeholder="1x ao dia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1x">1x ao dia</SelectItem>
              <SelectItem value="2x">2x ao dia</SelectItem>
              <SelectItem value="none">Sem passeio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Necessidades especiais</Label>
        <div className="flex flex-wrap gap-2">
          {needs.map(n => (
            <button key={n} type="button" disabled={readOnly} className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:border-orange-300">
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Itens trazidos pelo tutor</Label>
        <div className="flex flex-wrap gap-2">
          {items.map(i => (
            <button key={i} type="button" disabled={readOnly} className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:border-orange-300">
              {i}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Serviços extras da hospedagem</Label>
        <div className="flex flex-wrap gap-2">
          {extras.map(e => (
            <button key={e} type="button" disabled={readOnly} className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:border-orange-300">
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Checklist de admissão</Label>
        <Textarea
          className="rounded-2xl min-h-[100px]"
          disabled={readOnly}
          placeholder="Ex: Coleira vermelha, 1kg de ração Royal Canin, manta azul..."
        />
      </div>
    </div>
  )
}
