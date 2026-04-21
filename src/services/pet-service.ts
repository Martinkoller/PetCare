import api from '@/lib/api'
import { MedicalRecord, Pet, VaccineRecord } from '@/lib/types'

export const petService = {
  async getPets() {
    const response = await api.get<Pet[]>('/pets')
    return response.data
  },

  async createPet(pet: Omit<Pet, 'id'>) {
    const response = await api.post<Pet>('/pets', pet)
    return response.data
  },

  async updatePet(pet: Pet) {
    const response = await api.put<Pet>(`/pets/${pet.id}`, pet)
    return response.data
  },

  async deletePet(id: string) {
    await api.delete(`/pets/${id}`)
  },

  async addMedicalRecord(petId: string, record: MedicalRecord) {
    const response = await api.post<MedicalRecord>(
      `/pets/${petId}/medical-records`,
      record,
    )
    return response.data
  },

  async addVaccination(petId: string, vaccine: VaccineRecord) {
    const response = await api.post<VaccineRecord>(
      `/pets/${petId}/vaccinations`,
      vaccine,
    )
    return response.data
  },
}
