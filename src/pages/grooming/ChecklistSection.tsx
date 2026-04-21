import { ServiceCatalogItem, ServiceItem } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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

interface Props {
  items: ServiceItem[]
  onChange: (items: ServiceItem[]) => void
  catalogItems: ServiceCatalogItem[]
  readOnly: boolean
}

const EMPTY = { catalogItemId: '', description: '', additionalPrice: '' }

export function ChecklistSection({ items, onChange, catalogItems, readOnly }: Props) {
  const [draft, setDraft] = useState(EMPTY)

  const handleCatalogSelect = (id: string) => {
    const s = catalogItems.find((c) => c.id === id)
    if (!s) return
    setDraft({
      catalogItemId: s.id,
      description: s.name,
      additionalPrice: s.price > 0 ? s.price.toString() : '',
    })
  }

  const handleAdd = () => {
    if (!draft.description) return
    const item: ServiceItem = {
      id: Math.random().toString(36).slice(2, 9),
      description: draft.description,
      price: 0,
      itemType: 'checklist',
      checked: false,
      mandatory: false,
      additionalPrice: draft.additionalPrice ? parseFloat(draft.additionalPrice) : undefined,
      catalogItemId: draft.catalogItemId || undefined,
    }
    onChange([...items, item])
    setDraft(EMPTY)
  }

  const toggle = (id: string) =>
    onChange(items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)))

  const toggleMandatory = (id: string) =>
    onChange(items.map((i) => (i.id === id ? { ...i, mandatory: !i.mandatory } : i)))

  const updatePrice = (id: string, val: string) =>
    onChange(
      items.map((i) =>
        i.id === id ? { ...i, additionalPrice: val ? parseFloat(val) : undefined } : i,
      ),
    )

  const remove = (id: string) => onChange(items.filter((i) => i.id !== id))

  const checkedCount = items.filter((i) => i.checked).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Checklist Operacional</Label>
        {items.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {checkedCount}/{items.length} concluídos
          </span>
        )}
      </div>

      {!readOnly && (
        <div className="flex gap-2">
          {catalogItems.length > 0 ? (
            <Select value={draft.catalogItemId} onValueChange={handleCatalogSelect}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Adicionar do catálogo..." />
              </SelectTrigger>
              <SelectContent>
                {catalogItems.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                    {s.price > 0 && ` (+${formatCurrency(s.price)})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder="Item do checklist"
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
            <div key={item.id} className="flex items-center gap-2 p-2 text-sm">
              <Checkbox
                checked={!!item.checked}
                onCheckedChange={() => !readOnly && toggle(item.id)}
                disabled={readOnly}
              />
              <span
                className={item.checked ? 'line-through text-muted-foreground flex-1' : 'flex-1'}
              >
                {item.description}
              </span>

              {item.mandatory && (
                <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4 shrink-0">
                  Obrigatório
                </Badge>
              )}
              {item.additionalPrice != null && item.additionalPrice > 0 && (
                <span className="text-xs text-green-700 font-medium shrink-0">
                  +{formatCurrency(item.additionalPrice)}
                </span>
              )}

              {!readOnly && (
                <div className="flex items-center gap-1 shrink-0">
                  {item.additionalPrice != null || true ? (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="R$"
                      className="h-6 w-16 text-xs px-1"
                      value={item.additionalPrice ?? ''}
                      onChange={(e) => updatePrice(item.id, e.target.value)}
                    />
                  ) : null}
                  <Button
                    variant={item.mandatory ? 'destructive' : 'outline'}
                    size="sm"
                    className="h-6 text-[10px] px-1.5"
                    onClick={() => toggleMandatory(item.id)}
                    title="Marcar como obrigatório"
                  >
                    {item.mandatory ? '★' : '☆'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500"
                    onClick={() => remove(item.id)}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground text-center py-2 border border-dashed rounded">
          Nenhum item no checklist
        </div>
      )}
    </div>
  )
}
