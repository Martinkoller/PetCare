import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Eye, EyeOff, PawPrint, ChevronDown } from 'lucide-react'

const DEV_USERS = [
  { label: 'Admin',        email: 'admin@agilipet.local',    role: 'admin' },
  { label: 'Veterinário',  email: 'marcelo@agilipet.local',  role: 'veterinarian' },
  { label: 'Groomer',      email: 'carla@agilipet.local',    role: 'groomer' },
  { label: 'Atendente',    email: 'fernanda@agilipet.local', role: 'attendant' },
] as const

const ROLE_COLOR: Record<string, string> = {
  admin:        'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
  veterinarian: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
  groomer:      'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100',
  attendant:    'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
}

export default function LoginPage() {
  const { signIn } = useAuthStore()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDevPanel, setShowDevPanel] = useState(false)

  const fillUser = (userEmail: string) => {
    setEmail(userEmail)
    setPassword('admin123')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Informe e-mail e senha.'); return }

    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)

    if (error) {
      if (error.message === 'trial_expired') {
        toast.error('Período de trial encerrado. Entre em contato pelo fone 49 999715125.')
      } else {
        toast.error(error.message || 'Credenciais inválidas.')
      }
      return
    }

    const stored = localStorage.getItem('token')
    if (stored) {
      try {
        const payload = JSON.parse(atob(stored.split('.')[1]))
        if (payload.role === 'saas_admin') {
          navigate('/saas', { replace: true })
          return
        }
      } catch { }
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-orange-50 to-slate-100">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-xl p-8 space-y-6">
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center shadow-md">
              <PawPrint className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">AgiliPet</h1>
            <p className="text-sm text-slate-500">Faça login para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">E-mail</Label>
              <Input
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                className="h-11 rounded-2xl border-slate-300"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-11 rounded-2xl border-slate-300 pr-10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <p className="text-center text-sm text-slate-500">
              Não tem conta?{' '}
              <Link to="/register" className="text-orange-500 font-semibold hover:underline">Cadastre-se grátis</Link>
            </p>
          </form>

          {/* Acesso rápido dev */}
          <div className="border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setShowDevPanel(v => !v)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors mx-auto"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDevPanel ? 'rotate-180' : ''}`} />
              Acesso rápido
            </button>

            {showDevPanel && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {DEV_USERS.map(u => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => fillUser(u.email)}
                    className={`rounded-xl border px-3 py-2 text-left text-xs font-medium transition-colors ${ROLE_COLOR[u.role]}`}
                  >
                    <span className="block font-semibold">{u.label}</span>
                    <span className="block text-[10px] opacity-70 truncate">{u.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
