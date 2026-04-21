import { ServiceItem } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertTriangle } from 'lucide-react'

interface Props {
  open: boolean
  pendingItems: ServiceItem[]
  canForceFinish: boolean
  onReview: () => void
  onForceFinish: () => void
  onCancel: () => void
}

export function ChecklistPendingDialog({
  open,
  pendingItems,
  canForceFinish,
  onReview,
  onForceFinish,
  onCancel,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Checklist com pendências
          </DialogTitle>
          <DialogDescription>
            {pendingItems.length} item(s) obrigatório(s) não foram concluídos:
          </DialogDescription>
        </DialogHeader>

        <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
          {pendingItems.map((i) => (
            <li key={i.id} className="flex items-center gap-2 text-red-700">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
              {i.description}
            </li>
          ))}
        </ul>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button variant="outline" className="w-full" onClick={onReview}>
            Revisar checklist
          </Button>
          {canForceFinish && (
            <Button variant="destructive" className="w-full" onClick={onForceFinish}>
              Finalizar mesmo assim
            </Button>
          )}
          <Button variant="ghost" className="w-full" onClick={onCancel}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
