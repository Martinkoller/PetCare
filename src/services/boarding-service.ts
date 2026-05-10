import api from '@/lib/api'
import { BoardingStay, BoardingServiceItem, Kennel } from '@/lib/types'

export const boardingService = {
  async getBoardings() {
    const response = await api.get<BoardingStay[]>('/boardings')
    return response.data
  },

  async createBoarding(stay: BoardingStay) {
    const response = await api.post<BoardingStay>('/boardings', stay)
    return response.data
  },

  async updateBoarding(stay: BoardingStay) {
    const response = await api.put<BoardingStay>(`/boardings/${stay.id}`, stay)
    return response.data
  },

  async deleteBoarding(id: string) {
    await api.delete(`/boardings/${id}`)
  },

  async addBoardingService(item: Omit<BoardingServiceItem, 'id' | 'createdAt'>) {
    const response = await api.post<BoardingServiceItem>(`/boardings/${item.boardingId}/services`, item)
    return response.data
  },

  async getKennels() {
    const response = await api.get<Kennel[]>('/kennels')
    return response.data
  },

  async createKennel(kennel: Omit<Kennel, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) {
    const response = await api.post<Kennel>('/kennels', kennel)
    return response.data
  },

  async updateKennel(kennel: Kennel) {
    const response = await api.put<Kennel>(`/kennels/${kennel.id}`, kennel)
    return response.data
  },

  async deleteKennel(id: string) {
    await api.delete(`/kennels/${id}`)
  },

  async getDailyLogs(boardingId: string) {
    const response = await api.get<any[]>(`/boardings/${boardingId}/logs`)
    return response.data
  },

  async createDailyLog(boardingId: string, log: any) {
    const response = await api.post<any>(`/boardings/${boardingId}/logs`, log)
    return response.data
  },

  async updateDailyLog(id: string, log: any) {
    const response = await api.put<any>(`/boardings/logs/${id}`, log)
    return response.data
  },

  async deleteDailyLog(id: string) {
    await api.delete(`/boardings/logs/${id}`)
  },
}
