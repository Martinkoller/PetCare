import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortalAuth } from '@/stores/usePortalAuthStore'
import { getPortalToken } from '@/stores/usePortalAuthStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import api from '@/lib/api'

interface OrderItem { id: string; name: string; price: number; qty: number }
interface Order { id: string; total: number; status: string; createdAt: string; items: OrderItem[] }

const statusLabel: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Aguardando', cls: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmado', cls: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelado', cls: 'bg-red-100 text-red-700' },
}

export default function PortalOrdersPage() {
  const { user } = usePortalAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getPortalToken()
    api.get('/portal/orders/my', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setOrders(r.data))
      .catch(() => toast.error('Erro ao carregar pedidos.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/portal/loja')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Meus Pedidos</h1>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400 text-center py-10">Carregando...</p>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <ShoppingBag className="h-10 w-10 opacity-30" />
            <p className="text-sm">Nenhum pedido ainda.</p>
            <Button variant="outline" onClick={() => navigate('/portal/loja')}>Ir para a loja</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const st = statusLabel[order.status] ?? { label: order.status, cls: 'bg-gray-100 text-gray-600' }
              return (
                <Card key={order.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-slate-400">#{order.id.slice(0, 8)}</span>
                      <Badge className={st.cls}>{st.label}</Badge>
                    </div>
                    <div className="space-y-1">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-slate-600">{item.name} × {item.qty}</span>
                          <span>{formatCurrency(item.price * item.qty)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-2 flex justify-between items-center">
                      <span className="text-xs text-slate-400">
                        {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                      <span className="font-bold text-orange-600">{formatCurrency(order.total)}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
