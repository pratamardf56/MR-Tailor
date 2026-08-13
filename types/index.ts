/**
 * Godabaya Tailor — TypeScript Type Definitions
 */

import { BookingStatusType, ServiceCategory, PortfolioCategory } from '@/constants/config';

// ========== Service ==========
export interface Service {
  id: number;
  name: string;
  category: string;
  priceStart: number;
  description: string;
  estimation: string;
  isActive: boolean;
  createdAt: string;
}

// ========== Booking ==========
export interface Booking {
  id: number;
  code: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  description: string;
  requestedDate: string;
  proposedDate: string | null;
  referencePhoto: string | null;
  notes: string | null;
  status: BookingStatusType;
  rejectionReason: string | null;
  tailorNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ========== Portfolio ==========
export interface PortfolioItem {
  id: number;
  imageUri: string;
  category: string;
  description: string | null;
  createdAt: string;
}

// ========== Notification ==========
export type NotificationType =
  | 'booking_submitted'
  | 'booking_accepted'
  | 'date_proposed'
  | 'booking_rejected'
  | 'work_started'
  | 'work_completed'
  | 'customer_accepted_date'
  | 'new_booking';

export interface AppNotification {
  id: number;
  bookingId: number | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  target: 'customer' | 'tailor';
  createdAt: string;
}

// ========== Settings ==========
export interface Setting {
  key: string;
  value: string;
}

// ========== Form Types ==========
export interface BookingFormData {
  customerName: string;
  customerPhone: string;
  serviceType: string;
  description: string;
  requestedDate: Date;
  referencePhoto: string | null;
  notes: string;
}

// ========== Navigation Params ==========
export interface ServiceDetailParams {
  serviceId: string;
}

export interface BookingSuccessParams {
  bookingCode: string;
}

export interface OrderDetailParams {
  bookingCode: string;
}

export interface TailorBookingDetailParams {
  bookingId: string;
}
