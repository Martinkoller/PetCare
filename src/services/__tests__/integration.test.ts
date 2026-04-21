import { describe, it, expect, vi, beforeEach } from 'vitest'
import { integrationService } from '../integration-service'
import { supabase } from '@/lib/supabase/client'

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}))

describe('integrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getIntegrations should return mapped data', async () => {
    const mockData = [
      {
        id: '1',
        user_id: 'u1',
        provider: 'google',
        calendar_email: 'test@gmail.com',
        created_at: '2023-01-01',
      },
    ]

    const mockSelect = vi
      .fn()
      .mockResolvedValue({ data: mockData, error: null })
    ;(supabase.from as any).mockReturnValue({ select: mockSelect })

    const result = await integrationService.getIntegrations()

    expect(result).toHaveLength(1)
    expect(result[0].provider).toBe('google')
    expect(result[0].calendarEmail).toBe('test@gmail.com')
  })

  it('initiateAuth should return url on success', async () => {
    const mockUrl = 'https://accounts.google.com/...'
    ;(supabase.functions.invoke as any).mockResolvedValue({
      data: { url: mockUrl },
      error: null,
    })

    const url = await integrationService.initiateAuth('google')
    expect(url).toBe(mockUrl)
  })

  it('handleAuthCallback should verify code', async () => {
    ;(supabase.functions.invoke as any).mockResolvedValue({
      data: { success: true },
      error: null,
    })

    const result = await integrationService.handleAuthCallback(
      'google',
      'auth_code',
    )
    expect(result).toEqual({ success: true })
  })

  it('syncEvent should handle success', async () => {
    const mockApt = { id: '1', serviceType: 'consultation' } as any
    ;(supabase.functions.invoke as any).mockResolvedValue({
      data: { results: [{ provider: 'google', status: 'synced' }] },
      error: null,
    })

    const result = await integrationService.syncEvent(mockApt, 'create')
    expect(result.success).toBe(true)
    expect(result.results).toHaveLength(1)
  })

  it('syncEvent should handle errors', async () => {
    const mockApt = { id: '1' } as any
    ;(supabase.functions.invoke as any).mockResolvedValue({
      data: null,
      error: { message: 'Network error' },
    })

    const result = await integrationService.syncEvent(mockApt, 'create')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })
})
