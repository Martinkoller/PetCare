import { useState } from 'react'
import { useInventoryStore } from '@/stores/InventoryStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Search,
  Plus,
  AlertTriangle,
  CalendarClock,
  AlertOctagon,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import { ProductDialog } from './ProductDialog'
import { StockAdjustmentDialog } from './StockAdjustmentDialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Product } from '@/lib/types'
import { AdjustButton, EditButton, DeleteButton } from '@/components/ui/action-buttons'
import { formatCurrency } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  format,
  parseISO,
  isBefore,
  addDays,
  isValid,
  startOfDay,
} from 'date-fns'

export default function InventoryPage() {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    registerStockMovement,
  } = useInventoryStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)

  const today = startOfDay(new Date())

  // Expiration logic (Checks both legacy and batches)
  const isExpired = (product: Product) => {
    if (product.batches && product.batches.length > 0) {
      return product.batches.some((b) =>
        isBefore(parseISO(b.expirationDate), today),
      )
    }
    if (!product.expirationDate) return false
    const date = parseISO(product.expirationDate)
    return isValid(date) && isBefore(date, today)
  }

  const isExpiringSoon = (product: Product) => {
    const limit = addDays(today, 30)
    if (product.batches && product.batches.length > 0) {
      return product.batches.some((b) => {
        const d = parseISO(b.expirationDate)
        return isValid(d) && !isBefore(d, today) && isBefore(d, limit)
      })
    }
    if (!product.expirationDate) return false
    const date = parseISO(product.expirationDate)
    return isValid(date) && !isBefore(date, today) && isBefore(date, limit)
  }

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      categoryFilter === 'all' || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length
  const expiredCount = products.filter((p) => isExpired(p)).length
  const expiringSoonCount = products.filter((p) => isExpiringSoon(p)).length

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setIsDialogOpen(true)
  }

  const handleAdjustment = (product: Product) => {
    setAdjustingProduct(product)
    setIsAdjustmentOpen(true)
  }

  const handleDelete = (id: string) => setDeletingProductId(id)

  const handleDeleteConfirm = async () => {
    if (!deletingProductId) return
    try {
      await deleteProduct(deletingProductId)
      toast.success('Produto excluído com sucesso.')
    } catch {
      // error handled in store
    } finally {
      setDeletingProductId(null)
    }
  }

  const handleSave = async (product: Product) => {
    if (editingProduct) {
      await updateProduct(product)
      toast.success('Produto atualizado!')
    } else {
      await addProduct(product)
      toast.success('Produto cadastrado!')
    }
  }

  const handleStockAdjustment = (
    productId: string,
    quantity: number,
    type: 'in' | 'out',
    reason: string,
    batchId?: string,
  ) => {
    registerStockMovement(productId, quantity, type, reason, undefined, batchId)
    toast.success('Estoque atualizado com sucesso!')
  }

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      food: 'Alimentos',
      accessories: 'Acessórios',
      medicines: 'Medicamentos',
      grooming: 'Estética',
      vaccine: 'Vacinas',
      surgical: 'Insumos',
      other: 'Outros',
    }
    return map[cat] || cat
  }

  return (
    <div className="space-y-4 animate-fade-in">

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card
          className={lowStockCount > 0 ? 'border-primary/30 bg-primary/5' : ''}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Baixo Estoque</CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${lowStockCount > 0 ? 'text-primary' : 'text-muted-foreground'}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-primary' : ''}`}
            >
              {lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Itens abaixo do mínimo
            </p>
          </CardContent>
        </Card>

        <Card
          className={
            expiringSoonCount > 0 ? 'border-yellow-200 bg-yellow-50' : ''
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Vencer</CardTitle>
            <CalendarClock
              className={`h-4 w-4 ${expiringSoonCount > 0 ? 'text-yellow-600' : 'text-muted-foreground'}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${expiringSoonCount > 0 ? 'text-yellow-700' : ''}`}
            >
              {expiringSoonCount}
            </div>
            <p className="text-xs text-muted-foreground">Próximos 30 dias</p>
          </CardContent>
        </Card>

        <Card className={expiredCount > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertOctagon
              className={`h-4 w-4 ${expiredCount > 0 ? 'text-red-600' : 'text-muted-foreground'}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${expiredCount > 0 ? 'text-red-700' : ''}`}
            >
              {expiredCount}
            </div>
            <p className="text-xs text-muted-foreground">Atenção imediata</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <span className="text-muted-foreground font-mono">$</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(products.reduce((acc, p) => acc + p.price * p.stock, 0))}
            </div>
            <p className="text-xs text-muted-foreground">Em mercadorias</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou SKU..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="food">Alimentos</SelectItem>
            <SelectItem value="medicines">Medicamentos</SelectItem>
            <SelectItem value="vaccine">Vacinas</SelectItem>
            <SelectItem value="surgical">Insumos</SelectItem>
            <SelectItem value="accessories">Acessórios</SelectItem>
            <SelectItem value="grooming">Estética</SelectItem>
            <SelectItem value="other">Outros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Cat.</TableHead>
              <TableHead>Lotes</TableHead>
              <TableHead>Validade (Ref)</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Total Estoque</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => {
              const expired = isExpired(product)
              const expiring = isExpiringSoon(product)
              const hasBatches = product.batches && product.batches.length > 0

              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="font-medium">{product.name}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {product.sku}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {getCategoryLabel(product.category)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {hasBatches ? (
                      <Badge
                        variant="secondary"
                        className="flex w-fit gap-1 items-center"
                      >
                        <Layers className="h-3 w-3" /> {product.batches?.length}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {hasBatches ? (
                      <span className="text-xs text-muted-foreground">
                        Ver lotes
                      </span>
                    ) : product.expirationDate ? (
                      <Badge
                        variant={
                          expired
                            ? 'destructive'
                            : expiring
                              ? 'secondary'
                              : 'outline'
                        }
                        className={
                          expiring
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                            : ''
                        }
                      >
                        {format(parseISO(product.expirationDate), 'dd/MM/yy')}
                        {expired && ' (Vencido)'}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(product.price)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {product.stock <= product.minStock && (
                        <AlertTriangle className="h-4 w-4 text-primary animate-pulse" />
                      )}
                      <span
                        className={
                          product.stock <= product.minStock
                            ? 'text-primary font-bold'
                            : ''
                        }
                      >
                        {product.stock}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {product.unit || 'un'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <AdjustButton onClick={() => handleAdjustment(product)} />
                      <EditButton onClick={() => handleEdit(product)} />
                      <DeleteButton onClick={() => handleDelete(product.id)} />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ProductDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingProduct(null)
        }}
        onSave={handleSave}
        product={editingProduct}
      />

      <StockAdjustmentDialog
        open={isAdjustmentOpen}
        onOpenChange={(open) => {
          setIsAdjustmentOpen(open)
          if (!open) setAdjustingProduct(null)
        }}
        product={adjustingProduct}
        onSave={handleStockAdjustment}
      />

      <ConfirmDialog
        open={!!deletingProductId}
        onOpenChange={(open) => { if (!open) setDeletingProductId(null) }}
        title="Excluir produto"
        description={`Tem certeza que deseja excluir "${products.find(p => p.id === deletingProductId)?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDeleteConfirm}
      />

      <Button
        onClick={() => { setEditingProduct(null); setIsDialogOpen(true) }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-5 py-3 shadow-lg hover:shadow-xl"
        size="lg"
      >
        <Plus className="h-5 w-5" />
        Novo Produto
      </Button>
    </div>
  )
}
