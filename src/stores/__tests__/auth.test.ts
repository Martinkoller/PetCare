import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuthStore } from '../useAuthStore'
import { supabase } from '@/lib/supabase/client'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}))

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default state', async () => {
    // Note: Testing React Context hooks usually requires renderHook wrapper with Provider
    // Since we can't run tests, this is structural correctness verification.
    const { result } = renderHook(() => useAuthStore(), {
      wrapper: AuthProvider,
    })

    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(true)
  })

  it('signIn should handle success', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    const mockProfile = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
      organization_id: 'org1',
    }

    // Mock implementations
    ;(supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    // Mock profile fetch
    const mockSelect = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockReturnThis()
    const mockSingle = vi.fn().mockResolvedValue({
      data: mockProfile,
      error: null,
    })

    ;(supabase.from as any).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    })

    const { result } = renderHook(() => useAuthStore(), {
      wrapper: AuthProvider,
    })

    await act(async () => {
      const res = await result.current.signIn('test@example.com', 'password')
      expect(res.error).toBeNull()
    })

    // After state update
    // expect(result.current.user).toEqual(expect.objectContaining({ id: '123' }))
  })

  it('signIn should handle failure', async () => {
    ;(supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid credentials' },
    })

    const { result } = renderHook(() => useAuthStore(), {
      wrapper: AuthProvider,
    })

    await act(async () => {
      const res = await result.current.signIn('wrong@example.com', 'wrong')
      expect(res.error).toBeTruthy()
    })
  })
})
