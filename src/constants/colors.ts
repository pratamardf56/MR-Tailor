/**
 * Godabaya Tailor — Color Palette
 * 
 * Warm, professional colors inspired by fabric, thread, and craftsmanship.
 * Dark brown (#4A2E22) for trust & elegance, warm amber/gold for craftsmanship, cream for softness.
 */

export const Colors = {
  // Primary — Cokelat tua hangat
  primary: '#4A2E22',        // Dark brown - elegant, professional
  primaryLight: '#6B3F2E',   // Lighter brown
  primaryDark: '#2D1A12',    // Darker brown

  // Accent — Amber/gold
  accent: '#C8956C',         // Warm amber/gold - craftsmanship
  accentLight: '#E0B896',    // Lighter amber
  accentDark: '#A07550',     // Darker amber

  // Background — Cream & beige
  background: '#F5EFE6',     // Warm cream (#F5EFE6)
  backgroundAlt: '#EDE5D8',  // Slightly darker cream
  surface: '#FFFDF9',        // Card surfaces - very light cream
  surfaceElevated: '#FFFFFF',

  // Text
  text: '#2D1A12',           // Dark brown-black
  textSecondary: '#6B5C53',  // Muted brown
  textTertiary: '#A08C82',   // Light brown-gray
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
  border: '#DDD0C4',
  borderLight: '#EDE5D8',
  borderFocus: '#C8956C',

  // Misc
  divider: '#DDD0C4',
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(74, 46, 34, 0.10)',
  
  // Tab bar
  tabActive: '#4A2E22',
  tabInactive: '#A08C82',
  tabBarBackground: '#FFFDF9',
} as const;

export type ColorKey = keyof typeof Colors;
