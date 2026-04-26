import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { Appointment, ServiceItem, ServiceCatalogItem } from '@/lib/types'
import { serviceCatalogService } from '@/services/service-catalog-service'
import { X } from 'lucide-react'

interface GroomingFieldsProps {
  formData: Partial<Appointment>
  onChange: (patch: Partial<Appointment>) => void
  readOnly?: boolean
}

const COMPLEMENTARY_SERVICES = [
  'Corte de unha', 'Limpeza de ouvido', 'Escovação dental', 'Hidratação', 'Desembolo', 'Perfume premium',
]

const PREFERENCES = ['Perfume', 'Sem perfume', 'Laço / gravata', 'Máquina', 'Tesoura']

const MUTUALLY_EXCLUSIVE: Record<string, string> = {
  'Perfume': 'Sem perfume',
  'Sem perfume': 'Perfume',
}

export function GroomingFields({ formData, onChange, readOnly }: GroomingFieldsProps) {
  const [catalog, setCatalog] = React.useState<ServiceCatalogItem[]>([])
  const [search, setSearch] = React.useState('')
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    serviceCatalogService.getServices()
      .then(items => setCatalog(items.filter(i => i.active && i.category === 'grooming')))
      .catch(() => {})
  }, [])

  const selectedItems: ServiceItem[] = formData.serviceItems || []
  const preferences: string[] = formData.groomingPreferences || []
  const priceAdjustment = formData.priceAdjustment ?? 0
  const priceAdjustmentReason = formData.priceAdjustmentReason ?? ''

  const mainItem = selectedItems.find(i => i.itemType === 'main')
  const complementaryItems = selectedItems.filter(i => i.itemType === 'additional')

  const filtered = catalog.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) &&
    !selectedItems.some(s => s.catalogItemId === c.id)
  )

  const selectMainItem = (c: ServiceCatalogItem) => {
    const withoutMain = selectedItems.filter(i => i.itemType !== 'main')
    onChange({
      serviceItems: [
        { id: crypto.randomUUID(), description: c.name, price: c.price, duration: c.duration, catalogItemId: c.id, itemType: 'main' },
        ...withoutMain,
      ],
      price: calcTotal([
        { id: '', description: '', price: c.price, itemType: 'main' },
        ...withoutMain,
      ], priceAdjustment),
    })
    setSearch('')
    setOpen(false)
  }

  const removeMainItem = () => {
    const withoutMain = selectedItems.filter(i => i.itemType !== 'main')
    onChange({
      serviceItems: withoutMain,
      price: calcTotal(withoutMain, priceAdjustment),
    })
  }

  const toggleComplementary = (label: string) => {
    const exists = complementaryItems.find(i => i.description === label)
    let next: ServiceItem[]
    if (exists) {
      next = selectedItems.filter(i => i.id !== exists.id)
    } else {
      next = [...selectedItems, { id: crypto.randomUUID(), description: label, price: 0, itemType: 'additional' }]
    }
    onChange({ serviceItems: next, price: calcTotal(next, priceAdjustment) })
  }

  const togglePreference = (pref: string) => {
    const opposite = MUTUALLY_EXCLUSIVE[pref]
    let next = preferences.includes(pref)
      ? preferences.filter(p => p !== pref)
      : [...preferences.filter(p => p !== opposite), pref]
    onChange({ groomingPreferences: next })
  }

  const handleAdjustment = (value: string) => {
    const num = parseFloat(value) || 0
    onChange({
      priceAdjustment: num,
      price: calcTotal(selectedItems, num),
    })
  }

  const baseTotal = selectedItems
    .filter(i => i.itemType === 'main' || i.itemType === 'additional')
    .reduce((s, i) => s + (i.price || 0), 0)
  const grandTotal = baseTotal + priceAdjustment

  return (
    <div className="space-y-6">

      {/* Serviço principal */}
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Serviço principal <span className="text-red-500">*</span>
        </Label>

        {mainItem ? (
          <div className="flex items-center justify-between rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-violet-900">{mainItem.description}</p>
              <p className="text-xs text-violet-600">
                R$ {mainItem.price.toFixed(2)}
                {mainItem.duration ? ` · ${mainItem.duration} min` : ''}
              </p>
            </div>
            {!readOnly && (
              <button type="button" onClick={removeMainItem} className="text-violet-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            <Input
              placeholder="Pesquisar serviço principal..."
              className="h-11 rounded-2xl border-slate-300"
              value={search}
              disabled={readOnly}
              onChange={e => { setSearch(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
            />
            {open && filtered.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-2xl border border-slate-200 bg-white shadow-lg max-h-52 overflow-y-auto">
                {filtered.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={() => selectMainItem(c)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50"
                  >
                    <span>{c.name}</span>
                    <span className="text-slate-400">R$ {c.price.toFixed(2)}{c.duration ? ` · ${c.duration}min` : ''}</span>
                  </button>
                ))}
              </div>
            )}
            {!readOnly && (
              <p className="text-xs text-amber-600 mt-1">Serviço principal obrigatório para iniciar o atendimento.</p>
            )}
          </div>
        )}
      </div>

      {/* Serviços complementares */}
      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Serviços complementares</Label>
        <div className="flex flex-wrap gap-2">
          {COMPLEMENTARY_SERVICES.map(item => (
            <button
              key={item}
              type="button"
              disabled={readOnly}
              onClick={() => toggleComplementary(item)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                complementaryItems.some(i => i.description === item)
                  ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300',
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Preferências do serviço */}
      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Preferências do serviço</Label>
        <div className="flex flex-wrap gap-2">
          {PREFERENCES.map(pref => (
            <button
              key={pref}
              type="button"
              disabled={readOnly}
              onClick={() => togglePreference(pref)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                preferences.includes(pref)
                  ? 'border-violet-200 bg-violet-50 text-violet-700'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300',
              )}
            >
              {pref}
            </button>
          ))}
        </div>
      </div>

      {/* Ajuste manual de valor */}
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Ajuste de valor</Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Ajuste (R$)</Label>
            <Input
              type="number"
              step="0.01"
              className="h-10 rounded-xl"
              disabled={readOnly}
              value={priceAdjustment === 0 ? '' : priceAdjustment}
              placeholder="0,00"
              onChange={e => handleAdjustment(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1">Positivo = acréscimo · Negativo = desconto</p>
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">
              Motivo {priceAdjustment !== 0 && <span className="text-red-500">*</span>}
            </Label>
            <Input
              className="h-10 rounded-xl"
              disabled={readOnly}
              placeholder="Ex: Desembolo, desconto cortesia..."
              value={priceAdjustmentReason}
              onChange={e => onChange({ priceAdjustmentReason: e.target.value })}
            />
          </div>
        </div>

        {/* Resumo financeiro */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-1 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Serviços</span>
            <span>R$ {baseTotal.toFixed(2)}</span>
          </div>
          {priceAdjustment !== 0 && (
            <div className={cn('flex justify-between', priceAdjustment > 0 ? 'text-amber-600' : 'text-green-600')}>
              <span>{priceAdjustment > 0 ? 'Acréscimo' : 'Desconto'}</span>
              <span>{priceAdjustment > 0 ? '+' : ''}R$ {priceAdjustment.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-slate-900 border-t pt-1">
            <span>Total previsto</span>
            <span>R$ {grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Autoriza serviços extras */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-800">Autoriza serviços extras</p>
          <p className="text-xs text-slate-500">Tutor autorizou cobranças adicionais se necessário</p>
        </div>
        <Switch
          checked={formData.checkinExtraAuthorized ?? false}
          onCheckedChange={v => onChange({ checkinExtraAuthorized: v })}
          disabled={readOnly}
        />
      </div>

      {/* Observações operacionais */}
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Observações operacionais</Label>
        <Textarea
          className="rounded-2xl min-h-[100px]"
          disabled={readOnly}
          placeholder="Ex: Alergia a shampoo específico, cuidado com a orelha esquerda, pet sensível ao secador..."
          value={formData.notes ?? ''}
          onChange={e => onChange({ notes: e.target.value })}
        />
      </div>

    </div>
  )
}

function calcTotal(items: ServiceItem[], adjustment: number): number {
  const base = items
    .filter(i => i.itemType === 'main' || i.itemType === 'additional')
    .reduce((s, i) => s + (i.price || 0), 0)
  return base + adjustment
}
