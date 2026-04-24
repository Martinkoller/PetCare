import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { PawPrint, Eye, EyeOff } from 'lucide-react'
import api from '@/lib/api'

function formatCNPJ(v: string) {
  return v.replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18)
}

function formatCEP(v: string) {
  return v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9)
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)

  const [form, setForm] = useState({
    companyName: '', cnpj: '', email: '', password: '', name: '', phone: '',
    zipCode: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
  })

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const fetchCEP = async (cep: string) => {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
        }))
      }
    } catch { } finally { setCepLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.companyName || !form.cnpj || !form.email || !form.password || !form.name) {
      toast.error('Preencha todos os campos obrigatórios.')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/register-organization', {
        ...form,
        cnpj: form.cnpj.replace(/\D/g, ''),
        zipCode: form.zipCode.replace(/\D/g, ''),
      })
      toast.success('Cadastro realizado! Verifique seu e-mail para confirmar a conta.')
      navigate('/login')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao cadastrar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-orange-50 to-slate-100 py-10">
      <div className="w-full max-w-2xl">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-xl p-8 space-y-6">
          {/* Logo */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center shadow-md">
              <PawPrint className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Criar conta</h1>
            <p className="text-sm text-slate-500">15 dias gratuitos, sem cartão de crédito</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Dados da empresa */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Dados da empresa</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Nome da empresa <span className="text-red-500">*</span></Label>
                  <Input className="h-11 rounded-2xl" value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Pet Care Clínica Veterinária" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">CNPJ <span className="text-red-500">*</span></Label>
                  <Input className="h-11 rounded-2xl" value={form.cnpj} onChange={e => set('cnpj', formatCNPJ(e.target.value))} placeholder="00.000.000/0000-00" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Telefone</Label>
                  <Input className="h-11 rounded-2xl" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(49) 99971-5125" />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Endereço</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">CEP</Label>
                  <Input
                    className="h-11 rounded-2xl"
                    value={form.zipCode}
                    onChange={e => { set('zipCode', formatCEP(e.target.value)); fetchCEP(e.target.value) }}
                    placeholder="00000-000"
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Logradouro</Label>
                  <Input className="h-11 rounded-2xl" value={form.street} onChange={e => set('street', e.target.value)} placeholder={cepLoading ? 'Buscando...' : 'Rua, Av...'} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Número</Label>
                  <Input className="h-11 rounded-2xl" value={form.number} onChange={e => set('number', e.target.value)} placeholder="123" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Complemento</Label>
                  <Input className="h-11 rounded-2xl" value={form.complement} onChange={e => set('complement', e.target.value)} placeholder="Sala 2" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Bairro</Label>
                  <Input className="h-11 rounded-2xl" value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Cidade</Label>
                  <Input className="h-11 rounded-2xl" value={form.city} onChange={e => set('city', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">UF</Label>
                  <Input className="h-11 rounded-2xl" value={form.state} onChange={e => set('state', e.target.value)} maxLength={2} placeholder="SC" />
                </div>
              </div>
            </div>

            {/* Dados do administrador */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Administrador da conta</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Nome completo <span className="text-red-500">*</span></Label>
                  <Input className="h-11 rounded-2xl" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Maria da Silva" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">E-mail <span className="text-red-500">*</span></Label>
                  <Input type="email" className="h-11 rounded-2xl" value={form.email} onChange={e => set('email', e.target.value)} placeholder="admin@clinica.com" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Senha <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      className="h-11 rounded-2xl pr-10"
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-semibold">
              {loading ? 'Criando conta...' : 'Criar conta grátis'}
            </Button>

            <p className="text-center text-sm text-slate-500">
              Já tem conta?{' '}
              <Link to="/login" className="text-orange-500 font-semibold hover:underline">Fazer login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
