/**
 * Godabaya Tailor — Phone Number Utilities
 *
 * Nomor WhatsApp dipakai sebagai identitas customer.
 * Normalisasi + varian dipakai untuk mencocokkan nomor lama (mis. 08xx vs 628xx).
 */

export function normalizeWhatsApp(wa: string): string {
  return wa.replace(/\D/g, '');
}

/**
 * Menghasilkan varian penulisan nomor yang sama
 * (08xx, 628xx, +628xx) agar pencocokan lebih toleran.
 */
export function whatsAppVariants(digits: string): string[] {
  const clean = normalizeWhatsApp(digits);
  if (!clean) return [];

  const set = new Set<string>();
  set.add(clean);

  if (clean.startsWith('0')) {
    set.add('62' + clean.slice(1));
    set.add('+62' + clean.slice(1));
  } else if (clean.startsWith('62')) {
    set.add('0' + clean.slice(2));
    set.add('+' + clean);
  } else if (clean.startsWith('+62')) {
    set.add(clean.slice(1));
    set.add('0' + clean.slice(3));
  }

  return Array.from(set);
}
