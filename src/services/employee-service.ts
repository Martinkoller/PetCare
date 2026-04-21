import api from '@/lib/api'
import { Profile } from '@/lib/types'

type EmployeePayload = {
  name: string
  email: string
  role: string
  phone?: string
  color?: string
}

export const employeeService = {
  async getAll(): Promise<Profile[]> {
    const { data } = await api.get('/professionals')
    return (data ?? []).map((u: any) => ({
      id: u.id,
      name: u.name ?? '',
      email: u.email ?? '',
      role: u.role ?? 'attendant',
      phone: u.phone ?? undefined,
      color: u.organizationId ?? undefined,
    }))
  },

  async create(payload: EmployeePayload): Promise<Profile> {
    const { data } = await api.post('/professionals', {
      name: payload.name,
      email: payload.email,
      role: payload.role,
      phone: payload.phone,
      color: payload.color,
    })
    return { id: data.id, name: data.name, email: data.email, phone: data.phone, role: data.role, color: data.organizationId }
  },

  async update(id: string, payload: Partial<EmployeePayload>): Promise<Profile> {
    const { data } = await api.put(`/professionals/${id}`, {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.email !== undefined ? { email: payload.email } : {}),
      ...(payload.role !== undefined ? { role: payload.role } : {}),
      ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
      ...(payload.color !== undefined ? { color: payload.color } : {}),
    })
    return { id: data.id, name: data.name, email: data.email, phone: data.phone, role: data.role, color: data.organizationId }
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/professionals/${id}`)
  },
}
