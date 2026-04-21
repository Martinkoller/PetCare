import api from '@/lib/api'
import { AppointmentTemplate } from '@/lib/types'

export const templateService = {
  async getTemplates() {
    const response = await api.get<AppointmentTemplate[]>('/templates')
    return response.data
  },

  async createTemplate(template: Omit<AppointmentTemplate, 'id'>) {
    const response = await api.post<AppointmentTemplate>('/templates', template)
    return response.data
  },

  async updateTemplate(template: AppointmentTemplate) {
    const response = await api.put<AppointmentTemplate>(`/templates/${template.id}`, template)
    return response.data
  },

  async deleteTemplate(id: string) {
    await api.delete(`/templates/${id}`)
  },
}

