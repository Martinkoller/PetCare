import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from 'react'
import { Pet } from '@/lib/types'
import { petService } from '@/services/pet-service'
import { toast } from 'sonner'

interface PetContextType {
    pets: Pet[]
    setPets: React.Dispatch<React.SetStateAction<Pet[]>>
    addPet: (pet: Pet) => Promise<Pet>
    updatePet: (pet: Pet) => Promise<Pet>
    deletePet: (id: string) => Promise<void>
    loadPets: () => Promise<void>
}

const PetContext = createContext<PetContextType | undefined>(undefined)

export function PetProvider({ children }: { children: ReactNode }) {
    const [pets, setPets] = useState<Pet[]>([])

    const loadPets = useCallback(async () => {
        try {
            const fetchedPets = await petService.getPets()
            setPets(fetchedPets)
        } catch (error) {
            console.error('Failed to load pets', error)
            toast.error('Erro ao carregar pets.')
        }
    }, [])

    const addPet = useCallback(async (pet: Pet) => {
        try {
            const newPet = await petService.createPet(pet)
            setPets((prev) => {
                if (prev.some(p => p.id === newPet.id)) return prev;
                return [newPet, ...prev];
            })
            return newPet
        } catch (e) {
            toast.error('Erro ao adicionar pet')
            throw e
        }
    }, [])

    const updatePet = useCallback(async (pet: Pet) => {
        try {
            const updated = await petService.updatePet(pet)
            setPets((prev) => prev.map((p) => (p.id === pet.id ? updated : p)))
            return updated
        } catch (e) {
            toast.error('Erro ao atualizar pet')
            throw e
        }
    }, [])

    useEffect(() => {
        loadPets()
    }, [loadPets])

    const deletePet = useCallback(async (id: string) => {
        try {
            await petService.deletePet(id)
            setPets((prev) => prev.filter((p) => p.id !== id))
        } catch (e) {
            toast.error('Erro ao excluir pet')
            throw e
        }
    }, [])

    return (
        <PetContext.Provider
            value={{
                pets,
                setPets,
                addPet,
                updatePet,
                deletePet,
                loadPets,
            }}
        >
            {children}
        </PetContext.Provider>
    )
}

export function usePetStore() {
    const context = useContext(PetContext)
    if (context === undefined) {
        throw new Error('usePetStore must be used within a PetProvider')
    }
    return context
}
