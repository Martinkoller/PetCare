import { useState } from 'react'
import { Product } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp } from 'lucide-react'

interface StockAdjustmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSave: (
    productId: string,
    quantity: number,
    type: 'in' | 'out',
    reason: string,
    batchId?: string,
  ) => void
}

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  product,
  onSave,
}: StockAdjustmentDialogProps) {
  const [quantity, setQuantity] = useState('')
  const [type, setType] = useState<'in' | 'out'>('in')
  const [reason, setReason] = useState('')
  const [selectedBatchId, setSelectedBatchId] = useState('')

  if (!product) return null

  const hasBatches = product.batches && product.batches.length > 0

  const handleSave = () => {
    if (!quantity || Number(quantity) <= 0) {
      return toast.error('Quantidade inválida')
    }
    if (!reason) {
      return toast.error('Informe o motivo do ajuste')
    }

    if (hasBatches && !selectedBatchId) {
      return toast.error('Selecione um lote para ajustar')
    }

    if (type === 'out') {
      const available = hasBatches
        ? product.batches?.find((b) => b.id === selectedBatchId)?.quantity || 0
        : product.stock

      if (Number(quantity) > available) {
        return toast.error(
          `Estoque insuficiente ${hasBatches ? 'neste lote' : ''}`,
        )
      }
    }

    onSave(
      product.id,
      Number(quantity),
      type,
      reason,
      selectedBatchId || undefined,
    )

    // Reset
    setQuantity('')
    setReason('')
    setType('in')
    setSelectedBatchId('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajuste de Estoque</DialogTitle>
          <DialogDescription>
            {product.name} (Total: {product.stock} {product.unit})
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {hasBatches && (
            <div className="grid gap-2">
              <Label>Selecione o Lote</Label>
              <Select
                value={selectedBatchId}
                onValueChange={setSelectedBatchId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {product.batches?.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.code} (Qtd: {b.quantity} - Val: {b.expirationDate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Tipo de Movimento</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={type === 'in' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setType('in')}
                >
                  <ArrowUp className="mr-2 h-4 w-4" /> Entrada
                </Button>
                <Button
                  type="button"
                  variant={type === 'out' ? 'destructive' : 'outline'}
                  className="w-full"
                  onClick={() => setType('out')}
                >
                  <ArrowDown className="mr-2 h-4 w-4" /> Saída
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Quantidade ({product.unit})</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Motivo</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo..." />
              </SelectTrigger>
              <SelectContent>
                {type === 'in' ? (
                  <>
                    <SelectItem value="Compra">Compra / Reposição</SelectItem>
                    <SelectItem value="Devolução">Devolução</SelectItem>
                    <SelectItem value="Correção">
                      Correção de Inventário
                    </SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="Uso Interno">Uso Interno</SelectItem>
                    <SelectItem value="Perda/Quebra">Perda / Quebra</SelectItem>
                    <SelectItem value="Validade">Vencimento</SelectItem>
                    <SelectItem value="Correção">
                      Correção de Inventário
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Observações adicionais (opcional)"
              className="mt-2"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Confirmar Ajuste</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
