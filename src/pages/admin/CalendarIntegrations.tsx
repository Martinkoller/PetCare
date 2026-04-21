import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { UserIntegration } from '@/lib/types'
import { integrationService } from '@/services/integration-service'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export function CalendarIntegrations() {
  const [integrations, setIntegrations] = useState<UserIntegration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const loadIntegrations = async () => {
    setIsLoading(true)
    try {
      const data = await integrationService.getIntegrations()
      setIntegrations(data)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar integrações')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Auth Callback
  useEffect(() => {
    const code = searchParams.get('code')
    const provider = searchParams.get('provider') // We might need to ensure this is passed back or stored in state/cookie

    if (code && provider) {
      const handleCallback = async () => {
        setIsConnecting(true)
        try {
          await integrationService.handleAuthCallback(provider, code)
          toast.success(`Integração com ${provider} realizada com sucesso!`)
          // Clean URL
          navigate('/admin', { replace: true })
          loadIntegrations()
        } catch (error) {
      console.error(error)
          toast.error('Falha na integração. Tente novamente.')
        } finally {
          setIsConnecting(false)
        }
      }
      handleCallback()
    } else {
      loadIntegrations()
    }
  }, [searchParams, navigate])

  const handleConnect = async (provider: 'google' | 'outlook') => {
    setIsConnecting(true)
    try {
      const url = await integrationService.initiateAuth(provider)
      if (url) {
        window.location.href = url
      } else {
        toast.error('Não foi possível iniciar a autenticação.')
        setIsConnecting(false)
      }
    } catch (error) {
      console.error(error)
      toast.error('Erro ao conectar.')
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async (provider: string) => {
    if (
      confirm(
        `Desconectar ${provider}? Os agendamentos não serão mais sincronizados.`,
      )
    ) {
      try {
        await integrationService.deleteIntegration(provider)
        toast.success('Desconectado com sucesso.')
        loadIntegrations()
      } catch (_error) {
        toast.error('Erro ao desconectar.')
      }
    }
  }

  const getIntegration = (provider: string) =>
    integrations.find((i) => i.provider === provider)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Integrações de Calendário</CardTitle>
          <CardDescription>
            Sincronize seus agendamentos automaticamente com Google Calendar ou
            Outlook.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && !isConnecting ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4">
              {/* Google Calendar */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-blue-50 rounded-full">
                    <img
                      src="https://img.usecurling.com/i?q=google&color=multicolor"
                      alt="Google"
                      className="w-6 h-6"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">Google Calendar</h3>
                    {getIntegration('google') ? (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Conectado como{' '}
                        {getIntegration('google')?.calendarEmail || 'Usuário'}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Não conectado
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant={getIntegration('google') ? 'outline' : 'default'}
                  onClick={() =>
                    getIntegration('google')
                      ? handleDisconnect('google')
                      : handleConnect('google')
                  }
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : getIntegration('google') ? (
                    'Desconectar'
                  ) : (
                    'Conectar'
                  )}
                </Button>
              </div>

              {/* Outlook Calendar */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full">
                    <img
                      src="https://img.usecurling.com/i?q=microsoft&color=blue"
                      alt="Outlook"
                      className="w-6 h-6"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">Outlook Calendar</h3>
                    {getIntegration('outlook') ? (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Conectado como{' '}
                        {getIntegration('outlook')?.calendarEmail || 'Usuário'}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Não conectado
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant={getIntegration('outlook') ? 'outline' : 'default'}
                  onClick={() =>
                    getIntegration('outlook')
                      ? handleDisconnect('outlook')
                      : handleConnect('outlook')
                  }
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : getIntegration('outlook') ? (
                    'Desconectar'
                  ) : (
                    'Conectar'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
