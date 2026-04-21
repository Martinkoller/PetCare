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
import { Plus, Trash } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'

interface NewDraft {
  catalogItemId: string
  description: string
  price: string
  duration: number
}

const EMPTY: NewDraft = { catalogItemId: '', description: '', price: '', duration: 0 }

interface Props {
  items: ServiceItem[]
  onChange: (items: ServiceItem[]) => void
  catalogItems: ServiceCatalogItem[]
  readOnly: boolean
}

export function ServicosAdicionaisSection({ items, onChange, catalogItems, readOnly }: Props) {
  const [draft, setDraft] = useState<NewDraft>(EMPTY)

  const handleCatalogSelect = (id: string) => {
    const s = catalogItems.find((c) => c.id === id)
    if (!s) return
    setDraft({ catalogItemId: s.id, description: s.name, price: s.price.toString(), duration: s.duration ?? 0 })
  }

  const handleAdd = () => {
    if (!draft.description || !draft.price) return
    const item: ServiceItem = {
      id: Math.random().toString(36).slice(2, 9),
      description: draft.description,
      price: parseFloat(draft.price),
      duration: draft.duration || undefined,
      catalogItemId: draft.catalogItemId || undefined,
      itemType: 'additional',
    }
    onChange([...items, item])
    setDraft(EMPTY)
  }

  const remove = (id: string) => onChange(items.filter((i) => i.id !== id))

  return (
    <div className="space-y-3">
      <Label>Serviços Adicionais</Label>

      {!readOnly && (
        <div className="flex gap-2">
          {catalogItems.length > 0 ? (
            <Select value={draft.catalogItemId} onValueChange={handleCatalogSelect}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Adicionar serviço adicional..." />
              </SelectTrigger>
              <SelectContent>
                {catalogItems.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} — {formatCurrency(s.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <>
              <Input
                placeholder="Descrição"
                className="flex-1"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
              <Input
                type="number"
                placeholder="R$"
                className="w-24"
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value })}
              />
            </>
          )}
          <Button type="button" size="icon" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {items.length > 0 ? (
        <div className="border rounded-md divide-y">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-2 text-sm">
              <span>{item.description}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">{formatCurrency(item.price)}</span>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500"
                    onClick={() => remove(item.id)}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground text-center py-2 border border-dashed rounded">
          Nenhum serviço adicional
        </div>
      )}
    </div>
  )
}
