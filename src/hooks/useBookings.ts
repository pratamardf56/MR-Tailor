/**
 * Godabaya Tailor — Bookings Hook
 */

import { useCallback } from 'react';
import { useDatabase } from '@/database/provider';
import { Booking, BookingFormData } from '@/types';
import { BookingStatusType, BookingStatus } from '@/constants/config';
import { generateBookingCode } from '@/utils/booking-code';
import { whatsAppVariants, normalizeWhatsApp } from '@/utils/phone';
import { hashPin, randomHex } from '@/utils/pin';

export function useBookings() {
  const { db } = useDatabase();

  const getNextBookingCode = useCallback(async (): Promise<string> => {
    if (!db) throw new Error('Database not ready');

    const result = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      ['booking_counter']
    );

    const currentCount = result ? parseInt(result.value, 10) : 0;
    const nextCount = currentCount + 1;

    await db.runAsync(
      'UPDATE settings SET value = ? WHERE key = ?',
      [String(nextCount), 'booking_counter']
    );

    return generateBookingCode(nextCount);
  }, [db]);

  const createBooking = useCallback(async (data: BookingFormData): Promise<string> => {
    if (!db) throw new Error('Database not ready');

    let customerId = data.customerId;

    if (data.pin) {
      const wa = normalizeWhatsApp(data.customerPhone);
      if (!wa) throw new Error('Nomor WhatsApp tidak valid');
      
      const variants = whatsAppVariants(wa);
      const placeholders = variants.map(() => '?').join(', ');
      
      const existing = await db.getFirstAsync<{ id: number, pin_hash: string, pin_salt: string }>(
        `SELECT id, pin_hash, pin_salt FROM customers WHERE whatsapp IN (${placeholders})`,
        variants
      );

      if (existing) {
        const hash = await hashPin(data.pin, existing.pin_salt, 'godabaya-customer-pin');
        if (hash !== existing.pin_hash) {
          throw new Error('Nomor WhatsApp sudah terdaftar dengan PIN berbeda. Silakan gunakan PIN yang benar.');
        }
        customerId = existing.id;
      } else {
        const salt = randomHex(16);
        const hash = await hashPin(data.pin, salt, 'godabaya-customer-pin');
        const result = await db.runAsync(
          'INSERT INTO customers (name, whatsapp, pin_hash, pin_salt) VALUES (?, ?, ?, ?)',
          [data.customerName.trim(), wa, hash, salt]
        );
        customerId = Number(result.lastInsertRowId);

        if (variants.length > 0) {
          await db.runAsync(
            `UPDATE bookings SET customer_id = ? WHERE customer_id IS NULL AND customer_phone IN (${placeholders})`,
            [customerId, ...variants]
          );
        }
      }
    }

    const code = await getNextBookingCode();
    const requestedDate = data.requestedDate.toISOString();

    await db.runAsync(
      `INSERT INTO bookings (code, customer_id, customer_name, customer_phone, service_type, description, requested_date, reference_photo, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        customerId ?? null,
        data.customerName,
        data.customerPhone,
        data.serviceType,
        data.description,
        requestedDate,
        data.referencePhoto || null,
        data.notes || null,
        BookingStatus.PENDING,
      ]
    );

    // Create notification for tailor
    await db.runAsync(
      `INSERT INTO notifications (booking_id, type, title, message, target)
       VALUES ((SELECT id FROM bookings WHERE code = ?), 'new_booking', 'Booking Baru', ?, 'tailor')`,
      [code, `Pesanan baru dari ${data.customerName} — ${data.serviceType}`]
    );

    return code;
  }, [db, getNextBookingCode]);

  const getBookingByCode = useCallback(async (code: string): Promise<Booking | null> => {
    if (!db) return null;

    const result = await db.getFirstAsync<{
      id: number; code: string; customer_id: number | null; customer_name: string; customer_phone: string;
      service_type: string; description: string; requested_date: string;
      proposed_date: string | null; reference_photo: string | null;
      notes: string | null; status: BookingStatusType;
      rejection_reason: string | null; tailor_notes: string | null;
      created_at: string; updated_at: string;
    }>(
      'SELECT * FROM bookings WHERE code = ?',
      [code.trim().toUpperCase()]
    );

    if (!result) return null;

    return {
      id: result.id,
      code: result.code,
      customerId: result.customer_id ?? null,
      customerName: result.customer_name,
      customerPhone: result.customer_phone,
      serviceType: result.service_type,
      description: result.description,
      requestedDate: result.requested_date,
      proposedDate: result.proposed_date,
      referencePhoto: result.reference_photo,
      notes: result.notes,
      status: result.status,
      rejectionReason: result.rejection_reason,
      tailorNotes: result.tailor_notes,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  }, [db]);

  const getBookingById = useCallback(async (id: number): Promise<Booking | null> => {
    if (!db) return null;

    const result = await db.getFirstAsync<{
      id: number; code: string; customer_id: number | null; customer_name: string; customer_phone: string;
      service_type: string; description: string; requested_date: string;
      proposed_date: string | null; reference_photo: string | null;
      notes: string | null; status: BookingStatusType;
      rejection_reason: string | null; tailor_notes: string | null;
      created_at: string; updated_at: string;
    }>(
      'SELECT * FROM bookings WHERE id = ?',
      [id]
    );

    if (!result) return null;

    return {
      id: result.id,
      code: result.code,
      customerId: result.customer_id ?? null,
      customerName: result.customer_name,
      customerPhone: result.customer_phone,
      serviceType: result.service_type,
      description: result.description,
      requestedDate: result.requested_date,
      proposedDate: result.proposed_date,
      referencePhoto: result.reference_photo,
      notes: result.notes,
      status: result.status,
      rejectionReason: result.rejection_reason,
      tailorNotes: result.tailor_notes,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  }, [db]);

  const getAllBookings = useCallback(async (statusFilter?: BookingStatusType): Promise<Booking[]> => {
    if (!db) return [];

    let query = 'SELECT * FROM bookings ORDER BY created_at DESC';
    let params: any[] = [];

    if (statusFilter) {
      query = 'SELECT * FROM bookings WHERE status = ? ORDER BY created_at DESC';
      params = [statusFilter];
    }

    const results = await db.getAllAsync<{
      id: number; code: string; customer_id: number | null; customer_name: string; customer_phone: string;
      service_type: string; description: string; requested_date: string;
      proposed_date: string | null; reference_photo: string | null;
      notes: string | null; status: BookingStatusType;
      rejection_reason: string | null; tailor_notes: string | null;
      created_at: string; updated_at: string;
    }>(query, params);

    return results.map((r) => ({
      id: r.id,
      code: r.code,
      customerId: r.customer_id ?? null,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      serviceType: r.service_type,
      description: r.description,
      requestedDate: r.requested_date,
      proposedDate: r.proposed_date,
      referencePhoto: r.reference_photo,
      notes: r.notes,
      status: r.status,
      rejectionReason: r.rejection_reason,
      tailorNotes: r.tailor_notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }, [db]);

  const getBookingsByCustomer = useCallback(async (customerId: number, phone: string): Promise<Booking[]> => {
    if (!db) return [];

    const variants = whatsAppVariants(phone);
    const placeholders = variants.map(() => '?').join(', ');

    const results = await db.getAllAsync<{
      id: number; code: string; customer_id: number | null; customer_name: string; customer_phone: string;
      service_type: string; description: string; requested_date: string;
      proposed_date: string | null; reference_photo: string | null;
      notes: string | null; status: BookingStatusType;
      rejection_reason: string | null; tailor_notes: string | null;
      created_at: string; updated_at: string;
    }>(
      `SELECT * FROM bookings
       WHERE customer_id = ? OR (customer_id IS NULL AND customer_phone IN (${placeholders}))
       ORDER BY created_at DESC`,
      [customerId, ...variants]
    );

    return results.map((r) => ({
      id: r.id,
      code: r.code,
      customerId: r.customer_id ?? null,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      serviceType: r.service_type,
      description: r.description,
      requestedDate: r.requested_date,
      proposedDate: r.proposed_date,
      referencePhoto: r.reference_photo,
      notes: r.notes,
      status: r.status,
      rejectionReason: r.rejection_reason,
      tailorNotes: r.tailor_notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }, [db]);

  const acceptBooking = useCallback(async (id: number): Promise<void> => {
    if (!db) return;
    await db.runAsync(
      `UPDATE bookings SET status = ?, updated_at = datetime('now') WHERE id = ?`,
      [BookingStatus.ACCEPTED, id]
    );
    await db.runAsync(
      `INSERT INTO notifications (booking_id, type, title, message, target)
       VALUES (?, 'booking_accepted', 'Pesanan Diterima', 'Pesanan Anda telah diterima oleh penjahit.', 'customer')`,
      [id]
    );
  }, [db]);

  const proposeAlternateDate = useCallback(async (id: number, proposedDate: Date, notes?: string): Promise<void> => {
    if (!db) return;
    await db.runAsync(
      `UPDATE bookings SET status = ?, proposed_date = ?, tailor_notes = ?, updated_at = datetime('now') WHERE id = ?`,
      [BookingStatus.DATE_PROPOSED, proposedDate.toISOString(), notes || null, id]
    );
    await db.runAsync(
      `INSERT INTO notifications (booking_id, type, title, message, target)
       VALUES (?, 'date_proposed', 'Tanggal Alternatif', 'Penjahit mengusulkan tanggal lain untuk pesanan Anda.', 'customer')`,
      [id]
    );
  }, [db]);

  const customerAcceptDate = useCallback(async (id: number): Promise<void> => {
    if (!db) return;
    await db.runAsync(
      `UPDATE bookings SET status = ?, updated_at = datetime('now') WHERE id = ?`,
      [BookingStatus.ACCEPTED, id]
    );
    await db.runAsync(
      `INSERT INTO notifications (booking_id, type, title, message, target)
       VALUES (?, 'customer_accepted_date', 'Tanggal Diterima', 'Pelanggan menerima tanggal alternatif yang diusulkan.', 'tailor')`,
      [id]
    );
  }, [db]);

  const customerRejectDate = useCallback(async (id: number): Promise<void> => {
    if (!db) return;
    await db.runAsync(
      `UPDATE bookings SET status = ?, rejection_reason = 'Pelanggan menolak tanggal alternatif', updated_at = datetime('now') WHERE id = ?`,
      [BookingStatus.REJECTED, id]
    );
  }, [db]);

  const rejectBooking = useCallback(async (id: number, reason: string): Promise<void> => {
    if (!db) return;
    await db.runAsync(
      `UPDATE bookings SET status = ?, rejection_reason = ?, updated_at = datetime('now') WHERE id = ?`,
      [BookingStatus.REJECTED, reason, id]
    );
    await db.runAsync(
      `INSERT INTO notifications (booking_id, type, title, message, target)
       VALUES (?, 'booking_rejected', 'Pesanan Ditolak', ?, 'customer')`,
      [id, `Pesanan ditolak. Alasan: ${reason}`]
    );
  }, [db]);

  const updateBookingStatus = useCallback(async (id: number, status: BookingStatusType): Promise<void> => {
    if (!db) return;
    await db.runAsync(
      `UPDATE bookings SET status = ?, updated_at = datetime('now') WHERE id = ?`,
      [status, id]
    );

    let notifType = '';
    let notifTitle = '';
    let notifMessage = '';

    if (status === BookingStatus.IN_PROGRESS) {
      notifType = 'work_started';
      notifTitle = 'Pesanan Sedang Dikerjakan';
      notifMessage = 'Pesanan Anda sedang dalam proses pengerjaan.';
    } else if (status === BookingStatus.COMPLETED) {
      notifType = 'work_completed';
      notifTitle = 'Pesanan Selesai';
      notifMessage = 'Pesanan Anda telah selesai! Silakan ambil di tempat kami.';
    }

    if (notifType) {
      await db.runAsync(
        `INSERT INTO notifications (booking_id, type, title, message, target)
         VALUES (?, ?, ?, ?, 'customer')`,
        [id, notifType, notifTitle, notifMessage]
      );
    }
  }, [db]);

  const getBookingStats = useCallback(async () => {
    if (!db) return { newBookings: 0, today: 0, inProgress: 0, completed: 0, total: 0 };

    const pending = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM bookings WHERE status = ?', [BookingStatus.PENDING]
    );
    const today = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM bookings WHERE date(created_at) = date('now')"
    );
    const inProgress = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM bookings WHERE status = ?', [BookingStatus.IN_PROGRESS]
    );
    const completed = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM bookings WHERE status IN (?, ?)',
      [BookingStatus.COMPLETED, BookingStatus.PICKED_UP]
    );
    const total = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM bookings'
    );

    return {
      newBookings: pending?.count ?? 0,
      today: today?.count ?? 0,
      inProgress: inProgress?.count ?? 0,
      completed: completed?.count ?? 0,
      total: total?.count ?? 0,
    };
  }, [db]);

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
