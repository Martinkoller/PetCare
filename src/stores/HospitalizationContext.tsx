import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
} from 'react'
import { HospitalizationStay, HospitalizationLog } from '@/lib/types'
import { hospitalizationService } from '@/services/hospitalization-service'
import { toast } from 'sonner'

interface HospitalizationContextType {
  stays: HospitalizationStay[]
  loading: boolean
  fetchStays: () => Promise<void>
  admitPet: (data: Partial<HospitalizationStay>) => Promise<void>
  addLog: (stayId: string, data: { petId: string; vitals?: any; notes?: string }) => Promise<void>
  dischargePet: (id: string, data: { status: string; finalObservations: string; petId: string }) => Promise<void>
}

const HospitalizationContext = createContext<HospitalizationContextType | undefined>(undefined)

export function HospitalizationProvider({ children }: { children: ReactNode }) {
  const [stays, setStays] = useState<HospitalizationStay[]>([])
  const [loading, setLoading] = useState(false)

  const fetchStays = useCallback(async () => {
    setLoading(true)
    try {
      const data = await hospitalizationService.getStays()
      setStays(data)
    } catch (error) {
      toast.error('Erro ao carregar mapa de internação')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStays()
  }, [fetchStays])

  const admitPet = useCallback(async (data: Partial<HospitalizationStay>) => {
    try {
      const newStay = await hospitalizationService.admitPet(data)
      setStays((prev) => [newStay, ...prev])
      toast.success('Paciente admitido com sucesso!')
    } catch (error) {
      toast.error('Erro ao admitir paciente')
    }
  }, [])

  const addLog = useCallback(async (stayId: string, data: { petId: string; vitals?: any; notes?: string }) => {
    try {
      const newLog = await hospitalizationService.addLog(stayId, data)
      
      setStays((prev) => prev.map(s => {
        if (s.id === stayId) {
          return {
            ...s,
            status: 'treatment',
            logs: [newLog, ...(s.logs || [])]
          }
        }
        return s
      }))
      
      toast.success('Evolução registrada com sucesso!')
    } catch (error) {
      toast.error('Erro ao registrar evolução')
    }
  }, [])

  const dischargePet = useCallback(async (id: string, data: { status: string; finalObservations: string; petId: string }) => {
    try {
      await hospitalizationService.dischargePet(id, data)
      setStays((prev) => prev.filter(s => s.id !== id))
      toast.success('Alta médica registrada!')
    } catch (error) {
      toast.error('Erro ao processar alta médica')
    }
  }, [])

  const value = useMemo(() => ({
    stays,
    loading,
    fetchStays,
    admitPet,
    addLog,
    dischargePet
  }), [stays, loading, fetchStays, admitPet, addLog, dischargePet])

  return (
    <HospitalizationContext.Provider value={value}>
      {children}
    </HospitalizationContext.Provider>
  )
}

export function useHospitalizationStore() {
  const context = useContext(HospitalizationContext)
  if (context === undefined) {
    throw new Error('useHospitalizationStore must be used within an HospitalizationProvider')
  }
  return context
}
