import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBoardingStore } from '@/stores/BoardingStore'
import { useAppointmentStore } from '@/stores/AppointmentStore'
import { useInventoryStore } from '@/stores/InventoryStore'
import { BoardingStay } from '@/lib/types'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

interface BoardingServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stay: BoardingStay
}

export function BoardingServiceDialog({
  open,
  onOpenChange,
  stay,
}: BoardingServiceDialogProps) {
  const { addBoardingService } = useBoardingStore()
  const { services } = useAppointmentStore()
  const { products } = useInventoryStore()
  const [type, setType] = useState<'service' | 'product'>('service')
  const [selectedId, setSelectedId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [selectedBatchId, setSelectedBatchId] = useState('')

  const selectedItem =
    type === 'service'
      ? services.find((s) => s.id === selectedId)
      : products.find((p) => p.id === selectedId)

  const hasBatches =
    type === 'product' &&
    selectedItem &&
    'batches' in selectedItem &&
    selectedItem.batches &&
    selectedItem.batches.length > 0

  const handleSave = () => {
    if (!selectedItem) return

    if (type === 'product' && hasBatches && !selectedBatchId) {
      return toast.error('Selecione um lote para o produto.')
    }

    if (type === 'product' && selectedItem && 'stock' in selectedItem) {
      if (quantity > selectedItem.stock) {
        return toast.error('Quantidade excede o estoque disponível.')
      }
    }

    addBoardingService({
      boardingId: stay.id,
      serviceId: type === 'service' ? selectedItem.id : undefined,
      productId: type === 'product' ? selectedItem.id : undefined,
      batchId: selectedBatchId || undefined,
      name: selectedItem.name,
      quantity: Number(quantity),
      unitPrice: selectedItem.price,
      totalPrice: selectedItem.price * quantity,
    })
    onOpenChange(false)
    setSelectedId('')
    setQuantity(1)
    setSelectedBatchId('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Serviço Extra</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Tabs
            value={type}
            onValueChange={(v) => {
              setType(v as 'service' | 'product')
              setSelectedId('')
              setSelectedBatchId('')
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="service">Serviços</TabsTrigger>
              <TabsTrigger value="product">Produtos</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid gap-2">
            <Label>{type === 'service' ? 'Serviço' : 'Produto'}</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {type === 'service'
                  ? services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} - {formatCurrency(s.price)}
                      </SelectItem>
                    ))
                  : products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} - {formatCurrency(p.price)}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>

          {hasBatches && (
            <div className="grid gap-2">
              <Label>Lote (Estoque)</Label>
              <Select
                value={selectedBatchId}
                onValueChange={setSelectedBatchId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o lote..." />
                </SelectTrigger>
                <SelectContent>
                  {type === 'product' &&
                    'batches' in selectedItem &&
                    selectedItem.batches?.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.code} (Qtd: {b.quantity} - Val: {b.expirationDate})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Quantidade</Label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>

          {selectedItem && (
            <div className="p-3 bg-muted rounded text-sm flex justify-between font-medium">
              <span>Total:</span>
              <span>{formatCurrency(selectedItem.price * quantity)}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={!selectedItem}>
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
