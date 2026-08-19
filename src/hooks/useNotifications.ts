/**
 * Godabaya Tailor — Notifications Hook
 */

import { useCallback } from 'react';
import { useDatabase } from '@/database/provider';
import { AppNotification } from '@/types';

export function useNotifications() {
  const { db } = useDatabase();

  const getNotifications = useCallback(async (target: 'customer' | 'tailor'): Promise<AppNotification[]> => {
    if (!db) return [];

    const results = await db.getAllAsync<{
      id: number; booking_id: number | null; type: string; title: string;
      message: string; is_read: number; target: string; created_at: string;
    }>(
      'SELECT * FROM notifications WHERE target = ? ORDER BY created_at DESC LIMIT 50',
      [target]
    );

    return results.map((r) => ({
      id: r.id,
      bookingId: r.booking_id,
      type: r.type as AppNotification['type'],
      title: r.title,
      message: r.message,
      isRead: r.is_read === 1,
      target: r.target as 'customer' | 'tailor',
      createdAt: r.created_at,
    }));
  }, [db]);

  const getUnreadCount = useCallback(async (target: 'customer' | 'tailor'): Promise<number> => {
    if (!db) return 0;
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM notifications WHERE target = ? AND is_read = 0',
      [target]
    );
    return result?.count ?? 0;
  }, [db]);

  const markAsRead = useCallback(async (id: number): Promise<void> => {
    if (!db) return;
    await db.runAsync('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
  }, [db]);

  const markAllAsRead = useCallback(async (target: 'customer' | 'tailor'): Promise<void> => {
    if (!db) return;
    await db.runAsync('UPDATE notifications SET is_read = 1 WHERE target = ?', [target]);
  }, [db]);

  return { getNotifications, getUnreadCount, markAsRead, markAllAsRead };
}
