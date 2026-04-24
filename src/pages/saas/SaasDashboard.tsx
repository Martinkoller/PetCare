import { useEffect, useState } from 'react'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PawPrint, Building2, Users, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/useAuthStore'

interface OrgRow {
  id: string
  name: string
  cnpj: string
  email: string
  phone?: string
  status: string
  trialEndsAt: string
  confirmedAt?: string
  createdAt: string
  _count: { users: number; clients: number }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    trial: 'bg-orange-100 text-orange-700',
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-red-100 text-red-700',
  }
  const labels: Record<string, string> = { trial: 'Trial', active: 'Ativo', inactive: 'Inativo' }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {labels[status] || status}
    </span>
  )
}

export default function SaasDashboard() {
  const { logout } = useAuthStore()
  const [orgs, setOrgs] = useState<OrgRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/saas/organizations')
      setOrgs(res.data)
    } catch {
      toast.error('Erro ao carregar organizações.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const toggle = async (id: string, current: string) => {
    const next = current === 'inactive' ? 'active' : 'inactive'
    try {
      await api.patch(`/saas/organizations/${id}/status`, { status: next })
      toast.success(`Status atualizado para ${next === 'active' ? 'Ativo' : 'Inativo'}.`)
      load()
    } catch {
      toast.error('Erro ao atualizar status.')
    }
  }

  const totalActive = orgs.filter(o => o.status === 'active').length
  const totalTrial = orgs.filter(o => o.status === 'trial').length
  const totalInactive = orgs.filter(o => o.status === 'inactive').length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
            <PawPrint className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">AgiliPet — Painel SAAS</div>
            <div className="text-xs text-slate-500">marteckconsultoria</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => logout()}>Sair</Button>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Ativos', value: totalActive, color: 'text-emerald-600' },
            { label: 'Em Trial', value: totalTrial, color: 'text-orange-600' },
            { label: 'Inativos', value: totalInactive, color: 'text-red-600' },
          ].map(c => (
            <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{c.label}</div>
              <div className={`mt-1 text-3xl font-bold ${c.color}`}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Tabela */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Empresas cadastradas
            </div>
            <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Atualizar
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Empresa', 'CNPJ', 'E-mail', 'Status', 'Trial / Ativo desde', 'Usuários', 'Clientes', 'Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Carregando...</td></tr>
                ) : orgs.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Nenhuma empresa cadastrada.</td></tr>
                ) : orgs.map(org => {
                  const trialDaysLeft = differenceInDays(new Date(org.trialEndsAt), new Date())
                  return (
                    <tr key={org.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{org.name}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                        {org.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{org.email}</td>
                      <td className="px-4 py-3"><StatusBadge status={org.status} /></td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {org.status === 'trial'
                          ? trialDaysLeft >= 0
                            ? <span className="text-orange-600 font-semibold">{trialDaysLeft}d restantes</span>
                            : <span className="text-red-600 font-semibold">Expirado</span>
                          : org.confirmedAt
                            ? format(new Date(org.confirmedAt), 'dd/MM/yyyy', { locale: ptBR })
                            : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" />{org._count.users}</span>
                      </td>
                      <td className="px-4 py-3 text-center">{org._count.clients}</td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant={org.status === 'inactive' ? 'outline' : 'destructive'}
                          className="h-7 text-xs rounded-xl"
                          onClick={() => toggle(org.id, org.status)}
                        >
                          {org.status === 'inactive' ? 'Ativar' : 'Desativar'}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
