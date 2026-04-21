import { Appointment, UserIntegration } from '@/lib/types'

export interface SyncResult {
  success: boolean
  results?: Array<{ provider: string; status: string }>
  error?: any
}

export const integrationService = {
  async getIntegrations(): Promise<UserIntegration[]> {
    return []
  },

  async deleteIntegration(_provider: string): Promise<void> {
    // Mock
  },

  async initiateAuth(_provider: 'google' | 'outlook'): Promise<string | null> {
    return null
  },

  async handleAuthCallback(_provider: string, _code: string): Promise<any> {
    return {}
  },

  async syncEvent(
    appointment: Appointment,
    operation: 'create' | 'update' | 'delete',
  ): Promise<SyncResult> {
    console.log(`[Mock Integration] Syncing event: ${operation}`, appointment)
    return { success: true }
  },
}

