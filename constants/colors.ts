/**
 * Godabaya Tailor — Color Palette
 * 
 * Warm, professional colors inspired by fabric, thread, and craftsmanship.
 * Deep navy for trust, warm amber/gold for craftsmanship, cream for softness.
 */

export const Colors = {
  // Primary
  primary: '#1B2A4A',        // Deep navy - trust, professionalism
  primaryLight: '#2D4A7A',   // Lighter navy
  primaryDark: '#0F1A2E',    // Darker navy

  // Accent
  accent: '#C8956C',         // Warm amber/gold - craftsmanship
  accentLight: '#E0B896',    // Lighter amber
  accentDark: '#A07550',     // Darker amber

  // Background
  background: '#FAF6F0',     // Warm cream
  backgroundAlt: '#F0EBE3',  // Slightly darker cream
  surface: '#FFFFFF',        // Card surfaces
  surfaceElevated: '#FFFFFF',

  // Text
  text: '#1A1A2E',          // Near-black
  textSecondary: '#6B7280',  // Gray
  textTertiary: '#9CA3AF',   // Light gray
  textOnPrimary: '#FFFFFF',  // White text on dark backgrounds
  textOnAccent: '#FFFFFF',   // White text on accent

  // Status
  statusPending: '#F59E0B',     // Amber - menunggu
  statusAccepted: '#10B981',    // Green - diterima
  statusInProgress: '#3B82F6',  // Blue - dikerjakan
  statusCompleted: '#8B5CF6',   // Purple - selesai
  statusPickedUp: '#6B7280',    // Gray - sudah diambil
  statusRejected: '#EF4444',    // Red - ditolak
  statusProposed: '#F97316',    // Orange - tanggal alternatif

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Border
  border: '#E5E1DB',
  borderLight: '#F0EBE3',
  borderFocus: '#C8956C',

  // Misc
  divider: '#E5E1DB',
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(27, 42, 74, 0.08)',
  
  // Tab bar
  tabActive: '#C8956C',
  tabInactive: '#9CA3AF',
  tabBarBackground: '#FFFFFF',
} as const;

export type ColorKey = keyof typeof Colors;
