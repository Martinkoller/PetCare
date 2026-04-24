import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { PawPrint } from 'lucide-react'
import api from '@/lib/api'

export default function PortalRegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', clientId: '', organizationId: '' })
  const [loading, setLoading] = useState(false)

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password || !form.clientId || !form.organizationId) {
      toast.error('Preencha todos os campos.')
      return
    }
    setLoading(true)
    try {
      await api.post('/portal/register', form)
      toast.success('Cadastro realizado! Aguarde a aprovação da clínica.')
      navigate('/portal/login')
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Erro ao cadastrar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-slate-100">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-xl p-8 space-y-6">
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center shadow-md">
              <PawPrint className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Cadastro no Portal</h1>
            <p className="text-xs text-slate-500 text-center">
              Após o cadastro, a clínica precisa aprovar o acesso.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">E-mail</Label>
              <Input type="email" placeholder="seu@email.com" className="h-10 rounded-xl border-slate-300"
                value={form.email} onChange={set('email')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Senha</Label>
              <Input type="password" placeholder="Mínimo 6 caracteres" className="h-10 rounded-xl border-slate-300"
                value={form.password} onChange={set('password')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">ID do Cliente (fornecido pela clínica)</Label>
              <Input placeholder="ex: a1b2c3d4-..." className="h-10 rounded-xl border-slate-300"
                value={form.clientId} onChange={set('clientId')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">ID da Clínica (fornecido pela clínica)</Label>
              <Input placeholder="ex: e5f6g7h8-..." className="h-10 rounded-xl border-slate-300"
                value={form.organizationId} onChange={set('organizationId')} />
            </div>
            <Button type="submit" disabled={loading}
              className="w-full h-11 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-semibold mt-2">
              {loading ? 'Cadastrando...' : 'Solicitar Acesso'}
            </Button>
            <p className="text-center text-sm text-slate-500">
              Já tem acesso?{' '}
              <Link to="/portal/login" className="text-orange-500 font-semibold hover:underline">Entrar</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
