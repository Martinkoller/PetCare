import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortalAuth, getPortalToken } from '@/stores/usePortalAuthStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Plus, X } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import api from '@/lib/api'

interface Pet { id: string; name: string; species: string | null }
interface Appointment {
  id: string
  date: string
  serviceType: string
  status: string
  pet: { id: string; name: string }
}

const SERVICE_TYPES = [
  { value: 'grooming', label: 'Banho e Tosa' },
  { value: 'veterinary', label: 'Consulta Veterinária' },
  { value: 'vaccination', label: 'Vacinação' },
  { value: 'boarding', label: 'Hospedagem' },
]

const statusConfig: Record<string, { label: string; cls: string }> = {
  scheduled: { label: 'Agendado', cls: 'bg-blue-100 text-blue-700' },
  confirmed: { label: 'Confirmado', cls: 'bg-emerald-100 text-emerald-700' },
  in_progress: { label: 'Em andamento', cls: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Concluído', cls: 'bg-gray-100 text-gray-700' },
  cancelled: { label: 'Cancelado', cls: 'bg-red-100 text-red-700' },
}

export default function PortalBookingPage() {
  const { user } = usePortalAuth()
  const navigate = useNavigate()
  const [pets, setPets] = useState<Pet[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ petId: '', serviceType: '', date: '', notes: '' })

  const portalToken = getPortalToken()

  const headers = { Authorization: `Bearer ${portalToken}` }

  useEffect(() => {
    if (!user) { navigate('/portal/login'); return }

    Promise.all([
      api.get('/pets', { headers }).then((r) => setPets(r.data)).catch(() => {}),
      api.get('/portal/appointments', { headers }).then((r) => setAppointments(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.petId || !form.serviceType || !form.date) {
      toast.error('Preencha todos os campos obrigatórios.')
      return
    }
    setSubmitting(true)
    try {
      const { data } = await api.post('/portal/appointments', form, { headers })
      setAppointments((prev) => [data, ...prev])
      setShowForm(false)
      setForm({ petId: '', serviceType: '', date: '', notes: '' })
      toast.success('Agendamento solicitado com sucesso!')
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Erro ao agendar.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Cancelar este agendamento?')) return
    try {
      await api.patch(`/portal/appointments/${id}/cancel`, {}, { headers })
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a))
      )
      toast.success('Agendamento cancelado.')
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Erro ao cancelar.')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64">Carregando...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/portal/loja')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Meus Agendamentos</h1>
            <p className="text-sm text-gray-500">Agende e gerencie seus serviços</p>
          </div>
          <Button className="ml-auto" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1" /> Novo
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Novo Agendamento
                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Pet *</label>
                  <select
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={form.petId}
                    onChange={(e) => setForm((f) => ({ ...f, petId: e.target.value }))}
                    required
                  >
                    <option value="">Selecione o pet</option>
                    {pets.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Serviço *</label>
                  <select
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={form.serviceType}
                    onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value }))}
                    required
                  >
                    <option value="">Selecione o serviço</option>
                    {SERVICE_TYPES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Data e hora *</label>
                  <input
                    type="datetime-local"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Observações</label>
                  <textarea
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={2}
                    placeholder="Alguma informação adicional?"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Agendando...' : 'Confirmar Agendamento'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {appointments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-gray-400">
              <Calendar className="w-12 h-12 mb-3" />
              <p className="text-sm">Nenhum agendamento encontrado.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowForm(true)}>
                Fazer primeiro agendamento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {appointments.map((a) => {
              const cfg = statusConfig[a.status] ?? { label: a.status, cls: 'bg-gray-100 text-gray-700' }
              const svcLabel = SERVICE_TYPES.find((s) => s.value === a.serviceType)?.label ?? a.serviceType
              const canCancel = ['scheduled', 'confirmed'].includes(a.status)
              return (
                <Card key={a.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900">{a.pet?.name ?? '—'}</p>
                        <p className="text-sm text-gray-600">{svcLabel}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(a.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={cfg.cls}>{cfg.label}</Badge>
                        {canCancel && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 h-7 px-2"
                            onClick={() => handleCancel(a.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
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
