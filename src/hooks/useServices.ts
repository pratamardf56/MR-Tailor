/**
 * Godabaya Tailor — Services Hook
 */

import { useCallback } from 'react';
import { useDatabase } from '@/database/provider';
import { Service } from '@/types';

export function useServices() {
  const { db } = useDatabase();

  const getServices = useCallback(async (activeOnly = true): Promise<Service[]> => {
    if (!db) return [];

    const query = activeOnly
      ? 'SELECT * FROM services WHERE is_active = 1 ORDER BY id ASC'
      : 'SELECT * FROM services ORDER BY id ASC';

    const results = await db.getAllAsync<{
      id: number; name: string; category: string; price_start: number;
      description: string; estimation: string; is_active: number; created_at: string;
    }>(query);

    return results.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      priceStart: r.price_start,
      description: r.description,
      estimation: r.estimation,
      isActive: r.is_active === 1,
      createdAt: r.created_at,
    }));
  }, [db]);

  const getServiceById = useCallback(async (id: number): Promise<Service | null> => {
    if (!db) return null;

    const result = await db.getFirstAsync<{
      id: number; name: string; category: string; price_start: number;
      description: string; estimation: string; is_active: number; created_at: string;
    }>('SELECT * FROM services WHERE id = ?', [id]);

    if (!result) return null;

    return {
      id: result.id,
      name: result.name,
      category: result.category,
      priceStart: result.price_start,
      description: result.description,
      estimation: result.estimation,
      isActive: result.is_active === 1,
      createdAt: result.created_at,
    };
  }, [db]);

  const addService = useCallback(async (data: {
    name: string; category: string; priceStart: number; description: string; estimation: string;
  }): Promise<void> => {
    if (!db) return;
    await db.runAsync(
      'INSERT INTO services (name, category, price_start, description, estimation) VALUES (?, ?, ?, ?, ?)',
      [data.name, data.category, data.priceStart, data.description, data.estimation]
    );
  }, [db]);

  const updateService = useCallback(async (id: number, data: {
    name?: string; category?: string; priceStart?: number; description?: string; estimation?: string;
  }): Promise<void> => {
    if (!db) return;

    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
    if (data.priceStart !== undefined) { fields.push('price_start = ?'); values.push(data.priceStart); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.estimation !== undefined) { fields.push('estimation = ?'); values.push(data.estimation); }

    if (fields.length === 0) return;
    values.push(id);

    await db.runAsync(`UPDATE services SET ${fields.join(', ')} WHERE id = ?`, values);
  }, [db]);

  const deleteService = useCallback(async (id: number): Promise<void> => {
    if (!db) return;
    await db.runAsync('UPDATE services SET is_active = 0 WHERE id = ?', [id]);
  }, [db]);

  const restoreService = useCallback(async (id: number): Promise<void> => {
    if (!db) return;
    await db.runAsync('UPDATE services SET is_active = 1 WHERE id = ?', [id]);
  }, [db]);

  return { getServices, getServiceById, addService, updateService, deleteService, restoreService };
}
