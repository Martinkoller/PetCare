import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortalAuth } from '@/stores/usePortalAuthStore'
import { useCart } from '@/stores/useCartStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import api from '@/lib/api'
import { getPortalToken } from '@/stores/usePortalAuthStore'

export default function PortalCheckoutPage() {
  const { user } = usePortalAuth()
  const cart = useCart()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!user) { navigate('/portal/login'); return }
    if (cart.count === 0) { toast.error('Carrinho vazio.'); return }

    setLoading(true)
    try {
      const token = getPortalToken()
      const { data } = await api.post(
        '/portal/orders',
        { items: cart.items, total: cart.total },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      cart.clear()
      setOrderId(data.id)
      setSuccess(true)
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Erro ao criar pedido.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="w-full max-w-sm shadow-xl">
          <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-500" />
            <h2 className="text-xl font-bold">Pedido Realizado!</h2>
            <p className="text-sm text-slate-500">
              Pedido <span className="font-mono font-semibold">#{orderId?.slice(0, 8)}</span> criado com sucesso.
              A clínica irá confirmar em breve.
            </p>
            <div className="flex gap-2 w-full mt-2">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/portal/loja')}>
                Continuar comprando
              </Button>
              <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={() => navigate('/portal/pedidos')}>
                Meus Pedidos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/portal/loja')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Confirmar Pedido</h1>
        </div>

        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-base">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-2">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.name} × {item.qty}</span>
                <span className="font-medium">{formatCurrency(item.price * item.qty)}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-orange-600">{formatCurrency(cart.total)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-1">
            <p className="text-sm font-medium">Tutor</p>
            <p className="text-sm text-slate-500">{user?.name}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </CardContent>
        </Card>

        <p className="text-xs text-slate-400 text-center">
          Ao confirmar, a clínica receberá seu pedido e entrará em contato para combinar a retirada ou entrega.
        </p>

        <Button className="w-full h-12 bg-orange-500 hover:bg-orange-600 font-semibold text-base"
          onClick={handleConfirm} disabled={loading || cart.count === 0}>
          {loading ? 'Confirmando...' : 'Confirmar Pedido'}
        </Button>
      </div>
    </div>
  )
}
