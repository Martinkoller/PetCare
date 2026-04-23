import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Appointment } from '@/lib/types'

interface GroomingFieldsProps {
  formData: Partial<Appointment>
  onChange: (patch: Partial<Appointment>) => void
  readOnly?: boolean
}

export function GroomingFields({ formData, onChange, readOnly }: GroomingFieldsProps) {
  const mainServices = [
    { value: 'bath', label: 'Banho' },
    { value: 'hygienic_clip', label: 'Tosa higiênica' },
    { value: 'full_clip', label: 'Tosa completa' },
    { value: 'bath_and_clip', label: 'Banho e tosa' },
    { value: 'hydration', label: 'Hidratação' },
  ]

  const complementaryServices = [
    'Corte de unha', 'Limpeza de ouvido', 'Escovação dental', 'Hidratação', 'Desembolo', 'Perfume premium'
  ]

  const preferences = [
    'Perfume', 'Sem perfume', 'Laço / gravata', 'Máquina', 'Tesoura'
  ]

  const currentService = formData.notes?.split('|')[0] || 'bath'

  const toggleServiceItem = (item: string) => {
    const currentItems = formData.serviceItems || []
    const exists = currentItems.find(i => i.description === item)
    if (exists) {
      onChange({ serviceItems: currentItems.filter(i => i.description !== item) })
    } else {
      onChange({ 
        serviceItems: [...currentItems, { id: Math.random().toString(), description: item, price: 0 }] 
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Serviço principal
        </Label>
        <div className="mt-2 grid grid-cols-1 lg:grid-cols-5 gap-4">
          {mainServices.map((service) => (
            <button
              key={service.value}
              type="button"
              disabled={readOnly}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all",
                currentService === service.value
                  ? "border-cyan-200 bg-cyan-50 ring-1 ring-cyan-200"
                  : "border-slate-200 hover:border-slate-300"
              )}
              onClick={() => onChange({ notes: `${service.value}|${formData.notes?.split('|')[1] || ''}` })}
            >
              <div className="text-sm font-semibold">{service.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Porte</Label>
          <Select disabled={readOnly}>
            <SelectTrigger className="rounded-2xl h-11">
              <SelectValue placeholder="Pequeno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Pequeno</SelectItem>
              <SelectItem value="medium">Médio</SelectItem>
              <SelectItem value="large">Grande</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Pelagem</Label>
          <Select disabled={readOnly}>
            <SelectTrigger className="rounded-2xl h-11">
              <SelectValue placeholder="Média" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short">Curta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="long">Longa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Comportamento</Label>
          <Select disabled={readOnly}>
            <SelectTrigger className="rounded-2xl h-11">
              <SelectValue placeholder="Tranquilo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="calm">Tranquilo</SelectItem>
              <SelectItem value="anxious">Ansioso</SelectItem>
              <SelectItem value="reactive">Reativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Previsão de retirada</Label>
          <Input type="time" className="rounded-2xl h-11" defaultValue="11:30" disabled={readOnly} />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Serviços complementares</Label>
        <div className="flex flex-wrap gap-2">
          {complementaryServices.map((item) => (
            <button
              key={item}
              type="button"
              disabled={readOnly}
              onClick={() => toggleServiceItem(item)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                formData.serviceItems?.some(i => i.description === item)
                  ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Preferências do serviço</Label>
        <div className="flex flex-wrap gap-2">
          {preferences.map((pref) => (
            <button
              key={pref}
              type="button"
              disabled={readOnly}
              className={cn(
                "rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700",
                !readOnly && "hover:border-slate-300"
              )}
            >
              {pref}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Observações operacionais</Label>
        <Textarea
          className="rounded-2xl min-h-[100px]"
          disabled={readOnly}
          placeholder="Ex: Alergia a shampoo específico, cuidado com a orelha esquerda..."
        />
      </div>
    </div>
  )
}
