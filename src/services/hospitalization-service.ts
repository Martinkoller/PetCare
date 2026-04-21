import { HospitalizationStay, HospitalizationLog } from '@/lib/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const hospitalizationService = {
  async getStays(): Promise<HospitalizationStay[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/hospitalization/stays`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch stays');
    return response.json();
  },

  async admitPet(data: Partial<HospitalizationStay>): Promise<HospitalizationStay> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/hospitalization/stays`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to admit pet');
    return response.json();
  },

  async addLog(stayId: string, data: { petId: string; vitals?: any; notes?: string }): Promise<HospitalizationLog> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/hospitalization/stays/${stayId}/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add log');
    return response.json();
  },

  async dischargePet(id: string, data: { status: string; finalObservations: string; petId: string }): Promise<HospitalizationStay> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/hospitalization/stays/${id}/discharge`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to discharge patient');
    return response.json();
  },
};
