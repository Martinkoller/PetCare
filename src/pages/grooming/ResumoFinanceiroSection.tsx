import { ServiceItem } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

interface Props {
  items: ServiceItem[]
}

export function ResumoFinanceiroSection({ items }: Props) {
  const main = items.find((i) => i.itemType === 'main')
  const additionals = items.filter((i) => i.itemType === 'additional')
  const checklistCharged = items.filter(
    (i) => i.itemType === 'checklist' && i.checked && (i.additionalPrice ?? 0) > 0,
  )

  const mainTotal = main?.price ?? 0
  const additionalsTotal = additionals.reduce((s, i) => s + i.price, 0)
  const checklistTotal = checklistCharged.reduce((s, i) => s + (i.additionalPrice ?? 0), 0)
  const total = mainTotal + additionalsTotal + checklistTotal

  return (
    <div className="space-y-2 rounded-md border bg-muted/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Resumo Financeiro
      </p>

      <div className="space-y-1 text-sm">
        {main && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{main.description}</span>
            <span>{formatCurrency(mainTotal)}</span>
          </div>
        )}
        {additionals.map((a) => (
          <div key={a.id} className="flex justify-between">
            <span className="text-muted-foreground">{a.description}</span>
            <span>{formatCurrency(a.price)}</span>
          </div>
        ))}
        {checklistCharged.map((c) => (
          <div key={c.id} className="flex justify-between">
            <span className="text-muted-foreground">{c.description} ✓</span>
            <span>{formatCurrency(c.additionalPrice ?? 0)}</span>
          </div>
        ))}
      </div>

      <Separator />

      <div className="flex justify-between font-bold text-sm">
        <span>Total</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  )
}
