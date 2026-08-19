/**
 * Godabaya Tailor — Booking Code Generator
 * Format: GDY-YYYY-NNNNN
 */

import { AppConfig } from '@/constants/config';

export function generateBookingCode(sequenceNumber: number): string {
  const year = new Date().getFullYear();
  const paddedNumber = String(sequenceNumber).padStart(5, '0');
  return `${AppConfig.bookingPrefix}-${year}-${paddedNumber}`;
}

export function parseBookingCode(code: string): { prefix: string; year: number; sequence: number } | null {
  const parts = code.trim().toUpperCase().split('-');
  if (parts.length !== 3) return null;
  
  const prefix = parts[0];
  const year = parseInt(parts[1], 10);
  const sequence = parseInt(parts[2], 10);
  
  if (prefix !== AppConfig.bookingPrefix || isNaN(year) || isNaN(sequence)) {
    return null;
  }
  
  return { prefix, year, sequence };
}

export function isValidBookingCode(code: string): boolean {
  return parseBookingCode(code) !== null;
}
