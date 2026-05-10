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
  BoardingStay,
  Kennel,
  BoardingServiceItem,
} from '@/lib/types'
import { boardingService } from '@/services/boarding-service'
import { useInventoryStore } from './InventoryStore'
import { toast } from 'sonner'

interface BoardingContextType {
  boardingStays: BoardingStay[]
  setBoardingStays: React.Dispatch<React.SetStateAction<BoardingStay[]>>
  kennels: Kennel[]
  setKennels: React.Dispatch<React.SetStateAction<Kennel[]>>
  refreshBoardings: () => Promise<void>
  refreshKennels: () => Promise<void>
  addBoardingStay: (stay: BoardingStay) => Promise<BoardingStay>
  updateBoardingStay: (stay: BoardingStay) => Promise<void>
  deleteBoardingStay: (id: string) => Promise<void>
  addBoardingService: (
    item: Omit<BoardingServiceItem, 'id' | 'createdAt'>,
  ) => Promise<void>
  addKennel: (kennel: Omit<Kennel, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateKennel: (kennel: Kennel) => Promise<void>
  deleteKennel: (id: string) => Promise<void>
}

const BoardingContext = createContext<BoardingContextType | undefined>(undefined)

export function BoardingProvider({ children }: { children: ReactNode }) {
  const [boardingStays, setBoardingStays] = useState<BoardingStay[]>([])
  const [kennels, setKennels] = useState<Kennel[]>([])

  const { registerStockMovement } = useInventoryStore()

  const loadBoardings = useCallback(async () => {
    try {
      const fetched = await boardingService.getBoardings()
      setBoardingStays(fetched)
    } catch {
      toast.error('Erro ao carregar hospedagens')
    }
  }, [])

  const loadKennels = useCallback(async () => {
    try {
      const fetched = await boardingService.getKennels()
      setKennels(fetched)
    } catch {
      toast.error('Erro ao carregar canis')
    }
  }, [])

  useEffect(() => {
    loadBoardings()
    loadKennels()
  }, [loadBoardings, loadKennels])

  const addBoardingStay = useCallback(
    async (stay: BoardingStay) => {
      try {
        const newStay = await boardingService.createBoarding(stay)
        setBoardingStays((prev) => [...prev, newStay])
        return newStay
      } catch (error) {
        
        toast.error('Erro ao registrar hospedagem.')
        throw error
      }
    },
    [],
  )

  const updateBoardingStay = useCallback(
    async (stay: BoardingStay) => {
      try {
        const updatedStay = await boardingService.updateBoarding(stay)
        setBoardingStays((prev) =>
          prev.map((b) => (b.id === stay.id ? updatedStay : b)),
        )
      } catch (error) {
        
        toast.error('Erro ao atualizar hospedagem.')
      }
    },
    [],
  )

  const deleteBoardingStay = useCallback(
    async (id: string) => {
      try {
        await boardingService.deleteBoarding(id)
        setBoardingStays((prev) => prev.filter((b) => b.id !== id))
      } catch (error) {
        
        toast.error('Erro ao excluir hospedagem.')
      }
    },
    [],
  )

  const addBoardingService = useCallback(
    async (item: Omit<BoardingServiceItem, 'id' | 'createdAt'>) => {
      try {
        const newItem = await boardingService.addBoardingService(item)
        setBoardingStays((prev) =>
          prev.map((stay) => {
            if (stay.id === item.boardingId) {
              return {
                ...stay,
                services: [...(stay.services || []), newItem],
              }
            }
            return stay
          }),
        )

        if (item.productId) {
          registerStockMovement(
            item.productId,
            item.quantity,
            'out',
            'Consumo Hospedagem',
            item.boardingId,
            item.batchId,
          )
        }

        toast.success('Servico/Produto adicionado a hospedagem')
      } catch (error) {
        
        toast.error('Erro ao adicionar servico.')
      }
    },
    [registerStockMovement],
  )

  const addKennel = useCallback(
    async (kennel: Omit<Kennel, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) => {
      try {
        const created = await boardingService.createKennel(kennel)
        setKennels((prev) => [...prev, created])
        toast.success('Canil adicionado')
      } catch {
        toast.error('Erro ao adicionar canil')
      }
    },
    [],
  )

  const updateKennel = useCallback(async (kennel: Kennel) => {
    try {
      const updated = await boardingService.updateKennel(kennel)
      setKennels((prev) => prev.map((k) => (k.id === kennel.id ? updated : k)))
    } catch {
      toast.error('Erro ao atualizar canil')
    }
  }, [])

  const deleteKennel = useCallback(async (id: string) => {
    try {
      await boardingService.deleteKennel(id)
      setKennels((prev) => prev.filter((k) => k.id !== id))
    } catch {
      toast.error('Erro ao remover canil')
    }
  }, [])

  const value = useMemo(
    () => ({
      boardingStays,
      setBoardingStays,
      kennels,
      setKennels,
      refreshBoardings: loadBoardings,
      refreshKennels: loadKennels,
      addBoardingStay,
      updateBoardingStay,
      deleteBoardingStay,
      addBoardingService,
      addKennel,
      updateKennel,
      deleteKennel,
    }),
    [
      boardingStays,
      kennels,
      loadBoardings,
      loadKennels,
      addBoardingStay,
      updateBoardingStay,
      deleteBoardingStay,
      addBoardingService,
      addKennel,
      updateKennel,
      deleteKennel,
    ],
  )

  return (
    <BoardingContext.Provider value={value}>
      {children}
    </BoardingContext.Provider>
  )
}

export function useBoardingStore() {
  const context = useContext(BoardingContext)
  if (context === undefined) {
    throw new Error('useBoardingStore must be used within an BoardingProvider')
  }
  return context
}



