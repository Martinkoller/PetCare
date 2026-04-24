import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import NotificationsSettings from './NotificationsSettings'
import { GroomingSettings } from './GroomingSettings'
import { GeneralStatusSettings } from './GeneralStatusSettings'
import { TemplateSettings } from './TemplateSettings'
import { CalendarIntegrations } from './CalendarIntegrations'
import { TeamSettings } from './TeamSettings'
import { BusinessHoursSettings } from './BusinessHoursSettings'
import { PortalAccessSettings } from './PortalAccessSettings'

export default function AdminPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administração</h1>
          <p className="text-muted-foreground">
            Gerenciamento de equipe e configurações do sistema.
          </p>
        </div>
      </div>

      <Tabs defaultValue="team" className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="hours">Horários</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="grooming">Banho e Tosa</TabsTrigger>
          <TabsTrigger value="statuses">Status Gerais</TabsTrigger>
          <TabsTrigger value="templates">Modelos</TabsTrigger>
          <TabsTrigger value="portal">Portal Tutor</TabsTrigger>
        </TabsList>

        <TabsContent value="team">
          <TeamSettings />
        </TabsContent>

        <TabsContent value="hours">
          <BusinessHoursSettings />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsSettings />
        </TabsContent>

        <TabsContent value="integrations">
          <CalendarIntegrations />
        </TabsContent>

        <TabsContent value="grooming">
          <GroomingSettings />
        </TabsContent>

        <TabsContent value="statuses">
          <GeneralStatusSettings />
        </TabsContent>

        <TabsContent value="templates">
          <TemplateSettings />
        </TabsContent>

        <TabsContent value="portal">
          <PortalAccessSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
