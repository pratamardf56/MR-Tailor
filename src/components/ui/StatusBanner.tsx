/**
 * Godabaya Tailor — StatusBanner Component
 * Full-width banner showing the current work status prominently.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography } from '@/constants/typography';
import { BookingStatusType, BookingStatus, BookingStatusLabels } from '@/constants/config';
import { statusColors } from '@/components/ui/StatusBadge';

interface StatusBannerProps {
  status: BookingStatusType;
}

export function StatusBanner({ status }: StatusBannerProps) {
  const color = statusColors[status] || statusColors[BookingStatus.PENDING];
  const label = BookingStatusLabels[status] || status;

  return (
    <View style={[styles.banner, { backgroundColor: color.bg }]}>
      <View style={[styles.dot, { backgroundColor: color.dot }]} />
      <Text style={[styles.label, { color: color.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  label: {
    ...Typography.bodyMedium,
    fontWeight: '700',
  },
});
