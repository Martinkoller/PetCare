import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Settings } from 'lucide-react'
import { useConfigStore } from '@/stores/ConfigStore'
import { toast } from 'sonner'

export function DashboardSettingsDialog() {
  const { userPreferences, updateUserPreferences } = useConfigStore()

  const handleToggle = (key: keyof typeof userPreferences.dashboardAlerts) => {
    updateUserPreferences({
      dashboardAlerts: {
        ...userPreferences.dashboardAlerts,
        [key]: !userPreferences.dashboardAlerts[key],
      },
    })
    toast.success('Preferência atualizada')
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" /> Configurar Alertas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configuração do Dashboard</DialogTitle>
          <DialogDescription>
            Escolha quais alertas você deseja ver no painel principal.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="alert-stock" className="flex flex-col space-y-1">
              <span>Estoque Baixo</span>
              <span className="font-normal text-xs text-muted-foreground">
                Alertar quando produtos atingirem o estoque mínimo.
              </span>
            </Label>
            <Switch
              id="alert-stock"
              checked={userPreferences.dashboardAlerts.lowStock}
              onCheckedChange={() => handleToggle('lowStock')}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="alert-online" className="flex flex-col space-y-1">
              <span>Agendamentos Online</span>
              <span className="font-normal text-xs text-muted-foreground">
                Notificar novos agendamentos feitos pelo site.
              </span>
            </Label>
            <Switch
              id="alert-online"
              checked={userPreferences.dashboardAlerts.onlineAppointments}
              onCheckedChange={() => handleToggle('onlineAppointments')}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="alert-birthday" className="flex flex-col space-y-1">
              <span>Aniversariantes</span>
              <span className="font-normal text-xs text-muted-foreground">
                Mostrar pets que fazem aniversário hoje.
              </span>
            </Label>
            <Switch
              id="alert-birthday"
              checked={userPreferences.dashboardAlerts.birthdays}
              onCheckedChange={() => handleToggle('birthdays')}
            />
          </div>
        </div>
        <DialogFooter>
          {/* Changes are immediate via store, close button is enough */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
