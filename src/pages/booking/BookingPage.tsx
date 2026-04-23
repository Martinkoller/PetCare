import { useState } from 'react'
import { useAppointmentStore } from '@/stores/AppointmentStore'
import { useClientStore } from '@/stores/ClientContext'
import { usePetStore } from '@/stores/PetContext'
import { Appointment, Client, Pet, ServiceType } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { format, isBefore, startOfToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowRight,
  ArrowLeft,
  CalendarCheck,
  User,
  Dog,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function BookingPage() {
  const { addAppointment, appointments } = useAppointmentStore()
  const { addClient, clients } = useClientStore()
  const { addPet } = usePetStore()
  const [step, setStep] = useState(1)
  const [bookingData, setBookingData] = useState({
    serviceType: 'consultation' as ServiceType,
    date: undefined as Date | undefined,
    time: '',
    clientName: '',
    email: '',
    phone: '',
    petName: '',
    petSpecies: 'dog',
    petBreed: '',
  })
  const [confirmedDate, setConfirmedDate] = useState<string>('')

  const availableSlots = [
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
  ]

  const handleNext = () => {
    if (step === 1) {
      if (!bookingData.serviceType) {
        return toast.error('Selecione um serviço')
      }
    } else if (step === 2) {
      if (!bookingData.date || !bookingData.time) {
        return toast.error('Selecione data e hora')
      }
    } else if (step === 3) {
      if (
        !bookingData.clientName ||
        !bookingData.email ||
        !bookingData.phone ||
        !bookingData.petName ||
        !bookingData.petBreed
      ) {
        return toast.error('Preencha todos os campos')
      }
    }
    setStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setStep((prev) => prev - 1)
  }

  const handleConfirm = async () => {
    // 1. Check or Create Client
    let clientId = ''
    const existingClient = clients.find((c) => c.email === bookingData.email)

    if (existingClient) {
      clientId = existingClient.id
    } else {
      const newClient: Omit<Client, 'id'> = {
        name: bookingData.clientName,
        email: bookingData.email,
        phone: bookingData.phone,
        address: 'Registro Online',
        joinedAt: new Date().toISOString(),
        whatsappEnabled: true,
      }
      const createdClient = await addClient(newClient)
      clientId = createdClient.id
    }

    // 2. Create Pet
    const petId = Math.random().toString(36).substr(2, 9)
    const newPet: Pet = {
      id: petId,
      clientId,
      name: bookingData.petName,
      species: bookingData.petSpecies as any,
      breed: bookingData.petBreed,
      age: 0,
      weight: 0,
      gender: 'male', // Default
      medicalHistory: [],
    }
    await addPet(newPet)

    // 3. Create Appointment
    const dateTime = new Date(
      `${format(bookingData.date!, 'yyyy-MM-dd')}T${bookingData.time}`,
    )
    const appointment: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      petId,
      serviceType: bookingData.serviceType,
      date: dateTime.toISOString(),
      duration: 30, // Default duration
      status: 'scheduled',
      price:
        bookingData.serviceType === 'consultation'
          ? 150
          : bookingData.serviceType === 'grooming'
            ? 60
            : 100,
      source: 'online',
      clinicalStatus:
        bookingData.serviceType === 'consultation' ? 'waiting' : undefined,
      groomingStatus:
        bookingData.serviceType === 'grooming' ? 'waiting' : undefined,
    }

    await addAppointment(appointment)
    setConfirmedDate(dateTime.toLocaleString())
    handleNext() // Move to success step
  }

  const isSlotTaken = (timeSlot: string) => {
    if (!bookingData.date) return false
    const dateStr = format(bookingData.date, 'yyyy-MM-dd')
    return appointments.some((a) => {
      const aDate = new Date(a.date)
      return (
        format(aDate, 'yyyy-MM-dd') === dateStr &&
        format(aDate, 'HH:mm') === timeSlot &&
        a.status !== 'cancelled'
      )
    })
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-4">
        <div className="text-center space-y-2 mb-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CalendarCheck className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Agendamento Online
          </h1>
          <p className="text-muted-foreground">
            PetCare - Clínica Veterinária
          </p>
        </div>

        {step === 4 ? (
          <Card className="border-green-200 bg-green-50 animate-in zoom-in-95">
            <CardContent className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-green-800">
                Agendamento Confirmado!
              </h2>
              <p className="text-green-700 max-w-xs">
                Seu agendamento para <strong>{confirmedDate}</strong> foi
                realizado com sucesso. Enviamos os detalhes para o seu email.
              </p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Agendar Novo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Passo {step} de 3
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={cn(
                        'w-2 h-2 rounded-full',
                        step >= s ? 'bg-primary' : 'bg-muted',
                      )}
                    />
                  ))}
                </div>
              </div>
              <CardTitle>
                {step === 1 && 'Escolha o Serviço'}
                {step === 2 && 'Escolha a Data e Hora'}
                {step === 3 && 'Seus Dados'}
              </CardTitle>
              <CardDescription>
                {step === 1 && 'Qual tipo de atendimento seu pet precisa?'}
                {step === 2 && 'Selecione um horário disponível.'}
                {step === 3 &&
                  'Precisamos de algumas informações para contato.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {step === 1 && (
                <div className="grid gap-4">
                  <div
                    className={cn(
                      'p-4 border rounded-lg cursor-pointer transition-all hover:bg-muted/50 flex items-center gap-4',
                      bookingData.serviceType === 'consultation' &&
                      'border-primary bg-primary/5',
                    )}
                    onClick={() =>
                      setBookingData({
                        ...bookingData,
                        serviceType: 'consultation',
                      })
                    }
                  >
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Consulta Veterinária</h3>
                      <p className="text-sm text-muted-foreground">
                        Atendimento clínico geral para seu pet.
                      </p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'p-4 border rounded-lg cursor-pointer transition-all hover:bg-muted/50 flex items-center gap-4',
                      bookingData.serviceType === 'grooming' &&
                      'border-primary bg-primary/5',
                    )}
                    onClick={() =>
                      setBookingData({
                        ...bookingData,
                        serviceType: 'grooming',
                      })
                    }
                  >
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                      <Dog className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Banho e Tosa</h3>
                      <p className="text-sm text-muted-foreground">
                        Estética e higiene completa.
                      </p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'p-4 border rounded-lg cursor-pointer transition-all hover:bg-muted/50 flex items-center gap-4',
                      bookingData.serviceType === 'boarding' &&
                      'border-primary bg-primary/5',
                    )}
                    onClick={() =>
                      setBookingData({
                        ...bookingData,
                        serviceType: 'boarding',
                      })
                    }
                  >
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Reserva de Hospedagem</h3>
                      <p className="text-sm text-muted-foreground">
                        Diárias no nosso hotelzinho.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex justify-center border rounded-md p-4">
                    <Calendar
                      mode="single"
                      selected={bookingData.date}
                      onSelect={(d) =>
                        setBookingData({ ...bookingData, date: d, time: '' })
                      }
                      disabled={(date) =>
                        isBefore(date, startOfToday()) ||
                        date.getDay() === 0 ||
                        date.getDay() === 6
                      }
                      initialFocus
                      locale={ptBR}
                    />
                  </div>
                  {bookingData.date && (
                    <div className="space-y-2">
                      <Label>Horários Disponíveis</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {availableSlots.map((slot) => {
                          const taken = isSlotTaken(slot)
                          return (
                            <Button
                              key={slot}
                              variant={
                                bookingData.time === slot
                                  ? 'default'
                                  : 'outline'
                              }
                              className={cn(
                                'text-xs',
                                taken && 'opacity-50 cursor-not-allowed',
                              )}
                              disabled={taken}
                              onClick={() =>
                                setBookingData({ ...bookingData, time: slot })
                              }
                            >
                              {slot}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Seu Nome</Label>
                      <Input
                        id="clientName"
                        value={bookingData.clientName}
                        onChange={(e) =>
                          setBookingData({
                            ...bookingData,
                            clientName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={bookingData.phone}
                        onChange={(e) =>
                          setBookingData({
                            ...bookingData,
                            phone: e.target.value,
                          })
                        }
                        placeholder="11999999999"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={bookingData.email}
                      onChange={(e) =>
                        setBookingData({
                          ...bookingData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="petName">Nome do Pet</Label>
                        <Input
                          id="petName"
                          value={bookingData.petName}
                          onChange={(e) =>
                            setBookingData({
                              ...bookingData,
                              petName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Espécie</Label>
                        <Select
                          value={bookingData.petSpecies}
                          onValueChange={(val: any) =>
                            setBookingData({ ...bookingData, petSpecies: val })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dog">Cachorro</SelectItem>
                            <SelectItem value="cat">Gato</SelectItem>
                            <SelectItem value="bird">Pássaro</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2 mt-2">
                      <Label htmlFor="petBreed">Raça</Label>
                      <Input
                        id="petBreed"
                        value={bookingData.petBreed}
                        onChange={(e) =>
                          setBookingData({
                            ...bookingData,
                            petBreed: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              {step < 3 ? (
                <Button onClick={handleNext}>
                  Próximo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleConfirm}>Confirmar Agendamento</Button>
              )}
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
