import api from '@/lib/api'
import { ClientInteraction } from '@/lib/types'

export const clientInteractionService = {
  async getInteractions(clientId: string) {
    const response = await api.get<ClientInteraction[]>(`/api/clients/${clientId}/interactions`)
    return response.data
  },

  async createInteraction(clientId: string, interaction: Partial<ClientInteraction>) {
    const response = await api.post<ClientInteraction>(`/api/clients/${clientId}/interactions`, interaction)
    return response.data
  },

  async updateInteraction(id: string, interaction: Partial<ClientInteraction>) {
    const response = await api.put<ClientInteraction>(`/api/interactions/${id}`, interaction)
    return response.data
  },

  async deleteInteraction(id: string) {
    await api.delete(`/api/interactions/${id}`)
  }
}
