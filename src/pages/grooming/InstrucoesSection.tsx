import { ServiceCatalogItem, ServiceItem } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'

interface Props {
  items: ServiceItem[]
  onChange: (items: ServiceItem[]) => void
  catalogItems: ServiceCatalogItem[]
  readOnly: boolean
}

export function InstrucoesSection({ items, onChange, catalogItems, readOnly }: Props) {
  const [draft, setDraft] = useState('')
  const [selectedCatalog, setSelectedCatalog] = useState('')

  const handleCatalogSelect = (id: string) => {
    const s = catalogItems.find((c) => c.id === id)
    if (s) {
      setDraft(s.name)
      setSelectedCatalog(id)
    }
  }

  const handleAdd = () => {
    if (!draft.trim()) return
    const item: ServiceItem = {
      id: Math.random().toString(36).slice(2, 9),
      description: draft.trim(),
      price: 0,
      itemType: 'instruction',
      catalogItemId: selectedCatalog || undefined,
    }
    onChange([...items, item])
    setDraft('')
    setSelectedCatalog('')
  }

  const remove = (id: string) => onChange(items.filter((i) => i.id !== id))

  return (
    <div className="space-y-3">
      <Label>Instruções / Observações</Label>

      {!readOnly && (
        <div className="flex gap-2">
          {catalogItems.length > 0 ? (
            <Select value={selectedCatalog} onValueChange={handleCatalogSelect}>
              <SelectTrigger className="w-40 shrink-0">
                <SelectValue placeholder="Catálogo..." />
              </SelectTrigger>
              <SelectContent>
                {catalogItems.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Input
            placeholder="Ex: Não usar perfume, tosa média..."
            className="flex-1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button type="button" size="icon" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 text-xs bg-amber-50 border border-amber-200 text-amber-800 px-2 py-1 rounded-full"
            >
              {item.description}
              {!readOnly && (
                <button
                  onClick={() => remove(item.id)}
                  className="ml-0.5 text-amber-500 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground text-center py-2 border border-dashed rounded">
          Nenhuma instrução registrada
        </div>
      )}
    </div>
  )
}
