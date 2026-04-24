import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
} from 'react'
import {
  Appointment,
  MedicalRecord,
  VaccineRecord,
  ClinicalStatus,
  GroomingStatus,
  MaterialUsed,
  ServiceCatalogItem,
} from '@/lib/types'
import { appointmentService } from '@/services/appointment-service'
import { integrationService } from '@/services/integration-service'
import { serviceCatalogService } from '@/services/service-catalog-service'
import { petService } from '@/services/pet-service'
import { usePetStore } from './PetContext'
import { useClientStore } from './ClientContext'
import { triggerNotification } from '@/services/notification-trigger'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

interface AppointmentContextType {
  appointments: Appointment[]
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>
  refreshAppointments: (start?: string, end?: string) => Promise<void>
  addAppointment: (apt: Appointment) => Promise<void>
  updateAppointment: (updatedApt: Appointment) => Promise<void>
  deleteAppointment: (id: string) => Promise<void>
  updateAppointmentStatus: (
    id: string,
    status: Appointment['status'],
    groomingStatus?: GroomingStatus,
    clinicalStatus?: ClinicalStatus,
    returnDate?: string,
  ) => void
  addMedicalRecord: (
    petId: string,
    record: MedicalRecord,
    materials?: MaterialUsed[],
  ) => Promise<void>
  addVaccination: (petId: string, vaccine: VaccineRecord) => Promise<void>
  services: ServiceCatalogItem[]
  setServices: React.Dispatch<React.SetStateAction<ServiceCatalogItem[]>>
  addService: (service: ServiceCatalogItem) => Promise<void>
  updateService: (service: ServiceCatalogItem) => Promise<void>
  deleteService: (id: string) => Promise<void>
  toggleServiceStatus: (id: string) => Promise<void>
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(
  undefined,
)

export function AppointmentProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [services, setServices] = useState<ServiceCatalogItem[]>([])
  const { pets, setPets } = usePetStore()
  const { clients } = useClientStore()

  const loadAppointmentData = useCallback(async (start?: string, end?: string) => {
    try {
      const [appointmentsData, servicesData] = await Promise.all([
        appointmentService.getAppointments(start, end),
        serviceCatalogService.getServices(),
      ])
      setAppointments(appointmentsData)
      setServices(servicesData)
    } catch (error) {
      console.error('Failed to load appointment data', error)
      toast.error('Erro ao carregar agenda e servicos.')
    }
  }, [])

  const refreshAppointments = useCallback(async (start?: string, end?: string) => {
    await loadAppointmentData(start, end);
  }, [loadAppointmentData]);

  useEffect(() => {
    loadAppointmentData()
  }, [loadAppointmentData])

  const getClient = useCallback(
    (id: string) => clients.find((c) => c.id === id),
    [clients],
  )
  const getPet = useCallback(
    (id: string) => pets.find((p) => p.id === id),
    [pets],
  )

  const addAppointment = useCallback(
    async (apt: Appointment) => {
      try {
        const newApt = await appointmentService.createAppointment(apt)
        setAppointments((prev) => [...prev, newApt])

        const pet = getPet(apt.petId)
        const client = pet ? getClient(pet.clientId) : undefined
        const aptWithDetails = {
          ...newApt,
          petName: pet?.name,
          clientName: client?.name,
        }
        integrationService.syncEvent(aptWithDetails, 'create')

        if (pet && client && newApt.status === 'scheduled') {
          const aptDate = new Date(newApt.date)
          const serviceLabel =
            newApt.serviceType === 'grooming'
              ? 'Banho e Tosa'
              : newApt.serviceType === 'consultation'
                ? 'Consulta'
                : 'Hospedagem'
          triggerNotification({
            type: 'agendamento_solicitacao',
            clientId: client.id,
            clientName: client.name,
            petName: pet.name,
            phone: client.phone,
            vars: {
              client_name: client.name,
              pet_name: pet.name,
              date: format(aptDate, 'dd/MM/yyyy', { locale: ptBR }),
              time: format(aptDate, 'HH:mm'),
              service_type: serviceLabel,
            },
          })
        }
      } catch (e: any) {
        console.error(e)
        const msg = e?.response?.data?.error || e?.message || 'Erro ao criar agendamento'
        toast.error(msg)
        throw e
      }
    },
    [getClient, getPet],
  )

