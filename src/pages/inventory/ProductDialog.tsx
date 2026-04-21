import { useState, useEffect } from 'react'
import { Product, ProductCategory, ProductBatch } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Trash } from 'lucide-react'

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (product: Product) => void
  product?: Product | null
}

export function ProductDialog({
  open,
  onOpenChange,
  onSave,
  product,
}: ProductDialogProps) {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: 'food',
    sku: '',
    price: 0,
    stock: 0,
    minStock: 5,
    description: '',
    unit: 'un',
    expirationDate: '',
    batches: [],
  })

  // Batch Form State
  const [newBatch, setNewBatch] = useState<{
    code: string
    quantity: string
    expirationDate: string
  }>({
    code: '',
    quantity: '',
    expirationDate: '',
  })

  useEffect(() => {
    if (product) {
      setFormData(product)
    } else {
      setFormData({
        name: '',
        category: 'food',
        sku: '',
        price: 0,
        stock: 0,
        minStock: 5,
        description: '',
        unit: 'un',
        expirationDate: '',
        batches: [],
      })
    }
    setNewBatch({ code: '', quantity: '', expirationDate: '' })
  }, [product, open])

  const handleAddBatch = () => {
    if (!newBatch.code || !newBatch.quantity || !newBatch.expirationDate) {
      return toast.error('Preencha todos os campos do lote')
    }
    const batch: ProductBatch = {
      id: Math.random().toString(36).substr(2, 9),
      code: newBatch.code,
      quantity: Number(newBatch.quantity),
      expirationDate: newBatch.expirationDate,
    }

    const updatedBatches = [...(formData.batches || []), batch]
    const totalStock = updatedBatches.reduce((acc, b) => acc + b.quantity, 0)

    setFormData({
      ...formData,
      batches: updatedBatches,
      stock: totalStock,
    })
    setNewBatch({ code: '', quantity: '', expirationDate: '' })
  }

  const handleRemoveBatch = (batchId: string) => {
    const updatedBatches = (formData.batches || []).filter(
      (b) => b.id !== batchId,
    )
    const totalStock = updatedBatches.reduce((acc, b) => acc + b.quantity, 0)
    setFormData({
      ...formData,
      batches: updatedBatches,
      stock: totalStock,
    })
  }

  const handleSave = () => {
    if (!formData.name || !formData.sku || !formData.price) {
      return toast.error('Preencha os campos obrigatórios')
    }

    const newProduct: Product = {
      id: product?.id || Math.random().toString(36).substr(2, 9),
      name: formData.name!,
      category: formData.category as ProductCategory,
      sku: formData.sku!,
      price: Number(formData.price),
      stock: Number(formData.stock),
      minStock: Number(formData.minStock),
      description: formData.description,
      unit: formData.unit || 'un',
      expirationDate: formData.expirationDate, // Legacy support
      batches: formData.batches,
    }

    onSave(newProduct)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
          <DialogDescription>
            Gerencie as informações do produto e lotes.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Nome do Produto</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ex: Ração Premium 15kg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(val) =>
                  setFormData({ ...formData, category: val as ProductCategory })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Alimentos</SelectItem>
                  <SelectItem value="accessories">Acessórios</SelectItem>
                  <SelectItem value="medicines">Medicamentos</SelectItem>
                  <SelectItem value="grooming">Estética</SelectItem>
                  <SelectItem value="vaccine">Vacinas</SelectItem>
                  <SelectItem value="surgical">Cirúrgico/Insumos</SelectItem>
                  <SelectItem value="other">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>SKU / Código</Label>
              <Input
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
                placeholder="PROD-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Preço (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Unidade</Label>
              <Input
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                placeholder="Ex: un, ml, kg"
              />
            </div>
            <div className="grid gap-2">
              <Label>Estoque Mínimo</Label>
              <Input
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) =>
                  setFormData({ ...formData, minStock: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="space-y-4 border p-4 rounded-md bg-muted/20">
            <div className="flex justify-between items-center">
              <Label className="font-bold">Gestão de Lotes</Label>
              <span className="text-sm font-medium">
                Total: {formData.stock}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 items-end">
              <div className="grid gap-1">
                <Label className="text-xs">Código do Lote</Label>
                <Input
                  value={newBatch.code}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, code: e.target.value })
                  }
                  placeholder="LOTE-01"
                  className="h-8"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Quantidade</Label>
                <Input
                  type="number"
                  value={newBatch.quantity}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, quantity: e.target.value })
                  }
                  placeholder="0"
                  className="h-8"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Validade</Label>
                <Input
                  type="date"
                  value={newBatch.expirationDate}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, expirationDate: e.target.value })
                  }
                  className="h-8"
                />
              </div>
            </div>
            <Button size="sm" onClick={handleAddBatch} className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Adicionar Lote
            </Button>

            <div className="border rounded-md bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8">Lote</TableHead>
                    <TableHead className="h-8">Qtd</TableHead>
                    <TableHead className="h-8">Validade</TableHead>
                    <TableHead className="h-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!formData.batches?.length && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-xs text-muted-foreground"
                      >
                        Sem lotes cadastrados
                      </TableCell>
                    </TableRow>
                  )}
                  {formData.batches?.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="py-2">{batch.code}</TableCell>
                      <TableCell className="py-2">{batch.quantity}</TableCell>
                      <TableCell className="py-2 text-xs">
                        {batch.expirationDate}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => handleRemoveBatch(batch.id)}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detalhes adicionais..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Salvar Produto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
