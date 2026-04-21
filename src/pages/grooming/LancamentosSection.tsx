import { useState } from 'react'
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface NewItemDraft {
  catalogItemId: string
  description: string
  price: string
  duration: number
}

const EMPTY_DRAFT: NewItemDraft = {
  catalogItemId: '',
  description: '',
  price: '',
  duration: 0,
}

interface Props {
  items: ServiceItem[]
  onItemsChange: (items: ServiceItem[], total: number) => void
  catalogItems: ServiceCatalogItem[]
  readOnly: boolean
}

// ─── Component ───────────────────────────────────────────────────────────────

export function LancamentosSection({ items, onItemsChange, catalogItems, readOnly }: Props) {
  const [draft, setDraft] = useState<NewItemDraft>(EMPTY_DRAFT)

  const commit = (updated: ServiceItem[]) => {
    onItemsChange(updated, updated.reduce((sum, i) => sum + i.price, 0))
  }

  const handleCatalogSelect = (id: string) => {
    const service = catalogItems.find((s) => s.id === id)
    if (!service) return
    setDraft({
      catalogItemId: service.id,
      description: service.name,
      price: service.price.toString(),
      duration: service.duration || 0,
    })
  }

  const handleAdd = () => {
    if (!draft.description || !draft.price) return
    const item: ServiceItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: draft.description,
      price: parseFloat(draft.price),
      duration: draft.duration || undefined,
      catalogItemId: draft.catalogItemId || undefined,
    }
    commit([...items, item])
    setDraft(EMPTY_DRAFT)
  }

  const handleRemove = (id: string) => {
    commit(items.filter((i) => i.id !== id))
  }

  const total = items.reduce((sum, i) => sum + i.price, 0)

  return (
    <div className="space-y-3">
      <Label>Itens do Serviço</Label>

      {!readOnly && (
        <div className="flex gap-2">
          {catalogItems.length > 0 ? (
            <Select value={draft.catalogItemId} onValueChange={handleCatalogSelect}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione do catálogo..." />
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
            <Input
              placeholder="Descrição do serviço"
              className="flex-1"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
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
                <span className="font-mono">{formatCurrency(item.price)}</span>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500"
                    onClick={() => handleRemove(item.id)}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          <div className="p-2 bg-muted/50 flex justify-between font-bold text-sm">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground text-center py-2 border border-dashed rounded">
          Nenhum item adicionado
        </div>
      )}
    </div>
  )
}
