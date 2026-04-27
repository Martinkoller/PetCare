import api from '@/lib/api'
import {
  HospitalizationStay,
  HospitalizationStatus,
  HospitalizationPrescription,
  HospitalizationCareTask,
  AdmitPetPayload,
  AddLogPayload,
  DischargePayload,
  CreatePrescriptionPayload,
  ExecuteCareTaskPayload,
} from '@/lib/types'

// Prescriptions e tasks ficam apenas no estado local (sem backend ainda)
const PRESCRIPTIONS_KEY = 'agiliipet_hospitalization_prescriptions'

function loadPrescriptions(): Record<string, HospitalizationPrescription[]> {
  try {
    const raw = localStorage.getItem(PRESCRIPTIONS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function savePrescriptions(data: Record<string, HospitalizationPrescription[]>) {
  localStorage.setItem(PRESCRIPTIONS_KEY, JSON.stringify(data))
}

function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function getFrequencyHours(
  frequency: CreatePrescriptionPayload['frequency'],
  customFrequencyHours?: number
) {
  switch (frequency) {
    case 'q4h': return 4
    case 'q6h': return 6
    case 'q8h': return 8
    case 'q12h': return 12
    case 'q24h': return 24
    case 'custom': return customFrequencyHours || 0
    default: return 0
  }
}

function generateTasks(
  stayId: string,
  prescriptionId: string,
  payload: CreatePrescriptionPayload
): HospitalizationCareTask[] {
  const start = new Date(payload.startAt)
  const end = payload.endAt ? new Date(payload.endAt) : null
  const hours = getFrequencyHours(payload.frequency, payload.customFrequencyHours)

  if (payload.frequency === 'once' || hours === 0) {
    return [{ id: generateId('task'), prescriptionId, stayId, scheduledFor: start.toISOString(), status: 'pending' }]
  }

  const tasks: HospitalizationCareTask[] = []
  const cursor = new Date(start)
  let limit = 0

  while (limit < 50) {
    if (end && cursor.getTime() > end.getTime()) break
    tasks.push({ id: generateId('task'), prescriptionId, stayId, scheduledFor: cursor.toISOString(), status: 'pending' })
    cursor.setHours(cursor.getHours() + hours)
    limit += 1
    if (!end && limit >= 8) break
  }

  return tasks
}

function mergePrescriptions(stay: HospitalizationStay): HospitalizationStay {
  const all = loadPrescriptions()
  const prescriptions = (all[stay.id] || []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  return { ...stay, prescriptions }
}

export const hospitalizationService = {
  async getStays(): Promise<HospitalizationStay[]> {
    const response = await api.get<HospitalizationStay[]>('/hospitalization/stays')
    return response.data.map(mergePrescriptions)
  },

  async admitPet(payload: AdmitPetPayload & { pet?: HospitalizationStay['pet'] }): Promise<HospitalizationStay> {
    if (!payload.kennelNumber?.trim()) {
      throw new Error('O leito é obrigatório para iniciar a internação.')
    }
    const response = await api.post<HospitalizationStay>('/hospitalization/stays', payload)
    return mergePrescriptions(response.data)
  },

  async addLog(stayId: string, payload: AddLogPayload): Promise<HospitalizationStay> {
    const response = await api.post<HospitalizationStay>(`/hospitalization/stays/${stayId}/logs`, payload)
    return mergePrescriptions(response.data)
  },

  async createPrescription(stayId: string, payload: CreatePrescriptionPayload): Promise<HospitalizationStay> {
    const all = loadPrescriptions()
    const existing = all[stayId] || []
    const now = new Date().toISOString()
    const prescriptionId = generateId('rx')

    const prescription: HospitalizationPrescription = {
      id: prescriptionId,
      stayId,
      petId: payload.petId,
      type: payload.type,
      title: payload.title,
      instructions: payload.instructions,
      frequency: payload.frequency,
      customFrequencyHours: payload.customFrequencyHours,
      startAt: payload.startAt,
      endAt: payload.endAt,
      quantity: payload.quantity,
      route: payload.route,
      active: true,
      createdAt: now,
      createdByName: payload.createdByName,
      tasks: generateTasks(stayId, prescriptionId, payload),
    }

    all[stayId] = [prescription, ...existing]
    savePrescriptions(all)

    // Busca stay atualizado da API e mescla prescrições locais
    const response = await api.get<HospitalizationStay[]>('/hospitalization/stays')
    const stay = response.data.find((s) => s.id === stayId)
    if (!stay) throw new Error('Internação não encontrada.')
    return mergePrescriptions(stay)
  },

  async executeCareTask(stayId: string, payload: ExecuteCareTaskPayload): Promise<HospitalizationStay> {
    const all = loadPrescriptions()
    const prescriptions = all[stayId] || []
    let found = false

    const updated = prescriptions.map((prescription) => {
      const updatedTasks = prescription.tasks.map((task) => {
        if (task.id !== payload.taskId) return task
        found = true
        return {
          ...task,
          status: 'done' as const,
          executedAt: new Date().toISOString(),
          executedByName: payload.executedByName,
          notes: payload.notes,
        }
      })
      return { ...prescription, tasks: updatedTasks }
    })

    if (!found) throw new Error('Tarefa assistencial não encontrada.')

    all[stayId] = updated
    savePrescriptions(all)

    const response = await api.get<HospitalizationStay[]>('/hospitalization/stays')
    const stay = response.data.find((s) => s.id === stayId)
    if (!stay) throw new Error('Internação não encontrada.')
    return mergePrescriptions(stay)
  },

  async dischargeStay(stayId: string, payload: DischargePayload): Promise<HospitalizationStay> {
    const response = await api.patch<HospitalizationStay>(`/hospitalization/stays/${stayId}/discharge`, payload)
    return mergePrescriptions(response.data)
  },

  async updateStayStatus(stayId: string, status: HospitalizationStatus): Promise<HospitalizationStay> {
    const response = await api.patch<HospitalizationStay>(`/hospitalization/stays/${stayId}/status`, { status })
    return mergePrescriptions(response.data)
  },
}
