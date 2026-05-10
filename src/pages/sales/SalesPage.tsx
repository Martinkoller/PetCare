import { useState, useMemo } from 'react'
import { useInventoryStore } from '@/stores/InventoryStore'
import { useClientStore } from '@/stores/ClientContext'
import { usePetStore } from '@/stores/PetContext'
import { SaleItem, Sale } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Search,
  ShoppingCart,
  Trash,
  CreditCard,
  Check,
  ChevronsUpDown,
  Banknote,
  Smartphone,
} from 'lucide-react'
import { toast } from 'sonner'
import { SalesHistoryList } from './SalesHistoryList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn, formatCurrency } from '@/lib/utils'
import { parseISO, isBefore, addDays, startOfDay } from 'date-fns'
import { Label } from '@/components/ui/label'

const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX', icon: Smartphone },
  { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { value: 'cartao_credito', label: 'Crédito', icon: CreditCard },
  { value: 'cartao_debito', label: 'Débito', icon: CreditCard },
]

export default function SalesPage() {
  const { products, addSale, sales } = useInventoryStore()
  const { clients } = useClientStore()
  const { pets } = usePetStore()

  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [openClientSearch, setOpenClientSearch] = useState(false)
  const [selectedPetId, setSelectedPetId] = useState<string>('none')
  const [searchProduct, setSearchProduct] = useState('')
  const [cart, setCart] = useState<SaleItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<string>('pix')
  const [saving, setSaving] = useState(false)

  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [pendingProduct, setPendingProduct] = useState<string | null>(null)
  const [selectedBatchId, setSelectedBatchId] = useState<string>('')

  const today = startOfDay(new Date())

  const filteredProducts = useMemo(() => {
    if (!searchProduct) return []
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchProduct.toLowerCase()),
    )
  }, [products, searchProduct])

  const clientPets = useMemo(() => {
    return pets.filter((p) => p.clientId === selectedClientId)
  }, [pets, selectedClientId])

  const initiateAddToCart = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    if (product.batches && product.batches.length > 0) {
      setPendingProduct(productId)
      setSelectedBatchId('')
      setBatchModalOpen(true)
    } else {
      addToCart(productId)
    }
  }

  const confirmBatchSelection = () => {
    if (!selectedBatchId) return toast.error('Selecione um lote')
    if (pendingProduct) {
      addToCart(pendingProduct, selectedBatchId)
      setBatchModalOpen(false)
      setPendingProduct(null)
      setSelectedBatchId('')
    }
  }

  const addToCart = (productId: string, batchId?: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    let stockAvailable = product.stock
    if (batchId && product.batches) {
      const batch = product.batches.find((b) => b.id === batchId)
      if (batch) stockAvailable = batch.quantity
    }

    if (stockAvailable <= 0) return toast.error('Produto sem estoque!')

    const existingItem = cart.find(
      (i) => i.productId === productId && i.batchId === batchId,
    )

    if (existingItem) {
      if (existingItem.quantity >= stockAvailable) {
        toast.warning('Estoque insuficiente para adicionar mais.')
        return
      }
      setCart((prev) =>
        prev.map((i) =>
          i.productId === productId && i.batchId === batchId
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice }
            : i,
        ),
      )
    } else {
      setCart((prev) => [
        ...prev,
        { productId: product.id, productName: product.name, quantity: 1, unitPrice: product.price, total: product.price, batchId },
      ])
    }
    setSearchProduct('')
  }

  const removeFromCart = (productId: string, batchId?: string) => {
    setCart((prev) => prev.filter((i) => !(i.productId === productId && i.batchId === batchId)))
  }

  const updateQuantity = (productId: string, delta: number, batchId?: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId === productId && i.batchId === batchId) {
          let limit = product.stock
          if (batchId && product.batches) limit = product.batches.find((b) => b.id === batchId)?.quantity || 0
          const newQuantity = i.quantity + delta
          if (newQuantity <= 0) return i
          if (newQuantity > limit) { toast.warning('Limite de estoque atingido'); return i }
          return { ...i, quantity: newQuantity, total: newQuantity * i.unitPrice }
        }
        return i
      }),
    )
  }

  const cartTotal = cart.reduce((acc, item) => acc + item.total, 0)

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Carrinho vazio')
    setSaving(true)
    try {
      await addSale({
        date: new Date().toISOString(),
        clientId: selectedClientId || undefined,
        petId: selectedPetId === 'none' ? undefined : selectedPetId,
        items: cart,
        total: cartTotal,
        status: 'completed',
        paymentMethod,
      })
      toast.success('Venda finalizada com sucesso!')
      setCart([])
      setSelectedClientId('')
      setSelectedPetId('none')
      setPaymentMethod('pix')
    } catch {
      toast.error('Erro ao finalizar venda')
    } finally {
      setSaving(false)
    }
  }

  const selectPayment = (method: string) => setPaymentMethod(method)

  const pendingProductObj = products.find((p) => p.id === pendingProduct)

  return (
    <div className="space-y-6 animate-fade-in">
      <Tabs defaultValue="pos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pos">Nova Venda</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="pos">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Esquerda */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Dados da Venda</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 flex flex-col">
                      <Label>Cliente</Label>
                      <Popover open={openClientSearch} onOpenChange={setOpenClientSearch}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" aria-expanded={openClientSearch} className="w-full justify-between">
                            {selectedClientId ? clients.find((c) => c.id === selectedClientId)?.name : 'Venda avulsa / Anônimo'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar cliente..." />
                            <CommandList>
                              <CommandEmpty>Nenhum cliente.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem value="anonymous" onSelect={() => { setSelectedClientId(''); setSelectedPetId('none'); setOpenClientSearch(false) }}>
                                  <Check className={cn('mr-2 h-4 w-4', selectedClientId === '' ? 'opacity-100' : 'opacity-0')} />
                                  [Venda Avulsa / Anônimo]
                                </CommandItem>
                                {clients.map((client) => (
                                  <CommandItem key={client.id} value={client.name} onSelect={() => { setSelectedClientId(client.id); setSelectedPetId('none'); setOpenClientSearch(false) }}>
                                    <Check className={cn('mr-2 h-4 w-4', selectedClientId === client.id ? 'opacity-100' : 'opacity-0')} />
                                    {client.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Pet (Opcional)</Label>
                      <Select value={selectedPetId} onValueChange={setSelectedPetId} disabled={!selectedClientId}>
                        <SelectTrigger><SelectValue placeholder="Selecione o pet..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum / Geral</SelectItem>
                          {clientPets.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5 relative">
                    <Label>Buscar Produto</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Digite o nome ou SKU do produto..."
                        className="pl-9"
                        value={searchProduct}
                        onChange={(e) => setSearchProduct(e.target.value)}
                      />
                    </div>
                    {searchProduct && (
                      <div className="absolute z-10 w-full bg-popover border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                        {filteredProducts.length === 0 ? (
                          <div className="p-4 text-sm text-muted-foreground text-center">Nenhum produto encontrado.</div>
                        ) : (
                          filteredProducts.map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-3 hover:bg-accent cursor-pointer transition-colors" onClick={() => initiateAddToCart(p.id)}>
                              <div>
                                <div className="font-medium">{p.name}</div>
                                <div className="text-xs text-muted-foreground">SKU: {p.sku} | Estoque: {p.stock} {p.unit || 'un'}</div>
                              </div>
                              <div className="font-bold text-sm">{formatCurrency(p.price)}</div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Itens do Carrinho</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="w-[120px]">Qtd</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            Carrinho vazio. Busque e adicione produtos acima.
                          </TableCell>
                        </TableRow>
                      )}
                      {cart.map((item) => {
                        const batchCode = item.batchId
                          ? products.find((p) => p.id === item.productId)?.batches?.find((b) => b.id === item.batchId)?.code
                          : null
                        return (
                          <TableRow key={`${item.productId}-${item.batchId}`}>
                            <TableCell className="font-medium">
                              {item.productName}
                              <div className="text-xs text-muted-foreground">
                                Unit: {formatCurrency(item.unitPrice)}{batchCode && ` | Lote: ${batchCode}`}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.productId, -1, item.batchId)}>-</Button>
                                <span className="w-8 text-center text-sm">{item.quantity}</span>
                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.productId, 1, item.batchId)}>+</Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(item.total)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => removeFromCart(item.productId, item.batchId)}>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Direita */}
            <div className="space-y-4">
              {/* Forma de pagamento */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Forma de Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      variant={paymentMethod === value ? 'default' : 'outline'}
                      className="h-14 flex flex-col gap-1 text-xs"
                      onClick={() => selectPayment(value)}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Resumo */}
              <Card className="bg-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle>Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Itens</span>
                    <span>{cart.reduce((acc, i) => acc + i.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pagamento</span>
                    <span className="font-medium capitalize">
                      {PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label ?? paymentMethod}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-2xl font-bold text-green-600">{formatCurrency(cartTotal)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full h-12 text-base"
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || saving}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {saving ? 'Finalizando...' : 'Finalizar Venda'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <SalesHistoryList sales={sales} />
        </TabsContent>
      </Tabs>

      {/* Modal de lote */}
      <Dialog open={batchModalOpen} onOpenChange={setBatchModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecione o Lote</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {pendingProductObj && (
              <>
                <p className="text-sm text-muted-foreground">Produto: <strong>{pendingProductObj.name}</strong></p>
                <div className="space-y-2">
                  {pendingProductObj.batches?.filter((b) => !isBefore(parseISO(b.expirationDate), today)).length === 0 ? (
                    <p className="text-red-500 font-bold text-sm">Nenhum lote válido disponível.</p>
                  ) : (
                    <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                      <SelectTrigger><SelectValue placeholder="Escolha um lote..." /></SelectTrigger>
                      <SelectContent>
                        {pendingProductObj.batches?.map((b) => {
                          const isExpired = isBefore(parseISO(b.expirationDate), today)
                          const isNear = isBefore(parseISO(b.expirationDate), addDays(today, 30))
                          if (isExpired) return null
                          return (
                            <SelectItem key={b.id} value={b.id} className={isNear ? 'text-yellow-600 font-medium' : ''}>
                              {b.code} (Estoque: {b.quantity}) — Val: {b.expirationDate}{isNear && ' ⚠️'}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground">Lotes vencidos foram ocultados.</p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchModalOpen(false)}>Cancelar</Button>
            <Button onClick={confirmBatchSelection}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
