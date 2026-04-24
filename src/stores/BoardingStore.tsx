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
  addBoardingStay: (stay: BoardingStay) => Promise<BoardingStay>
  updateBoardingStay: (stay: BoardingStay) => Promise<void>
  deleteBoardingStay: (id: string) => Promise<void>
  addBoardingService: (
    item: Omit<BoardingServiceItem, 'id' | 'createdAt'>,
  ) => Promise<void>
  addKennel: (kennel: Kennel) => void
  updateKennel: (kennel: Kennel) => void
  deleteKennel: (id: string) => void
}

const BoardingContext = createContext<BoardingContextType | undefined>(undefined)

const INITIAL_KENNELS: Kennel[] = Array.from({ length: 15 }, (_, i) => ({
  id: (101 + i).toString(),
  name: (101 + i).toString(),
  size: 'medium',
  status: 'available',
}))

export function BoardingProvider({ children }: { children: ReactNode }) {
  const [boardingStays, setBoardingStays] = useState<BoardingStay[]>([])
  const [kennels, setKennels] = useState<Kennel[]>(INITIAL_KENNELS)

  const { registerStockMovement } = useInventoryStore()

  const loadBoardings = useCallback(async () => {
    try {
      const fetched = await boardingService.getBoardings()
      setBoardingStays(fetched)
    } catch (error) {
      
      toast.error('Erro ao carregar hospedagens')
    }
  }, [])

  useEffect(() => {
    loadBoardings()
  }, [loadBoardings])

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

  const addKennel = useCallback((kennel: Kennel) => {
    setKennels((prev) => [...prev, kennel])
  }, [])

  const updateKennel = useCallback((kennel: Kennel) => {
    setKennels((prev) => prev.map((k) => (k.id === kennel.id ? kennel : k)))
  }, [])

  const deleteKennel = useCallback((id: string) => {
    setKennels((prev) => prev.filter((k) => k.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      boardingStays,
      setBoardingStays,
      kennels,
      setKennels,
      refreshBoardings: loadBoardings,
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



