/**
 * Godabaya Tailor — Bookings Hook
 *
 * Seluruh operasi booking kini melalui backend REST bersama (server/index.js)
 * agar data pesanan dibagikan antara website customer dan aplikasi admin.
 */

import { useCallback } from 'react';
import { Booking, BookingFormData } from '@/types';
import { BookingStatusType } from '@/constants/config';
import { apiRequest } from '@/utils/api';

export function useBookings() {
  const createBooking = useCallback(async (data: BookingFormData): Promise<string> => {
    const res = await apiRequest<{ code: string }>('/api/bookings', {
      method: 'POST',
      body: {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        pin: data.pin,
        serviceType: data.serviceType,
        description: data.description,
        requestedDate: data.requestedDate.toISOString(),
        referencePhoto: data.referencePhoto,
        notes: data.notes,
      },
    });
    return res.code;
  }, []);

  const getBookingByCode = useCallback(async (code: string): Promise<Booking | null> => {
    const res = await apiRequest<{ booking: Booking | null }>(
      `/api/bookings/${encodeURIComponent(code.trim().toUpperCase())}`
    );
    return res.booking;
  }, []);

  const getBookingById = useCallback(async (id: number): Promise<Booking | null> => {
    const res = await apiRequest<{ booking: Booking | null }>(`/api/bookings/${id}`);
    return res.booking;
  }, []);

  const getAllBookings = useCallback(async (statusFilter?: BookingStatusType): Promise<Booking[]> => {
    const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
    const res = await apiRequest<{ bookings: Booking[] }>(`/api/bookings${query}`, { role: 'tailor' });
    return res.bookings ?? [];
  }, []);

  // customerId & phone dipertahankan demi kompatibilitas pemanggil;
  // backend menentukan kepemilikan berdasarkan token customer.
  const getBookingsByCustomer = useCallback(async (_customerId: number, _phone: string): Promise<Booking[]> => {
    const res = await apiRequest<{ bookings: Booking[] }>('/api/bookings/mine', { role: 'customer' });
    return res.bookings ?? [];
  }, []);

  const acceptBooking = useCallback(async (id: number): Promise<void> => {
    await apiRequest(`/api/bookings/${id}/accept`, { method: 'POST', role: 'tailor' });
  }, []);

  const proposeAlternateDate = useCallback(async (id: number, proposedDate: Date, notes?: string): Promise<void> => {
    await apiRequest(`/api/bookings/${id}/propose-date`, {
      method: 'POST',
      role: 'tailor',
      body: { proposedDate: proposedDate.toISOString(), notes: notes ?? null },
    });
  }, []);

  const customerAcceptDate = useCallback(async (id: number): Promise<void> => {
    await apiRequest(`/api/bookings/${id}/accept-date`, { method: 'POST', role: 'customer' });
  }, []);

  const customerRejectDate = useCallback(async (id: number): Promise<void> => {
    await apiRequest(`/api/bookings/${id}/reject-date`, { method: 'POST', role: 'customer' });
  }, []);

  const rejectBooking = useCallback(async (id: number, reason: string): Promise<void> => {
    await apiRequest(`/api/bookings/${id}/reject`, {
      method: 'POST',
      role: 'tailor',
      body: { reason },
    });
  }, []);

  const updateBookingStatus = useCallback(async (id: number, status: BookingStatusType): Promise<void> => {
    await apiRequest(`/api/bookings/${id}/status`, {
      method: 'POST',
      role: 'tailor',
      body: { status },
    });
  }, []);

  const getBookingStats = useCallback(async () => {
    try {
      return await apiRequest<{
        newBookings: number; today: number; inProgress: number; completed: number; total: number;
      }>('/api/bookings/stats', { role: 'tailor' });
    } catch {
      return { newBookings: 0, today: 0, inProgress: 0, completed: 0, total: 0 };
    }
  }, []);

  return {
    createBooking,
    getBookingByCode,
    getBookingById,
    getAllBookings,
    getBookingsByCustomer,
    acceptBooking,
    proposeAlternateDate,
    customerAcceptDate,
    customerRejectDate,
    rejectBooking,
    updateBookingStatus,
    getBookingStats,
  };
}
