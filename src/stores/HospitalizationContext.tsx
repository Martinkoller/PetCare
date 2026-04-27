import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { toast } from 'sonner'
import {
  HospitalizationStay,
  HospitalizationStatus,
  AdmitPetPayload,
  AddLogPayload,
  DischargePayload,
  CreatePrescriptionPayload,
  ExecuteCareTaskPayload,
} from '@/lib/types'
import { hospitalizationService } from '@/services/hospitalization-service'
import { usePetStore } from '@/stores/PetContext'

interface HospitalizationContextData {
  stays: HospitalizationStay[]
  loading: boolean

  fetchStays: () => Promise<void>
  admitPet: (payload: AdmitPetPayload) => Promise<void>
  addLog: (stayId: string, payload: AddLogPayload) => Promise<void>
  createPrescription: (stayId: string, payload: CreatePrescriptionPayload) => Promise<void>
  executeCareTask: (stayId: string, payload: ExecuteCareTaskPayload) => Promise<void>
  dischargeStay: (stayId: string, payload: DischargePayload) => Promise<void>
  updateStayStatus: (stayId: string, status: HospitalizationStatus) => Promise<void>
}

const HospitalizationContext = createContext<HospitalizationContextData | undefined>(undefined)

interface HospitalizationProviderProps {
  children: ReactNode
}

export function HospitalizationProvider({ children }: HospitalizationProviderProps) {
  const [stays, setStays] = useState<HospitalizationStay[]>([])
  const [loading, setLoading] = useState(false)

  const fetchStays = async () => {
    try {
      setLoading(true)
      const data = await hospitalizationService.getStays()
      setStays(data)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar internações.')
    } finally {
      setLoading(false)
    }
  }

  const admitPet = async (payload: AdmitPetPayload) => {
    try {
      const petStore = usePetStore.getState()
      const pet = petStore.pets.find((p) => p.id === payload.petId)

      const created = await hospitalizationService.admitPet({
        ...payload,
        pet: pet
          ? {
              id: pet.id,
              name: pet.name,
              species: pet.species,
              breed: pet.breed,
              clientId: pet.clientId,
            }
          : undefined,
      })

      setStays((prev) => [created, ...prev])
      toast.success('Paciente admitido na internação com sucesso.')
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : 'Erro ao admitir paciente.'
      toast.error(message)
      throw error
    }
  }

  const addLog = async (stayId: string, payload: AddLogPayload) => {
    try {
      const updated = await hospitalizationService.addLog(stayId, payload)

      setStays((prev) =>
        prev.map((stay) => (stay.id === stayId ? updated : stay))
      )

      toast.success('Evolução registrada com sucesso.')
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : 'Erro ao registrar evolução.'
      toast.error(message)
      throw error
    }
  }

  const createPrescription = async (stayId: string, payload: CreatePrescriptionPayload) => {
    try {
      const updated = await hospitalizationService.createPrescription(stayId, payload)

      setStays((prev) =>
        prev.map((stay) => (stay.id === stayId ? updated : stay))
      )

      toast.success('Prescrição criada com sucesso.')
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : 'Erro ao criar prescrição.'
      toast.error(message)
      throw error
    }
  }

  const executeCareTask = async (stayId: string, payload: ExecuteCareTaskPayload) => {
    try {
      const updated = await hospitalizationService.executeCareTask(stayId, payload)

      setStays((prev) =>
        prev.map((stay) => (stay.id === stayId ? updated : stay))
      )

      toast.success('Item assistencial registrado.')
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : 'Erro ao registrar execução.'
      toast.error(message)
      throw error
    }
  }

  const dischargeStay = async (stayId: string, payload: DischargePayload) => {
    try {
      const updated = await hospitalizationService.dischargeStay(stayId, payload)

      setStays((prev) =>
        prev.map((stay) => (stay.id === stayId ? updated : stay))
      )

      toast.success('Internação encerrada com sucesso.')
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : 'Erro ao encerrar internação.'
      toast.error(message)
      throw error
    }
  }

  const updateStayStatus = async (stayId: string, status: HospitalizationStatus) => {
    try {
      const updated = await hospitalizationService.updateStayStatus(stayId, status)

      setStays((prev) =>
        prev.map((stay) => (stay.id === stayId ? updated : stay))
      )

      toast.success('Status da internação atualizado.')
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : 'Erro ao atualizar status.'
      toast.error(message)
      throw error
    }
  }

  useEffect(() => {
    fetchStays()
  }, [])

  const value = useMemo(
    () => ({
      stays,
      loading,
      fetchStays,
      admitPet,
      addLog,
      createPrescription,
      executeCareTask,
      dischargeStay,
      updateStayStatus,
    }),
    [stays, loading]
  )

  return (
    <HospitalizationContext.Provider value={value}>
      {children}
    </HospitalizationContext.Provider>
  )
}

export function useHospitalizationStore() {
  const context = useContext(HospitalizationContext)

  if (!context) {
    throw new Error('useHospitalizationStore must be used within HospitalizationProvider')
  }

  return context
}