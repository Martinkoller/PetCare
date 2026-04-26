import { useState } from 'react'
import { useBoardingStore } from '@/stores/BoardingStore'
import { useAppointmentStore } from '@/stores/AppointmentStore'
import { useConfigStore } from '@/stores/ConfigStore'
import { usePetStore } from '@/stores/PetContext'
import { useClientStore } from '@/stores/ClientContext'
import { whatsappService } from '@/services/whatsapp-service'
import { ptBR } from 'date-fns/locale'
import WhatsAppConfirmDialog from '@/components/shared/WhatsAppConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Bed,
  LogIn,
  Info,
  MessageCircle,
  Plus,
  Settings2,
  PlusCircle,
  Clock,
} from 'lucide-react'
import { format } from 'date-fns'
import { CheckInDialog, CheckOutDialog, ConfirmCheckInDialog } from './BoardingDialogs'
import { KennelManagerDialog } from './KennelManagerDialog'
import { BoardingServiceDialog } from './BoardingServiceDialog'
import { BoardingStay } from '@/lib/types'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BoardingHistory } from './BoardingHistory'
import { BoardingAnalytics } from './BoardingAnalytics'

export default function BoardingPage() {
  const {
    boardingStays,
    kennels,
    addBoardingStay,
    updateBoardingStay,
  } = useBoardingStore()
  const { pets } = usePetStore()
  const { clients } = useClientStore()
  const { refreshAppointments } = useAppointmentStore()
  const { sendManualNotification, sendAutoNotification, notificationSettings } = useConfigStore()
  const [isCheckInOpen, setIsCheckInOpen] = useState(false)
  const [pendingWA, setPendingWA] = useState<{ clientId: string; clientName: string; petName: string; phone?: string; message: string } | null>(null)
  const [isManagerOpen, setIsManagerOpen] = useState(false)
  const [checkOutStay, setCheckOutStay] = useState<BoardingStay | null>(null)
  const [confirmCheckInStay, setConfirmCheckInStay] = useState<BoardingStay | null>(null)
  const [serviceDialogStay, setServiceDialogStay] =
    useState<BoardingStay | null>(null)

  const activeStays = boardingStays.filter((b) => b.status === 'active')
  const pendingStays = boardingStays.filter((b) => b.status === 'reserved')

  const getPet = (id: string) => pets.find((p) => p.id === id)

  const boardingVars = (stay: BoardingStay) => {
    const pet = getPet(stay.petId)
    const client = clients.find((c) => c.id === pet?.clientId)
    if (!pet || !client) return null
    return {
      pet,
      client,
      vars: {
        client_name: client.name,
        pet_name: pet.name,
        checkin_date: format(new Date(stay.checkIn), 'dd/MM/yyyy', { locale: ptBR }),
        checkout_date: format(new Date(stay.checkOut), 'dd/MM/yyyy', { locale: ptBR }),
        service_type: 'Hospedagem',
      },
    }
  }

  const handleCheckIn = async (stay: BoardingStay) => {
    await addBoardingStay(stay)
    refreshAppointments()
    toast.success('Check-in realizado com sucesso!')
  }

  const handleCheckOut = async (stay: BoardingStay) => {
    await updateBoardingStay(stay)
    refreshAppointments()
    setCheckOutStay(null)
    toast.success('Check-out realizado com sucesso!')
    const data = boardingVars(stay)
    if (data) {
      sendAutoNotification({
        type: 'hospedagem_checkout',
        clientId: data.client.id,
        clientName: data.client.name,
        petName: data.pet.name,
        phone: data.client.phone,
        vars: data.vars,
      })
    }
  }

  const handleConfirmCheckIn = (stay: BoardingStay) => {
    const data = boardingVars(stay)
    if (data) {
      sendAutoNotification({
        type: 'hospedagem_checkin',
        clientId: data.client.id,
        clientName: data.client.name,
        petName: data.pet.name,
        phone: data.client.phone,
        vars: data.vars,
      })
    }
  }

  const handleWhatsApp = (petId: string) => {
    const pet = getPet(petId)
    const client = clients.find((c) => c.id === pet?.clientId)
    if (pet && client) {
      const stay = boardingStays.find((s) => s.petId === petId && s.status === 'active')
      const vars = stay
        ? {
            client_name: client.name,
            pet_name: pet.name,
            checkin_date: format(new Date(stay.checkIn), 'dd/MM/yyyy', { locale: ptBR }),
            checkout_date: format(new Date(stay.checkOut), 'dd/MM/yyyy', { locale: ptBR }),
            service_type: 'Hospedagem',
          }
        : { client_name: client.name, pet_name: pet.name, service_type: 'Hospedagem', checkin_date: '', checkout_date: '' }
      const template = notificationSettings.templates.find(
        (t) => t.type === 'hospedagem_personalizado' && t.active,
      )
      const message = template ? whatsappService.interpolate(template.content, vars) : ''
      setPendingWA({ clientId: client.id, clientName: client.name, petName: pet.name, phone: client.phone, message })
    }
  }

  const handleConfirmWA = (message: string) => {
    if (!pendingWA) return
    sendManualNotification(
      pendingWA.clientId,
      pendingWA.clientName,
      message,
      'hospedagem_personalizado',
      pendingWA.petName,
      pendingWA.phone,
    )
    setPendingWA(null)
  }

  const getKennelStatusColor = (
    kennelId: string,
    stay?: BoardingStay,
    isMaintenance?: boolean,
  ) => {
    if (isMaintenance) return 'bg-gray-200 border-gray-300 opacity-70'
    if (stay) return 'bg-orange-50 border-orange-200'
    return 'bg-background border-dashed border-gray-200 hover:border-orange-200 hover:bg-orange-50/50'
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setIsManagerOpen(true)}>
          <Settings2 className="mr-2 h-4 w-4" /> Gerenciar Canis
        </Button>
      </div>

      <Tabs defaultValue="map" className="space-y-6">
        <TabsList>
          <TabsTrigger value="map">Mapa de Canis</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="analytics">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-6">
          {/* Pets aguardando check-in */}
          {pendingStays.length > 0 && (
            <Card className="border-orange-200 bg-orange-50/40">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-orange-800 text-base">
                  <Clock className="h-4 w-4" />
                  Aguardando Check-in ({pendingStays.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingStays.map((stay) => {
                    const pet = pets.find((p) => p.id === stay.petId)
                    const client = pet ? clients.find((c) => c.id === pet.clientId) : null
                    return (
                      <div
                        key={stay.id}
                        className="flex items-center justify-between bg-white rounded-lg border border-orange-100 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={pet?.avatar} />
                            <AvatarFallback>{pet?.name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{pet?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {client?.name} · Previsto: {format(new Date(stay.checkIn), 'dd/MM/yyyy')}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                          onClick={() => setConfirmCheckInStay(stay)}
                        >
                          <LogIn className="h-3.5 w-3.5 mr-1.5" /> Fazer Check-in
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Room Grid */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Mapa de Ocupação</CardTitle>
              </CardHeader>
              <CardContent>
                {kennels.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                    Nenhum canil cadastrado. Use "Gerenciar Canis" para
                    adicionar.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {kennels.map((kennel) => {
                      const stay = activeStays.find(
                        (s) => s.kennelNumber === kennel.id,
                      )
                      const pet = stay
                        ? pets.find((p) => p.id === stay.petId)
                        : null
                      const isMaintenance = kennel.status === 'maintenance'

                      return (
                        <div
                          key={kennel.id}
                          className={`relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-2 text-center transition-all group ${getKennelStatusColor(kennel.id, stay, isMaintenance)}`}
                        >
                          <div className="absolute top-2 left-2 text-xs font-mono text-muted-foreground">
                            {kennel.name}
                          </div>
                          {isMaintenance ? (
                            <div className="text-xs text-muted-foreground font-medium flex flex-col items-center">
                              <Settings2 className="h-5 w-5 mb-1 opacity-50" />
                              Manutenção
                            </div>
                          ) : stay && pet ? (
                            <>
                              <Avatar className="w-10 h-10 mb-2 ring-2 ring-white">
                                <AvatarImage src={pet.avatar} />
                                <AvatarFallback>{pet.name[0]}</AvatarFallback>
                              </Avatar>
                              <p className="font-bold text-sm truncate w-full">
                                {pet.name}
                              </p>
                              <p className="text-[10px] text-orange-700 font-medium">
                                Até {format(new Date(stay.checkOut), 'dd/MM')}
                              </p>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="absolute bottom-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-green-100 text-green-700 hover:bg-green-200"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleWhatsApp(pet.id)
                                }}
                              >
                                <MessageCircle className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <div className="text-gray-300">
                              <Bed className="h-6 w-6 mx-auto mb-1" />
                              <span className="text-xs">Livre</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hóspedes Atuais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeStays.length === 0 && (
                    <p className="text-muted-foreground text-sm py-4 text-center">
                      Nenhum pet hospedado no momento.
                    </p>
                  )}
                  {activeStays.map((stay) => {
                    const pet = pets.find((p) => p.id === stay.petId)
                    const kennel = kennels.find(
                      (k) => k.id === stay.kennelNumber,
                    )
                    return (
                      <div
                        key={stay.id}
                        className="flex flex-col gap-2 border-b last:border-0 pb-3 last:pb-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={pet?.avatar} />
                              <AvatarFallback>{pet?.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{pet?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {kennel
                                  ? kennel.name
                                  : `Canil ${stay.kennelNumber}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => setServiceDialogStay(stay)}
                              title="Adicionar Serviço"
                            >
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-orange-600 border-orange-200 hover:bg-orange-50"
                              onClick={() => setCheckOutStay(stay)}
                            >
                              Check-out
                            </Button>
                          </div>
                        </div>
                        {stay.specialInstructions && (
                          <div className="flex items-start gap-1.5 text-xs text-blue-600 bg-blue-50 p-1.5 rounded">
                            <Info className="w-3 h-3 mt-0.5 shrink-0" />
                            <div
                              className="prose prose-sm max-w-none text-blue-600"
                              dangerouslySetInnerHTML={{
                                __html: stay.specialInstructions,
                              }}
                            />
                          </div>
                        )}
                        {stay.services && stay.services.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {stay.services.map((s) => (
                              <span
                                key={s.id}
                                className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border"
                              >
                                + {s.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-orange-900 text-lg">
                    Resumo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/50 p-3 rounded-lg text-center">
                      <span className="block text-2xl font-bold text-orange-700">
                        {activeStays.length}
                      </span>
                      <span className="text-xs text-orange-900/60 font-medium">
                        Ocupados
                      </span>
                    </div>
                    <div className="bg-white/50 p-3 rounded-lg text-center">
                      <span className="block text-2xl font-bold text-gray-600">
                        {Math.max(
                          0,
                          kennels.filter((k) => k.status === 'available')
                            .length - activeStays.length,
                        )}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        Livres
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <BoardingHistory />
        </TabsContent>

        <TabsContent value="analytics">
          <BoardingAnalytics />
        </TabsContent>
      </Tabs>

      <CheckInDialog
        open={isCheckInOpen}
        onOpenChange={setIsCheckInOpen}
        onSave={handleCheckIn}
        pets={pets}
        existingStays={boardingStays}
        kennels={kennels}
      />

      <KennelManagerDialog
        open={isManagerOpen}
        onOpenChange={setIsManagerOpen}
      />

      {checkOutStay && (
        <CheckOutDialog
          open={!!checkOutStay}
          onOpenChange={(open) => !open && setCheckOutStay(null)}
          onSave={handleCheckOut}
          stay={checkOutStay}
          petName={getPet(checkOutStay.petId)?.name || 'Pet'}
        />
      )}

      {serviceDialogStay && (
        <BoardingServiceDialog
          open={!!serviceDialogStay}
          onOpenChange={(open) => !open && setServiceDialogStay(null)}
          stay={serviceDialogStay}
        />
      )}

      {confirmCheckInStay && (
        <ConfirmCheckInDialog
          open={!!confirmCheckInStay}
          onOpenChange={(open) => { if (!open) setConfirmCheckInStay(null) }}
          stay={confirmCheckInStay}
          petName={getPet(confirmCheckInStay.petId)?.name || 'Pet'}
          onConfirmed={handleConfirmCheckIn}
        />
      )}

      <WhatsAppConfirmDialog
        open={!!pendingWA}
        onOpenChange={(open) => { if (!open) setPendingWA(null) }}
        clientName={pendingWA?.clientName ?? ''}
        petName={pendingWA?.petName}
        defaultMessage={pendingWA?.message ?? ''}
        onConfirm={handleConfirmWA}
      />

      <button
        type="button"
        onClick={() => setIsCheckInOpen(true)}
        title="Novo Check-in"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-orange-600 hover:shadow-xl active:scale-95"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  )
}
