import api from '@/lib/api'
import { Appointment } from '@/lib/types'

export const appointmentService = {
  async getAppointments(start?: string, end?: string, overlap?: boolean) {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    if (overlap) params.append('overlap', 'true');
    const response = await api.get<Appointment[]>(`/appointments?${params.toString()}`)
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

