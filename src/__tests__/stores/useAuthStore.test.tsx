import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuthStore } from '@/stores/useAuthStore';
import { server } from '../setup/vitest.setup';
import { http, HttpResponse } from 'msw';
import React from 'react';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

beforeEach(() => {
  localStorage.clear();
});

describe('useAuthStore — signIn', () => {
  it('faz login com credenciais válidas', async () => {
    const { result } = renderHook(() => useAuthStore(), { wrapper });

    await act(async () => {
      await result.current.signIn('admin@agilipet.local', 'admin123');
    });

    expect(result.current.user?.email).toBe('admin@agilipet.local');
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('token')).toBe('fake.jwt.token');
  });

  it('retorna erro com credenciais inválidas', async () => {
    const { result } = renderHook(() => useAuthStore(), { wrapper });

    let signInResult: any;
    await act(async () => {
      signInResult = await result.current.signIn('wrong@email.com', 'errado');
    });

    expect(signInResult.error).toBeTruthy();
    expect(result.current.user).toBeNull();
  });

  it('salva token no localStorage após login', async () => {
    const { result } = renderHook(() => useAuthStore(), { wrapper });

    await act(async () => {
      await result.current.signIn('admin@agilipet.local', 'admin123');
    });

    expect(localStorage.getItem('token')).toBe('fake.jwt.token');
  });
});

describe('useAuthStore — logout', () => {
  it('limpa user e token ao fazer logout', async () => {
    const { result } = renderHook(() => useAuthStore(), { wrapper });

    await act(async () => {
      await result.current.signIn('admin@agilipet.local', 'admin123');
    });

    expect(result.current.user).not.toBeNull();

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });
});

describe('useAuthStore — fetchProfile', () => {
  it('restaura sessão se token válido no localStorage', async () => {
    localStorage.setItem('token', 'fake.jwt.token');

    const { result } = renderHook(() => useAuthStore(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user?.email).toBe('admin@agilipet.local');
  });

  it('limpa token inválido do localStorage', async () => {
    localStorage.setItem('token', 'token.invalido');

    server.use(
      http.get('http://localhost:3000/auth/me', () =>
        HttpResponse.json({ error: 'Não autenticado.' }, { status: 401 })
      )
    );

    const { result } = renderHook(() => useAuthStore(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
