import api from '@/lib/api'
import { BoardingStay, BoardingServiceItem } from '@/lib/types'

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
}
