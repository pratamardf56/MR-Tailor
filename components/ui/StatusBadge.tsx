/**
 * Godabaya Tailor — StatusBadge Component
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { BookingStatusType, BookingStatus, BookingStatusLabels } from '@/constants/config';

interface StatusBadgeProps {
  status: BookingStatusType;
  size?: 'sm' | 'md';
}

const statusColors: Record<BookingStatusType, { bg: string; text: string; dot: string }> = {
  [BookingStatus.PENDING]: { bg: '#FEF3C7', text: '#92400E', dot: Colors.statusPending },
  [BookingStatus.ACCEPTED]: { bg: '#D1FAE5', text: '#065F46', dot: Colors.statusAccepted },
  [BookingStatus.DATE_PROPOSED]: { bg: '#FFEDD5', text: '#9A3412', dot: Colors.statusProposed },
  [BookingStatus.REJECTED]: { bg: '#FEE2E2', text: '#991B1B', dot: Colors.statusRejected },
  [BookingStatus.WAITING_WORK]: { bg: '#DBEAFE', text: '#1E40AF', dot: Colors.statusInProgress },
  [BookingStatus.IN_PROGRESS]: { bg: '#DBEAFE', text: '#1E40AF', dot: Colors.statusInProgress },
  [BookingStatus.COMPLETED]: { bg: '#EDE9FE', text: '#5B21B6', dot: Colors.statusCompleted },
  [BookingStatus.PICKED_UP]: { bg: '#F3F4F6', text: '#374151', dot: Colors.statusPickedUp },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const color = statusColors[status] || statusColors[BookingStatus.PENDING];
  const label = BookingStatusLabels[status] || status;
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: color.bg }, isSmall && styles.badgeSm]}>
      <View style={[styles.dot, { backgroundColor: color.dot }, isSmall && styles.dotSm]} />
      <Text style={[
        isSmall ? Typography.caption : Typography.bodySm,
        { color: color.text, fontWeight: '600' },
      ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotSm: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
});
