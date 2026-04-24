import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Appointment, ServiceItem, ServiceCatalogItem } from '@/lib/types'
import { serviceCatalogService } from '@/services/service-catalog-service'
import { X } from 'lucide-react'

interface GroomingFieldsProps {
  formData: Partial<Appointment>
  onChange: (patch: Partial<Appointment>) => void
  readOnly?: boolean
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

  const filtered = catalog.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) &&
    !selectedItems.some(s => s.catalogItemId === c.id)
  )

  const addItem = (c: ServiceCatalogItem) => {
    onChange({
      serviceItems: [
        ...selectedItems,
        { id: crypto.randomUUID(), description: c.name, price: c.price, duration: c.duration, catalogItemId: c.id },
      ],
    })
    setSearch('')
    setOpen(false)
  }

  const removeItem = (id: string) => {
    onChange({ serviceItems: selectedItems.filter(s => s.id !== id) })
  }

  const complementaryServices = [
    'Corte de unha', 'Limpeza de ouvido', 'Escovação dental', 'Hidratação', 'Desembolo', 'Perfume premium'
  ]

  const preferences = ['Perfume', 'Sem perfume', 'Laço / gravata', 'Máquina', 'Tesoura']

  const toggleServiceItem = (item: string) => {
    const exists = selectedItems.find(i => i.description === item && !i.catalogItemId)
    if (exists) {
      onChange({ serviceItems: selectedItems.filter(i => i.id !== exists.id) })
    } else {
      onChange({ serviceItems: [...selectedItems, { id: crypto.randomUUID(), description: item, price: 0 }] })
    }
  }

  return (
    <div className="space-y-6">
      {/* Serviço principal — busca */}
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Serviço principal</Label>

        <div className="relative">
          <Input
            placeholder="Pesquisar serviço..."
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
                  onMouseDown={() => addItem(c)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50"
                >
                  <span>{c.name}</span>
                  <span className="text-slate-400">R$ {c.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedItems.filter(s => s.catalogItemId).length > 0 && (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Serviço</th>
                  <th className="px-4 py-2 text-right font-semibold">Preço</th>
                  {!readOnly && <th className="w-10" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedItems.filter(s => s.catalogItemId).map(s => (
                  <tr key={s.id}>
                    <td className="px-4 py-2">{s.description}</td>
                    <td className="px-4 py-2 text-right text-slate-600">R$ {s.price.toFixed(2)}</td>
                    {!readOnly && (
                      <td className="px-2 py-2 text-center">
                        <button type="button" onClick={() => removeItem(s.id)} className="text-slate-400 hover:text-red-500">
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Serviços complementares */}
      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Serviços complementares</Label>
        <div className="flex flex-wrap gap-2">
          {complementaryServices.map(item => (
            <button
              key={item}
              type="button"
              disabled={readOnly}
              onClick={() => toggleServiceItem(item)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                selectedItems.some(i => i.description === item && !i.catalogItemId)
                  ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300',
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Preferências */}
      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Preferências do serviço</Label>
        <div className="flex flex-wrap gap-2">
          {preferences.map(pref => (
            <button
              key={pref}
              type="button"
              disabled={readOnly}
              className={cn(
                'rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700',
                !readOnly && 'hover:border-slate-300',
              )}
            >
              {pref}
            </button>
          ))}
        </div>
      </div>

      {/* Observações */}
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
