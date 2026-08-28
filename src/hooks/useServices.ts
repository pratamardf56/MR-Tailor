/**
 * Godabaya Tailor — Services Hook
 *
 * Data layanan/harga melalui backend REST bersama (server/index.js).
 */

import { useCallback } from 'react';
import { Service } from '@/types';
import { apiRequest } from '@/utils/api';

export function useServices() {
  const getServices = useCallback(async (activeOnly = true): Promise<Service[]> => {
    const query = activeOnly ? '' : '?active=0';
    const res = await apiRequest<{ services: Service[] }>(`/api/services${query}`);
    return res.services ?? [];
  }, []);

  const getServiceById = useCallback(async (id: number): Promise<Service | null> => {
    const res = await apiRequest<{ service: Service | null }>(`/api/services/${id}`);
    return res.service;
  }, []);

  const addService = useCallback(async (data: {
    name: string; category: string; priceStart: number; description: string; estimation: string;
  }): Promise<void> => {
    await apiRequest('/api/services', { method: 'POST', role: 'tailor', body: data });
  }, []);

  const updateService = useCallback(async (id: number, data: {
    name?: string; category?: string; priceStart?: number; description?: string; estimation?: string;
  }): Promise<void> => {
    await apiRequest(`/api/services/${id}`, { method: 'PUT', role: 'tailor', body: data });
  }, []);

  const deleteService = useCallback(async (id: number): Promise<void> => {
    await apiRequest(`/api/services/${id}`, { method: 'DELETE', role: 'tailor' });
  }, []);

  const restoreService = useCallback(async (id: number): Promise<void> => {
    await apiRequest(`/api/services/${id}/restore`, { method: 'POST', role: 'tailor' });
  }, []);

  return { getServices, getServiceById, addService, updateService, deleteService, restoreService };
}
