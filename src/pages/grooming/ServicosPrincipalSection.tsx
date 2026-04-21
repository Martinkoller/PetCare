import { ServiceCatalogItem, ServiceItem } from '@/lib/types'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'

interface Props {
  mainItem: ServiceItem | undefined
  onChange: (main: ServiceItem | undefined, suggestedChecklist: ServiceItem[], suggestedInstructions: ServiceItem[]) => void
  catalogItems: ServiceCatalogItem[]
  allCatalogItems: ServiceCatalogItem[]
  readOnly: boolean
}

export function ServicosPrincipalSection({
  mainItem,
  onChange,
  catalogItems,
  allCatalogItems,
  readOnly,
}: Props) {
  const handleSelect = (id: string) => {
    if (id === '__none__') {
      onChange(undefined, [], [])
      return
    }
    const service = catalogItems.find((s) => s.id === id)
    if (!service) return

    const newMain: ServiceItem = {
      id: Math.random().toString(36).slice(2, 9),
      description: service.name,
      price: service.price,
      duration: service.duration,
      catalogItemId: service.id,
      itemType: 'main',
    }

    // Sugerir checklist e instruções a partir dos filhos do catálogo
    const children = allCatalogItems.filter((c) => c.parentId === service.id && c.active)
    const suggestedChecklist: ServiceItem[] = children
      .filter((c) => c.itemType === 'checklist' || (!c.itemType && c.price >= 0))
      .map((c) => ({
        id: Math.random().toString(36).slice(2, 9),
        description: c.name,
        price: 0,
        itemType: 'checklist' as const,
        checked: false,
        mandatory: c.mandatory ?? false,
        additionalPrice: c.price > 0 ? c.price : undefined,
        catalogItemId: c.id,
      }))
    const suggestedInstructions: ServiceItem[] = children
      .filter((c) => c.itemType === 'instruction')
      .map((c) => ({
        id: Math.random().toString(36).slice(2, 9),
        description: c.name,
        price: 0,
        itemType: 'instruction' as const,
        catalogItemId: c.id,
      }))

    onChange(newMain, suggestedChecklist, suggestedInstructions)
  }

  return (
    <div className="space-y-2">
      <Label>Serviço Principal</Label>
      {readOnly ? (
        mainItem ? (
          <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
            <span className="font-medium text-sm">{mainItem.description}</span>
            <Badge variant="secondary">{formatCurrency(mainItem.price)}</Badge>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground px-1">Não informado</div>
        )
      ) : (
        <Select value={mainItem?.catalogItemId ?? '__none__'} onValueChange={handleSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o serviço principal..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— Nenhum —</SelectItem>
            {catalogItems.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} — {formatCurrency(s.price)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
