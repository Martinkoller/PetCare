import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { PawPrint, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

export default function ConfirmEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token não encontrado.')
      return
    }

    api.get(`/auth/confirm-email?token=${token}`)
      .then(res => {
        setStatus('success')
        setMessage(res.data.message)
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.response?.data?.error || 'Erro ao confirmar e-mail.')
      })
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-orange-50 to-slate-100">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-xl p-8 space-y-6 text-center">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center shadow-md">
              <PawPrint className="w-8 h-8 text-white" />
            </div>
          </div>

          {status === 'loading' && (
            <div className="space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto" />
              <p className="text-slate-600">Confirmando seu e-mail...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h2 className="text-xl font-bold text-slate-900">E-mail confirmado!</h2>
              <p className="text-slate-500 text-sm">{message}</p>
              <Button asChild className="w-full h-11 rounded-2xl bg-orange-500 hover:bg-orange-600">
                <Link to="/login">Fazer login</Link>
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <XCircle className="w-12 h-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-bold text-slate-900">Erro na confirmação</h2>
              <p className="text-slate-500 text-sm">{message}</p>
              <Button asChild variant="outline" className="w-full h-11 rounded-2xl">
                <Link to="/register">Tentar novamente</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
