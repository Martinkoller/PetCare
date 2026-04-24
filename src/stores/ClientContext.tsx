import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from 'react'
import { Client } from '@/lib/types'
import { clientService } from '@/services/client-service'
import { toast } from 'sonner'

interface ClientContextType {
    clients: Client[]
    setClients: React.Dispatch<React.SetStateAction<Client[]>>
    addClient: (client: Omit<Client, 'id'>) => Promise<Client>
    updateClient: (client: Client) => Promise<Client>
    deleteClient: (id: string) => Promise<void>
    loadClients: () => Promise<void>
}

const ClientContext = createContext<ClientContextType | undefined>(undefined)

export function ClientProvider({ children }: { children: ReactNode }) {
    const [clients, setClients] = useState<Client[]>([])

    const loadClients = useCallback(async () => {
        try {
            const fetchedClients = await clientService.getClients()
            setClients(fetchedClients)
        } catch (error) {
            toast.error('Erro ao carregar clientes.')
        }
    }, [])

    const addClient = useCallback(async (client: Omit<Client, 'id'>) => {
        try {
            const newClient = await clientService.createClient(client)
            setClients((prev) => [newClient, ...prev])
            return newClient
        } catch (e) {
            toast.error('Erro ao criar cliente')
            throw e
        }
    }, [])

    const updateClient = useCallback(async (client: Client) => {
        try {
            const updated = await clientService.updateClient(client)
            setClients((prev) => prev.map((c) => (c.id === client.id ? updated : c)))
            return updated
        } catch (e) {
            toast.error('Erro ao atualizar cliente')
            throw e
        }
    }, [])

    useEffect(() => {
        loadClients()
    }, [loadClients])

    const deleteClient = useCallback(async (id: string) => {
        try {
            await clientService.deleteClient(id)
            setClients((prev) => prev.filter((c) => c.id !== id))
        } catch (e) {
            toast.error('Erro ao excluir cliente')
            throw e
        }
    }, [])

    return (
        <ClientContext.Provider
            value={{
                clients,
                setClients,
                addClient,
                updateClient,
                deleteClient,
                loadClients,
            }}
        >
            {children}
        </ClientContext.Provider>
    )
}

export function useClientStore() {
    const context = useContext(ClientContext)
    if (context === undefined) {
        throw new Error('useClientStore must be used within a ClientProvider')
    }
    return context
}
