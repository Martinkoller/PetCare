import api from '@/lib/api'
import { Task } from '@/lib/types'

export const taskService = {
  async getTasks() {
    const response = await api.get<Task[]>('/tasks')
    return response.data
  },

  async createTask(task: Omit<Task, 'id' | 'createdAt'>) {
    const response = await api.post<Task>('/tasks', task)
    return response.data
  },

  async updateTask(task: Task) {
    const response = await api.put<Task>(`/tasks/${task.id}`, task)
    return response.data
  },

  async deleteTask(id: string) {
    await api.delete(`/tasks/${id}`)
  },
}
