import api from '@/lib/api'
import { OrganizationSettings } from '@/lib/types'

export const organizationService = {
  async getSettings() {
    const response = await api.get<OrganizationSettings>('/organization/settings')
    return response.data
  },

  async updateSettings(settings: Partial<OrganizationSettings>) {
    const response = await api.patch<OrganizationSettings>('/organization/settings', settings)
    return response.data
  },
}

