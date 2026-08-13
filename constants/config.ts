/**
 * Godabaya Tailor — App Configuration
 */

export const AppConfig = {
  name: 'Godabaya Tailor',
  tagline: 'Jahit & Permak Pakaian Sesuai Kebutuhan Anda',
  address: 'Godabaya, Sukadana, Malausma, Majalengka, Jawa Barat, Indonesia',
  addressShort: 'Godabaya, Sukadana, Malausma, Majalengka',
  mapsQuery: 'Godabaya, Sukadana, Malausma, Majalengka, Jawa Barat',
  
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

// Home page categories (with icons)
export const HomeCategories = [
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
  [BookingStatus.ACCEPTED]: 'Pesanan Diterima',
  [BookingStatus.DATE_PROPOSED]: 'Tanggal Alternatif Diajukan',
  [BookingStatus.REJECTED]: 'Pesanan Ditolak',
  [BookingStatus.WAITING_WORK]: 'Menunggu Pengerjaan',
  [BookingStatus.IN_PROGRESS]: 'Sedang Dikerjakan',
  [BookingStatus.COMPLETED]: 'Selesai',
  [BookingStatus.PICKED_UP]: 'Sudah Diambil',
};

// Why choose us
export const WhyChooseUs = [
  { icon: 'checkmark-circle-outline' as const, title: 'Jahitan Sesuai Permintaan', desc: 'Setiap pesanan dikerjakan sesuai keinginan Anda' },
  { icon: 'color-palette-outline' as const, title: 'Bisa Custom Model', desc: 'Bebas pilih model pakaian yang Anda inginkan' },
  { icon: 'wallet-outline' as const, title: 'Harga Terjangkau', desc: 'Harga bersaing dengan kualitas terjamin' },
  { icon: 'chatbubbles-outline' as const, title: 'Konsultasi Gratis', desc: 'Bisa konsultasi terlebih dahulu sebelum memesan' },
  { icon: 'location-outline' as const, title: 'Lokasi Mudah Ditemukan', desc: 'Berada di lokasi yang mudah dijangkau' },
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
