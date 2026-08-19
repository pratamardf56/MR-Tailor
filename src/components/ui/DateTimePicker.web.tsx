/**
 * Godabaya Tailor — DateTimePicker (Web)
 * Pengganti @react-native-community/datetimepicker yang tidak mendukung web.
 * Menggunakan <input type="date"> dengan gaya yang disesuaikan dengan desain aplikasi.
 */

import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface DateTimePickerProps {
  value: Date;
  mode?: 'date' | 'time';
  display?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  onChange: (event: unknown, selectedDate?: Date) => void;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromDateInputValue(value: string): Date | null {
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}

const webInputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: Colors.surface,
  borderWidth: 1.5,
  borderStyle: 'solid',
  borderColor: Colors.border,
  borderRadius: 12,
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 12,
  paddingBottom: 12,
  fontSize: 15,
  color: Colors.text,
  fontFamily: 'inherit',
};

export default function DateTimePicker({
  value,
  mode = 'date',
  minimumDate,
  maximumDate,
  onChange,
}: DateTimePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openNativePicker = () => {
    // Menampilkan kalender browser bawaan (didukung Chrome/Edge; Safari memakai ikon kalender)
    try {
      inputRef.current?.showPicker?.();
    } catch {
      // Ignore: fallback ke klik manual pada input
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextDate = fromDateInputValue(event.target.value);
    onChange?.(
      { type: 'set', nativeEvent: { timestamp: nextDate ? nextDate.getTime() : null } },
      nextDate || undefined
    );
  };

  if (mode !== 'date') {
    return null;
  }

  return (
    <View style={styles.container}>
      <input
        ref={inputRef}
        type="date"
        value={toDateInputValue(value)}
        min={minimumDate ? toDateInputValue(minimumDate) : undefined}
        max={maximumDate ? toDateInputValue(maximumDate) : undefined}
        onChange={handleChange}
        onClick={openNativePicker}
        style={webInputStyle}
        tabIndex={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    width: '100%',
  },
});
