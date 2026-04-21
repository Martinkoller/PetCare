import api from '@/lib/api'
import { ServiceCatalogItem } from '@/lib/types'

export const serviceCatalogService = {
  async getServices() {
    const response = await api.get<ServiceCatalogItem[]>('/services')
    return response.data
  },

  async createService(service: Omit<ServiceCatalogItem, 'id'>) {
    const response = await api.post<ServiceCatalogItem>('/services', service)
    return response.data
  },

  async updateService(service: ServiceCatalogItem) {
    const response = await api.put<ServiceCatalogItem>(`/services/${service.id}`, service)
    return response.data
  },

  async toggleStatus(id: string, active: boolean) {
    await api.patch(`/services/${id}/status`, { active })
  },

  async deleteService(id: string) {
    await api.delete(`/services/${id}`)
  },
}
