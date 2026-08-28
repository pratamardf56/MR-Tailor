/**
 * Godabaya Tailor — Notifications Hook
 *
 * Data notifikasi melalui backend REST bersama (server/index.js).
 */

import { useCallback } from 'react';
import { AppNotification } from '@/types';
import { apiRequest, ApiRole } from '@/utils/api';

export function useNotifications() {
  const getNotifications = useCallback(async (target: 'customer' | 'tailor'): Promise<AppNotification[]> => {
    try {
      const res = await apiRequest<{ notifications: AppNotification[] }>(
        `/api/notifications?target=${target}`,
        { role: target as ApiRole }
      );
      return res.notifications ?? [];
    } catch {
      return [];
    }
  }, []);

  const getUnreadCount = useCallback(async (target: 'customer' | 'tailor'): Promise<number> => {
    try {
      const res = await apiRequest<{ count: number }>(
        `/api/notifications/unread?target=${target}`,
        { role: target as ApiRole }
      );
      return res.count ?? 0;
    } catch {
      return 0;
    }
  }, []);

  const markAsRead = useCallback(async (id: number): Promise<void> => {
    await apiRequest(`/api/notifications/${id}/read`, { method: 'POST' });
  }, []);

  const markAllAsRead = useCallback(async (target: 'customer' | 'tailor'): Promise<void> => {
    await apiRequest('/api/notifications/read-all', {
      method: 'POST',
      role: target as ApiRole,
      body: { target },
    });
  }, []);

  return { getNotifications, getUnreadCount, markAsRead, markAllAsRead };
}
