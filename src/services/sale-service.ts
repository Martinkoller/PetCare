import api from '@/lib/api'
import { Sale } from '@/lib/types'

export const saleService = {
  async getSales(): Promise<Sale[]> {
    const { data } = await api.get<Sale[]>('/sales')
    return data ?? []
  },

  async createSale(sale: Omit<Sale, 'id'>): Promise<Sale> {
    const { data } = await api.post<Sale>('/sales', sale)
    return data
  },

  async cancelSale(id: string): Promise<void> {
    await api.patch(`/sales/${id}/cancel`)
  },
}
