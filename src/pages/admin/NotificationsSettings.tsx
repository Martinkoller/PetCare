import { useState } from 'react'
import { useConfigStore } from '@/stores/ConfigStore'
import WhatsAppConnectionPanel from '@/components/settings/WhatsAppConnectionPanel'
import TemplateManager from '@/components/settings/TemplateManager'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Check,
  X,
  MessageSquare,
  ClipboardList,
} from 'lucide-react'
import { toast } from 'sonner'
import { whatsappService } from '@/services/whatsapp-service'

export default function NotificationsSettings() {
  const {
    notificationSettings,
    notificationLogs,
    updateNotificationSettings,
    setNotificationLogs,
  } = useConfigStore()

  const [logsTabLoaded, setLogsTabLoaded] = useState(false)

  const handleLoadLogs = async () => {
    try {
      const logs = await whatsappService.getLogs()
      setNotificationLogs(logs)
    } catch {
      toast.error('Erro ao carregar histórico')
    }
  }

  return (
    <div className="space-y-6">
      {/* ─── NOVO PAINEL DE CONEXÃO WHATSAPP COM QR CODE ───────────────── */}
      <WhatsAppConnectionPanel />

      {/* ─── Automação global ─────────────────────────────────────────── */}
      <Card>
        <CardContent className="flex items-center justify-between pt-6">
          <div className="space-y-0.5">
            <Label className="text-base font-semibold">Automação de Mensagens</Label>
            <p className="text-sm text-muted-foreground">
              Habilita o envio automático de mensagens nos gatilhos configurados.
            </p>
          </div>
          <Switch
            checked={notificationSettings.enabled}
            onCheckedChange={(checked) =>
              updateNotificationSettings({ enabled: checked })
            }
          />
        </CardContent>
      </Card>

      {/* ─── Templates + Logs Tabs ────────────────────────────────────── */}
      <Tabs
        defaultValue="templates"
        onValueChange={(value) => {
          if (value === 'logs' && !logsTabLoaded) {
            setLogsTabLoaded(true)
            handleLoadLogs()
          }
        }}
      >
        <TabsList>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Modelos de Mensagem
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Histórico de Envios
          </TabsTrigger>
        </TabsList>

        {/* ─── Templates ──────────────────────────────────────────────── */}
        <TabsContent value="templates" className="mt-4">
          <TemplateManager />
        </TabsContent>

        {/* ─── Logs ───────────────────────────────────────────────────── */}
        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Notificações</CardTitle>
              <CardDescription>
                Últimas 200 mensagens enviadas ou com falha.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {notificationLogs.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center text-muted-foreground"
                      >
                        Nenhuma notificação enviada ainda.
                      </TableCell>
                    </TableRow>
                  )}

                  {notificationLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(log.sentAt).toLocaleString('pt-BR')}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm font-medium">{log.clientName}</div>
                        {log.petName && (
                          <div className="text-xs text-muted-foreground">
                            {log.petName}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {log.manual ? 'Manual' : 'Automático'}
                        </Badge>
                      </TableCell>

                      <TableCell className="max-w-[280px]">
                        <p className="truncate text-sm" title={log.message}>
                          {log.message}
                        </p>
                      </TableCell>

                      <TableCell>
                        {log.status === 'sent' ? (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <Check className="h-3 w-3" />
                            Enviado
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-red-600">
                            <X className="h-3 w-3" />
                            Falha
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  )
}