  const updateAppointment = useCallback(
    async (updatedApt: Appointment) => {
      try {
        const result = await appointmentService.updateAppointment(updatedApt)
        const pet = getPet(updatedApt.petId)
        
        // Find the old appointment to see if status changed
        const oldApt = appointments.find(a => a.id === result.id)
        if (oldApt && oldApt.status !== result.status) {
          const statusLabels: Record<string, string> = {
            scheduled: 'Agendado',
            confirmed: 'Confirmado',
            in_progress: 'Em Atendimento',
            completed: 'Finalizado',
            cancelled: 'Cancelado',
            checked_in: 'Hospedado',
            checked_out: 'Encerrado'
          };
          const newLabel = statusLabels[result.status] || result.status;
          toast.success(`Status alterado para: ${newLabel}`, {
            duration: 5000,
            description: `Agendamento de ${pet?.name || 'Pet'} atualizado.`,
            className: 'text-black font-semibold',
            descriptionClassName: 'text-black opacity-100',
          });
        }

        setAppointments((prev) =>
          prev.map((a) => (a.id === result.id ? result : a)),
        )

        const client = pet ? getClient(pet.clientId) : undefined
        const aptWithDetails = {
          ...result,
          petName: pet?.name,
          clientName: client?.name,
        }
        integrationService.syncEvent(aptWithDetails, 'update')

        if (pet && client) {
          const aptDate = new Date(result.date)
          const serviceLabel =
            result.serviceType === 'grooming'
              ? 'Banho e Tosa'
              : result.serviceType === 'consultation'
                ? 'Consulta'
                : 'Hospedagem'
          const dateStr = format(aptDate, 'dd/MM/yyyy', { locale: ptBR })
          const timeStr = format(aptDate, 'HH:mm')
          const vars = {
            client_name: client.name,
            pet_name: pet.name,
            date: dateStr,
            time: timeStr,
            service_type: serviceLabel,
          }

          if (result.status === 'confirmed') {
            triggerNotification({ type: 'agendamento_confirmacao', clientId: client.id, clientName: client.name, petName: pet.name, phone: client.phone, vars })
          } else if (result.status === 'cancelled') {
            triggerNotification({ type: 'agendamento_cancelamento', clientId: client.id, clientName: client.name, petName: pet.name, phone: client.phone, vars })
          } else if (result.status === 'completed' && result.serviceType === 'consultation') {
            triggerNotification({ type: 'consulta_finalizacao', clientId: client.id, clientName: client.name, petName: pet.name, phone: client.phone, vars })
          }
        }
      } catch (e: any) {
        console.error(e)
        const msg = e?.response?.data?.error || e?.message || 'Erro ao atualizar agendamento'
        toast.error(msg)
        throw e
      }
    },
    [getClient, getPet, appointments],
  )

  const deleteAppointment = useCallback(
    async (id: string) => {
      try {
        const apt = appointments.find((a) => a.id === id)
        await appointmentService.deleteAppointment(id)
        setAppointments((prev) => prev.filter((a) => a.id !== id))

        if (apt) {
          integrationService.syncEvent(apt, 'delete')
        }

        toast.success('Agendamento excluído com sucesso.')
      } catch (_e) {
        toast.error('Erro ao excluir agendamento')
      }
    },
    [appointments],
  )

  const updateAppointmentStatus = useCallback(
    (
      id: string,
      status: Appointment['status'],
      groomingStatus?: GroomingStatus,
      clinicalStatus?: ClinicalStatus,
      returnDate?: string,
    ) => {
      const apt = appointments.find((a) => a.id === id)
      if (!apt) return

      const updatedApt = {
        ...apt,
        status,
        groomingStatus: groomingStatus || apt.groomingStatus,
        clinicalStatus: clinicalStatus || apt.clinicalStatus,
        ...(returnDate ? { returnDate } : {}),
      }

      updateAppointment(updatedApt)
    },
    [appointments, updateAppointment],
  )

