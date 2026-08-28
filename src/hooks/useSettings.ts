/**
 * Godabaya Tailor — Settings Hook
 *
 * Data pengaturan bisnis melalui backend REST bersama (server/index.js).
 */

import { useCallback } from 'react';
import { apiRequest } from '@/utils/api';

export function useSettings() {
  const getSetting = useCallback(async (key: string): Promise<string> => {
    try {
      const res = await apiRequest<{ value: string }>(`/api/settings/${encodeURIComponent(key)}`);
      return res.value ?? '';
    } catch {
      return '';
    }
  }, []);

  const updateSetting = useCallback(async (key: string, value: string): Promise<void> => {
    await apiRequest('/api/settings', { method: 'POST', body: { key, value } });
  }, []);

  const getAllSettings = useCallback(async (): Promise<Record<string, string>> => {
    try {
      return await apiRequest<Record<string, string>>('/api/settings');
    } catch {
      return {};
    }
  }, []);

  return { getSetting, updateSetting, getAllSettings };
}
