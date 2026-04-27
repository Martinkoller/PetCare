import api from '@/lib/api'
import { Appointment } from '@/lib/types'

function safeParseArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (typeof value === 'string' && value.trim().startsWith('[')) {
    try { return JSON.parse(value) } catch { return [] }
  }
  return []
}

function normalize(apt: Appointment): Appointment {
  return {
    ...apt,
    serviceItems: safeParseArray(apt.serviceItems),
    groomingPreferences: safeParseArray(apt.groomingPreferences),
    stageHistory: safeParseArray(apt.stageHistory),
  }
}

export const appointmentService = {
  async getAppointments(start?: string, end?: string, overlap?: boolean) {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    if (overlap) params.append('overlap', 'true');
    const response = await api.get<Appointment[]>(`/appointments?${params.toString()}`)
    return (response.data ?? []).map(normalize)
  },

  async createAppointment(appointment: Appointment) {
    const response = await api.post<Appointment>('/appointments', appointment)
    return normalize(response.data)
  },

  async updateAppointment(appointment: Appointment) {
    const response = await api.put<Appointment>(`/appointments/${appointment.id}`, appointment)
    return normalize(response.data)
  },

  async deleteAppointment(id: string) {
    await api.delete(`/appointments/${id}`)
  }
}

