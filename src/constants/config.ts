/**
 * Godabaya Tailor — App Configuration
 */

export const AppConfig = {
  name: 'Godabaya Tailor',
  tagline: 'Jahit & Permak Pakaian Sesuai Kebutuhan Anda',
  address: 'Jawa Barat, Majalengka, Malausma, Sukadana, Godabaya',
  addressShort: 'Sukadana, Malausma, Majalengka',
  mapsQuery: 'Jawa Barat, Majalengka, Malausma, Sukadana, Godabaya',
  
  // Default WhatsApp message
  whatsappMessage: 'Halo, saya ingin bertanya mengenai jasa jahit Godabaya Tailor.',
  
  // Booking code prefix
  bookingPrefix: 'GDY',
  
  // Default business hours
  defaultOpenHour: '08:00',
  defaultCloseHour: '17:00',
} as const;

// Service categories
export const ServiceCategories = [
  'Jahit Baju',
  'Jahit Celana',
  'Permak Baju',
  'Permak Celana',
  'Seragam',
  'Custom',
  'Lainnya',
] as const;

export type ServiceCategory = typeof ServiceCategories[number];

// Home page categories (with icons) — 4 main services for homepage display
export const HomeCategories = [
  { label: 'Jahit Pakaian', icon: 'shirt-outline' as const, category: 'Jahit Baju' as ServiceCategory, desc: 'Jahit baju pria & wanita sesuai kebutuhan' },
  { label: 'Permak Pakaian', icon: 'cut-outline' as const, category: 'Permak Baju' as ServiceCategory, desc: 'Permak celana, baju, rok, dan lainnya' },
  { label: 'Custom Pakaian', icon: 'color-palette-outline' as const, category: 'Custom' as ServiceCategory, desc: 'Buat pakaian custom sesuai desain Anda' },
  { label: 'Pengerjaan Tepat Waktu', icon: 'time-outline' as const, category: 'Lainnya' as ServiceCategory, desc: 'Kami selalu mengutamakan ketepatan waktu' },
] as const;

// All service categories for booking form
export const AllServiceCategories = [
  { label: 'Jahit Baju', icon: 'shirt-outline' as const, category: 'Jahit Baju' as ServiceCategory },
  { label: 'Jahit Celana', icon: 'cut-outline' as const, category: 'Jahit Celana' as ServiceCategory },
  { label: 'Permak', icon: 'construct-outline' as const, category: 'Permak Baju' as ServiceCategory },
  { label: 'Seragam', icon: 'people-outline' as const, category: 'Seragam' as ServiceCategory },
  { label: 'Custom', icon: 'color-palette-outline' as const, category: 'Custom' as ServiceCategory },
  { label: 'Lainnya', icon: 'ellipsis-horizontal-outline' as const, category: 'Lainnya' as ServiceCategory },
] as const;

// Booking statuses
export const BookingStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DATE_PROPOSED: 'date_proposed',
  REJECTED: 'rejected',
  WAITING_WORK: 'waiting_work',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PICKED_UP: 'picked_up',
} as const;

export type BookingStatusType = typeof BookingStatus[keyof typeof BookingStatus];

// Status labels in Indonesian
export const BookingStatusLabels: Record<BookingStatusType, string> = {
  [BookingStatus.PENDING]: 'Menunggu Konfirmasi',
  [BookingStatus.ACCEPTED]: 'Diterima',
  [BookingStatus.DATE_PROPOSED]: 'Tanggal Alternatif Diajukan',
  [BookingStatus.REJECTED]: 'Ditolak',
  [BookingStatus.WAITING_WORK]: 'Menunggu Pengerjaan',
  [BookingStatus.IN_PROGRESS]: 'Diproses',
  [BookingStatus.COMPLETED]: 'Selesai Jahit',
  [BookingStatus.PICKED_UP]: 'Siap Diambil',
};

// Why choose us — matching reference design
export const WhyChooseUs = [
  { icon: 'ribbon-outline' as const, title: 'Kualitas Terbaik', desc: 'Hasil jahitan rapi dan tahan lama' },
  { icon: 'heart-outline' as const, title: 'Pelayanan Ramah', desc: 'Kami siap melayani dengan sepenuh hati' },
  { icon: 'shield-checkmark-outline' as const, title: 'Aman & Terpercaya', desc: 'Data dan pesanan Anda kami jaga kerahasiaannya' },
  { icon: 'wallet-outline' as const, title: 'Harga Terjangkau', desc: 'Harga sesuai kualitas dan tidak memberatkan' },
] as const;

// Navigation menu for desktop navbar
export const NavMenu = [
  { label: 'Beranda', route: '/(customer)' as const },
  { label: 'Layanan', route: '/(customer)/harga' as const },
  { label: 'Harga', route: '/(customer)/harga' as const },
  { label: 'Alamat', route: '/alamat' as const },
  { label: 'Tentang Kami', route: '/portfolio' as const },
] as const;

// Portfolio categories
export const PortfolioCategories = ['Semua', 'Baju', 'Celana', 'Seragam', 'Permak', 'Custom'] as const;
export type PortfolioCategory = typeof PortfolioCategories[number];

// Rejection reasons
export const RejectionReasons = [
  'Jadwal penuh',
  'Tidak dapat mengerjakan model tersebut',
  'Bahan tidak tersedia',
  'Lainnya',
] as const;
