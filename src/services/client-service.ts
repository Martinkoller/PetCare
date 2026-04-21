import api from '@/lib/api'
import { Client } from '@/lib/types'

export const clientService = {
  async getClients() {
    const response = await api.get<Client[]>('/clients')
    // Ensure dates are strings or Date objects as expected by frontend
    return response.data
  },

  async createClient(client: Omit<Client, 'id'>) {
    const response = await api.post<Client>('/clients', client)
    return response.data
  },

  async updateClient(client: Client) {
    const response = await api.put<Client>(`/clients/${client.id}`, client)
    return response.data
  },

  async deleteClient(id: string) {
    await api.delete(`/clients/${id}`)
  }
}

