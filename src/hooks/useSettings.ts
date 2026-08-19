/**
 * Godabaya Tailor — Settings Hook
 */

import { useCallback } from 'react';
import { useDatabase } from '@/database/provider';

export function useSettings() {
  const { db } = useDatabase();

  const getSetting = useCallback(async (key: string): Promise<string> => {
    if (!db) return '';
    const result = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?', [key]
    );
    return result?.value ?? '';
  }, [db]);

  const updateSetting = useCallback(async (key: string, value: string): Promise<void> => {
    if (!db) return;
    await db.runAsync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [key, value]
    );
  }, [db]);

  const getAllSettings = useCallback(async (): Promise<Record<string, string>> => {
    if (!db) return {};
    const results = await db.getAllAsync<{ key: string; value: string }>(
      'SELECT * FROM settings'
    );
    const settings: Record<string, string> = {};
    results.forEach((r) => { settings[r.key] = r.value; });
    return settings;
  }, [db]);

  return { getSetting, updateSetting, getAllSettings };
}
