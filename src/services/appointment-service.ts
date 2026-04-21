import api from '@/lib/api'
import { Appointment } from '@/lib/types'

export const appointmentService = {
  async getAppointments() {
    const response = await api.get<Appointment[]>('/appointments')
    return response.data
  },

  async createAppointment(appointment: Appointment) {
    const response = await api.post<Appointment>('/appointments', appointment)
    return response.data
  },

  async updateAppointment(appointment: Appointment) {
    const response = await api.put<Appointment>(`/appointments/${appointment.id}`, appointment)
    return response.data
  },

  async deleteAppointment(id: string) {
    await api.delete(`/appointments/${id}`)
  }
}