  const addMedicalRecord = useCallback(
    async (petId: string, record: MedicalRecord, materials?: MaterialUsed[]) => {
      try {
        const createdRecord = await petService.addMedicalRecord(petId, {
          ...record,
          materialsUsed: materials,
        })

        const createdVaccines: VaccineRecord[] = []
        for (const vaccine of record.vaccines || []) {
          const created = await petService.addVaccination(petId, vaccine)
          createdVaccines.push(created)
        }

        setPets((prev) =>
          prev.map((pet) => {
            if (pet.id !== petId) return pet
            return {
              ...pet,
              medicalHistory: [createdRecord, ...(pet.medicalHistory || [])],
              vaccinations: [...createdVaccines, ...(pet.vaccinations || [])],
            }
          }),
        )
      } catch (error) {
        console.error(error)
        toast.error('Erro ao salvar prontuario')
      }
    },
    [setPets],
  )

  const addVaccination = useCallback(
    async (petId: string, vaccine: VaccineRecord) => {
      try {
        const created = await petService.addVaccination(petId, vaccine)
        setPets((prev) =>
          prev.map((pet) =>
            pet.id === petId
              ? { ...pet, vaccinations: [created, ...(pet.vaccinations || [])] }
              : pet,
          ),
        )
      } catch (error) {
        console.error(error)
        toast.error('Erro ao registrar vacina')
      }
    },
    [setPets],
  )

  const addService = useCallback(
    async (service: ServiceCatalogItem) => {
      try {
        const newService = await serviceCatalogService.createService(service)
        setServices((prev) => [...prev, newService])
      } catch (_e) {
        toast.error('Erro ao adicionar servico')
      }
    },
    [],
  )

  const updateService = useCallback(
    async (service: ServiceCatalogItem) => {
      try {
        const updated = await serviceCatalogService.updateService(service)
        setServices((prev) =>
          prev.map((s) => (s.id === service.id ? updated : s)),
        )
      } catch (_e) {
        toast.error('Erro ao atualizar servico')
      }
    },
    [],
  )

  const deleteService = useCallback(
    async (id: string) => {
      try {
        await serviceCatalogService.deleteService(id)
        setServices((prev) => prev.filter((s) => s.id !== id))
        toast.success('Servico excluido')
      } catch (_e) {
        toast.error('Erro ao excluir servico')
      }
    },
    [],
  )

  const toggleServiceStatus = useCallback(
    async (id: string) => {
      const service = services.find((s) => s.id === id)
      if (!service) return
      try {
        await serviceCatalogService.toggleStatus(id, !service.active)
        setServices((prev) =>
          prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)),
        )
      } catch (_e) {
        toast.error('Erro ao alterar status')
      }
    },
    [services],
  )

  const value = useMemo(
    () => ({
      appointments,
      setAppointments,
      refreshAppointments: loadAppointmentData,
      addAppointment,
      updateAppointment,
      deleteAppointment,
      updateAppointmentStatus,
      addMedicalRecord,
      addVaccination,
      services,
      setServices,
      addService,
      updateService,
      deleteService,
      toggleServiceStatus,
    }),
    [
      appointments,
      loadAppointmentData,
      addAppointment,
      updateAppointment,
      deleteAppointment,
      updateAppointmentStatus,
      addMedicalRecord,
      addVaccination,
      services,
      addService,
      updateService,
      deleteService,
      toggleServiceStatus,
    ],
  )

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  )
}

export function useAppointmentStore() {
  const context = useContext(AppointmentContext)
  if (context === undefined) {
    throw new Error(
      'useAppointmentStore must be used within an AppointmentProvider',
    )
  }
  return context
}

