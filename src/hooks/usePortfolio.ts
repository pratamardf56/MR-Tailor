/**
 * Godabaya Tailor — Portfolio Hook
 *
 * Data portofolio melalui backend REST bersama (server/index.js).
 */

import { useCallback } from 'react';
import { PortfolioItem } from '@/types';
import { apiRequest } from '@/utils/api';

export function usePortfolio() {
  const getPortfolio = useCallback(async (category?: string): Promise<PortfolioItem[]> => {
    const query = category && category !== 'Semua' ? `?category=${encodeURIComponent(category)}` : '';
    const res = await apiRequest<{ portfolio: PortfolioItem[] }>(`/api/portfolio${query}`);
    return res.portfolio ?? [];
  }, []);

  const addPortfolioItem = useCallback(async (data: {
    imageUri: string; category: string; description?: string;
  }): Promise<void> => {
    await apiRequest('/api/portfolio', {
      method: 'POST',
      role: 'tailor',
      body: { imageUri: data.imageUri, category: data.category, description: data.description ?? null },
    });
  }, []);

  const deletePortfolioItem = useCallback(async (id: number): Promise<void> => {
    await apiRequest(`/api/portfolio/${id}`, { method: 'DELETE', role: 'tailor' });
  }, []);

  const updatePortfolioItem = useCallback(async (id: number, data: {
    category?: string; description?: string;
  }): Promise<void> => {
    await apiRequest(`/api/portfolio/${id}`, { method: 'PUT', role: 'tailor', body: data });
  }, []);

  return { getPortfolio, addPortfolioItem, deletePortfolioItem, updatePortfolioItem };
}
