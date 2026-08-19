/**
 * Godabaya Tailor — Portfolio Hook
 */

import { useCallback } from 'react';
import { useDatabase } from '@/database/provider';
import { PortfolioItem } from '@/types';

export function usePortfolio() {
  const { db } = useDatabase();

  const getPortfolio = useCallback(async (category?: string): Promise<PortfolioItem[]> => {
    if (!db) return [];

    let query = 'SELECT * FROM portfolio ORDER BY created_at DESC';
    let params: any[] = [];

    if (category && category !== 'Semua') {
      query = 'SELECT * FROM portfolio WHERE category = ? ORDER BY created_at DESC';
      params = [category];
    }

    const results = await db.getAllAsync<{
      id: number; image_uri: string; category: string;
      description: string | null; created_at: string;
    }>(query, params);

    return results.map((r) => ({
      id: r.id,
      imageUri: r.image_uri,
      category: r.category,
      description: r.description,
      createdAt: r.created_at,
    }));
  }, [db]);

  const addPortfolioItem = useCallback(async (data: {
    imageUri: string; category: string; description?: string;
  }): Promise<void> => {
    if (!db) return;
    await db.runAsync(
      'INSERT INTO portfolio (image_uri, category, description) VALUES (?, ?, ?)',
      [data.imageUri, data.category, data.description || null]
    );
  }, [db]);

  const deletePortfolioItem = useCallback(async (id: number): Promise<void> => {
    if (!db) return;
    await db.runAsync('DELETE FROM portfolio WHERE id = ?', [id]);
  }, [db]);

  const updatePortfolioItem = useCallback(async (id: number, data: {
    category?: string; description?: string;
  }): Promise<void> => {
    if (!db) return;
    const fields: string[] = [];
    const values: any[] = [];

    if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }

    if (fields.length === 0) return;
    values.push(id);

    await db.runAsync(`UPDATE portfolio SET ${fields.join(', ')} WHERE id = ?`, values);
  }, [db]);

  return { getPortfolio, addPortfolioItem, deletePortfolioItem, updatePortfolioItem };
}
