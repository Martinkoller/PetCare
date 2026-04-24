import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, Clock, RefreshCw, ShoppingBag, PawPrint } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'

interface PortalRequest {
  id: string
  email: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  approvedAt: string | null
  client: { id: string; name: string; email: string | null; phone: string | null }
}

interface ClientOrder {
  id: string
  total: number
  status: 'pending' | 'confirmed' | 'cancelled'
  createdAt: string
  items: { id: string; name: string; price: number; qty: number }[]
  client: { id: string; name: string; phone: string | null }
}

const statusBadge = {
  pending:  { label: 'Pendente',  cls: 'bg-yellow-100 text-yellow-700', icon: Clock },
  approved: { label: 'Aprovado',  cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Rejeitado', cls: 'bg-red-100 text-red-700', icon: XCircle },
  confirmed:{ label: 'Confirmado',cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  cancelled:{ label: 'Cancelado', cls: 'bg-red-100 text-red-700', icon: XCircle },
}

export function PortalAccessSettings() {
  const [requests, setRequests] = useState<PortalRequest[]>([])
  const [orders, setOrders] = useState<ClientOrder[]>([])
  const [loadingReq, setLoadingReq] = useState(true)
  const [loadingOrd, setLoadingOrd] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  const fetchRequests = () => {
    setLoadingReq(true)
    api.get('/portal/access-requests')
      .then((r) => setRequests(r.data))
      .catch(() => toast.error('Erro ao carregar solicitações.'))
      .finally(() => setLoadingReq(false))
  }

  const fetchOrders = () => {
    setLoadingOrd(true)
    api.get('/portal/orders')
      .then((r) => setOrders(r.data))
      .catch(() => toast.error('Erro ao carregar pedidos.'))
      .finally(() => setLoadingOrd(false))
  }

  useEffect(() => {
    fetchRequests()
    fetchOrders()
  }, [])

  const reviewRequest = async (id: string, action: 'approved' | 'rejected') => {
    setActing(id)
    try {
      await api.patch(`/portal/access-requests/${id}`, { action })
      setRequests((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: action, approvedAt: action === 'approved' ? new Date().toISOString() : null } : r)
      )
      toast.success(action === 'approved' ? 'Acesso aprovado.' : 'Acesso rejeitado.')
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Erro ao processar.')
    } finally {
      setActing(null)
    }
  }

  const updateOrderStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    setActing(id)
    try {
      await api.patch(`/portal/orders/${id}/status`, { status })
      setOrders((prev) =>
        prev.map((o) => o.id === id ? { ...o, status } : o)
      )
      toast.success(status === 'confirmed' ? 'Pedido confirmado.' : 'Pedido cancelado.')
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Erro ao processar.')
    } finally {
      setActing(null)
    }
  }

  const pending = requests.filter((r) => r.status === 'pending')
  const others  = requests.filter((r) => r.status !== 'pending')
  const pendingOrders = orders.filter((o) => o.status === 'pending')
  const doneOrders    = orders.filter((o) => o.status !== 'pending')

  return (
    <div className="space-y-8">

      {/* ── Solicitações de Acesso ── */}
      <Card>
        <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PawPrint className="h-4 w-4 text-orange-500" />
            Solicitações de Acesso ao Portal
            {pending.length > 0 && (
              <Badge className="bg-orange-500 text-white ml-1">{pending.length} nova{pending.length > 1 ? 's' : ''}</Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={fetchRequests} title="Atualizar">
            <RefreshCw className={cn('h-4 w-4', loadingReq && 'animate-spin')} />
          </Button>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {loadingReq ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Carregando...</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma solicitação ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tutor</TableHead>
                  <TableHead>E-mail portal</TableHead>
                  <TableHead>Solicitado em</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...pending, ...others].map((req) => {
                  const st = statusBadge[req.status]
                  const Icon = st.icon
                  return (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.client.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{req.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(req.createdAt), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', st.cls)}>
                          <Icon className="h-3 w-3" /> {st.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {req.status === 'pending' && (
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="outline"
                              className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                              disabled={acting === req.id}
                              onClick={() => reviewRequest(req.id, 'approved')}>
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Aprovar
                            </Button>
                            <Button size="sm" variant="outline"
                              className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-50"
                              disabled={acting === req.id}
                              onClick={() => reviewRequest(req.id, 'rejected')}>
                              <XCircle className="h-3 w-3 mr-1" /> Rejeitar
                            </Button>
                          </div>
                        )}
                        {req.status === 'approved' && (
                          <Button size="sm" variant="outline"
                            className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-50"
                            disabled={acting === req.id}
                            onClick={() => reviewRequest(req.id, 'rejected')}>
                            <XCircle className="h-3 w-3 mr-1" /> Revogar
                          </Button>
                        )}
                        {req.status === 'rejected' && (
                          <Button size="sm" variant="outline"
                            className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            disabled={acting === req.id}
                            onClick={() => reviewRequest(req.id, 'approved')}>
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Aprovar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Pedidos do Portal ── */}
      <Card>
        <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-sky-500" />
            Pedidos do Portal
            {pendingOrders.length > 0 && (
              <Badge className="bg-sky-500 text-white ml-1">{pendingOrders.length} pendente{pendingOrders.length > 1 ? 's' : ''}</Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={fetchOrders} title="Atualizar">
            <RefreshCw className={cn('h-4 w-4', loadingOrd && 'animate-spin')} />
          </Button>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {loadingOrd ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Carregando...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum pedido ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Tutor</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...pendingOrders, ...doneOrders].map((order) => {
                  const st = statusBadge[order.status]
                  const Icon = st.icon
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{order.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="font-medium">{order.client.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                        <span className="truncate block">
                          {order.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-orange-600">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(order.createdAt), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', st.cls)}>
                          <Icon className="h-3 w-3" /> {st.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {order.status === 'pending' && (
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="outline"
                              className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                              disabled={acting === order.id}
                              onClick={() => updateOrderStatus(order.id, 'confirmed')}>
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Confirmar
                            </Button>
                            <Button size="sm" variant="outline"
                              className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-50"
                              disabled={acting === order.id}
                              onClick={() => updateOrderStatus(order.id, 'cancelled')}>
                              <XCircle className="h-3 w-3 mr-1" /> Cancelar
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
