import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortalAuth } from '@/stores/usePortalAuthStore'
import { useCart } from '@/stores/useCartStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Scissors, Package, ShoppingCart, Plus, Minus, Trash2, PawPrint, LogOut } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import api from '@/lib/api'
import { getPortalToken } from '@/stores/usePortalAuthStore'

interface Service { id: string; name: string; price: number; duration?: number }
interface Product { id: string; name: string; price: number; stock: number }

export default function PortalShopPage() {
  const { user, signOut } = usePortalAuth()
  const cart = useCart()
  const navigate = useNavigate()
  const [services, setServices] = useState<Service[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getPortalToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    Promise.all([
      api.get('/services', { headers }),
      api.get('/products', { headers }),
    ])
      .then(([svc, prod]) => {
        setServices(svc.data.filter((s: any) => s.active !== false))
        setProducts(prod.data.filter((p: any) => p.stock > 0))
      })
      .catch(() => toast.error('Erro ao carregar catálogo.'))
      .finally(() => setLoading(false))
  }, [])

  const handleCheckout = () => {
    if (cart.count === 0) { toast.error('Adicione itens ao carrinho.'); return }
    navigate('/portal/checkout')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-orange-500" />
            <span className="font-bold text-slate-800">Portal do Tutor</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Olá, {user?.name?.split(' ')[0]}</span>
            <Button variant="ghost" size="sm" onClick={() => navigate('/portal/agendamentos')}>Agendamentos</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/portal/pedidos')}>Meus Pedidos</Button>
            <Button variant="ghost" size="icon" onClick={() => { signOut(); navigate('/portal/login') }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 grid gap-6 lg:grid-cols-3">
        {/* Catálogo */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">Carregando catálogo...</div>
          ) : (
            <>
              {/* Serviços */}
              <section>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-purple-500" /> Serviços
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {services.map((s) => (
                    <Card key={s.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{s.name}</p>
                          {s.duration && <p className="text-xs text-slate-400">{s.duration} min</p>}
                          <p className="text-orange-600 font-bold text-sm mt-1">{formatCurrency(s.price)}</p>
                        </div>
                        <Button size="sm" variant="outline"
                          onClick={() => { cart.add({ id: `svc-${s.id}`, name: s.name, price: s.price, type: 'service' }); toast.success('Adicionado!') }}>
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  {services.length === 0 && <p className="text-sm text-slate-400 col-span-2">Nenhum serviço disponível.</p>}
                </div>
              </section>

              {/* Produtos */}
              <section>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-sky-500" /> Produtos
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {products.map((p) => (
                    <Card key={p.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.stock} em estoque</p>
                          <p className="text-orange-600 font-bold text-sm mt-1">{formatCurrency(p.price)}</p>
                        </div>
                        <Button size="sm" variant="outline"
                          onClick={() => { cart.add({ id: `prod-${p.id}`, name: p.name, price: p.price, type: 'product' }); toast.success('Adicionado!') }}>
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  {products.length === 0 && <p className="text-sm text-slate-400 col-span-2">Nenhum produto disponível.</p>}
                </div>
              </section>
            </>
          )}
        </div>

        {/* Carrinho */}
        <div>
          <Card className="sticky top-20">
            <CardContent className="p-4 space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" /> Carrinho
                {cart.count > 0 && <Badge className="ml-auto bg-orange-500">{cart.count}</Badge>}
              </h2>

              {cart.items.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Carrinho vazio</p>
              ) : (
                <ScrollArea className="max-h-64 pr-1">
                  <div className="space-y-2">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{item.name}</p>
                          <p className="text-slate-400 text-xs">{formatCurrency(item.price)} × {item.qty}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => cart.decrement(item.id)} className="h-5 w-5 rounded border flex items-center justify-center text-slate-500 hover:bg-slate-100">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold">{item.qty}</span>
                          <button onClick={() => cart.increment(item.id)} className="h-5 w-5 rounded border flex items-center justify-center text-slate-500 hover:bg-slate-100">
                            <Plus className="h-3 w-3" />
                          </button>
                          <button onClick={() => cart.remove(item.id)} className="h-5 w-5 flex items-center justify-center text-red-400 hover:text-red-600">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              <div className="border-t pt-3 space-y-3">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-orange-600">{formatCurrency(cart.total)}</span>
                </div>
                <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={handleCheckout}
                  disabled={cart.count === 0}>
                  Finalizar Pedido
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
