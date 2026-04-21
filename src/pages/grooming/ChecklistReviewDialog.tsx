import { useState, useEffect } from 'react'
import { ServiceItem } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { CheckCircle2, ClipboardList, PackageCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  targetStage: 'final' | 'delivery'
  checklistItems: ServiceItem[]
  canSkipChecklist: boolean
  onConfirm: (updatedItems: ServiceItem[]) => void
  onCancel: () => void
}

export function ChecklistReviewDialog({
  open,
  targetStage,
  checklistItems,
  canSkipChecklist,
  onConfirm,
  onCancel,
}: Props) {
  const [items, setItems] = useState<ServiceItem[]>(checklistItems)

  useEffect(() => {
    setItems(checklistItems)
  }, [checklistItems, open])

  const toggle = (id: string) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
    )

  const allChecked = items.every((i) => i.checked)
  const pendingMandatory = items.filter((i) => i.mandatory && !i.checked)
  const hasBlocker = pendingMandatory.length > 0 && !canSkipChecklist

  const isDelivery = targetStage === 'delivery'
  const title = isDelivery ? 'Confirmar Entrega' : 'Confirmar Finalização'
  const description = isDelivery
    ? 'Revise o checklist antes de marcar como Entregue.'
    : 'Revise o checklist antes de marcar como Pronto.'
  const Icon = isDelivery ? PackageCheck : CheckCircle2
  const confirmLabel = isDelivery ? 'Confirmar Entrega' : 'Marcar como Pronto'

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={cn('h-4 w-4', isDelivery ? 'text-purple-500' : 'text-green-500')} />
            {title}
          </DialogTitle>
          {checklistItems.length > 0 && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        {checklistItems.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground text-sm">
            <ClipboardList className="h-8 w-8 opacity-40" />
            <span>Nenhum item de checklist neste atendimento.</span>
          </div>
        ) : (
          <ul className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <Checkbox
                  id={`chk-${item.id}`}
                  checked={!!item.checked}
                  onCheckedChange={() => toggle(item.id)}
                  className="mt-0.5"
                />
                <Label
                  htmlFor={`chk-${item.id}`}
                  className={cn(
                    'cursor-pointer leading-snug',
                    item.checked && 'line-through text-muted-foreground',
                    item.mandatory && !item.checked && 'text-red-600 font-medium',
                  )}
                >
                  {item.description}
                  {item.mandatory && (
                    <span className="ml-1 text-xs text-red-500">*</span>
                  )}
                </Label>
              </li>
            ))}
          </ul>
        )}

        {pendingMandatory.length > 0 && (
          <p className="text-xs text-red-600 font-medium">
            {pendingMandatory.length} item(s) obrigatório(s) pendente(s).
            {canSkipChecklist && ' Você pode prosseguir mesmo assim.'}
          </p>
        )}

        {allChecked && checklistItems.length > 0 && (
          <p className="text-xs text-green-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Checklist completo!
          </p>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full"
            disabled={hasBlocker}
            onClick={() => onConfirm(items)}
          >
            {confirmLabel}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onCancel}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
