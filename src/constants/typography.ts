/**
 * Godabaya Tailor — Typography System
 */

import { TextStyle } from 'react-native';

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 34,
} as const;

export const FontWeight: Record<string, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
} as const;

export const Typography = {
  h1: {
    fontFamily: 'Inter_700Bold',
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['4xl'] * LineHeight.tight,
  } as TextStyle,

  h2: {
    fontFamily: 'Inter_700Bold',
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['3xl'] * LineHeight.tight,
  } as TextStyle,

  h3: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize['2xl'] * LineHeight.tight,
  } as TextStyle,

  h4: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.xl * LineHeight.tight,
  } as TextStyle,

  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.base * LineHeight.normal,
  } as TextStyle,

  bodyMedium: {
    fontFamily: 'Inter_500Medium',
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.base * LineHeight.normal,
  } as TextStyle,

  bodySm: {
    fontFamily: 'Inter_400Regular',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.sm * LineHeight.normal,
  } as TextStyle,

  caption: {
    fontFamily: 'Inter_400Regular',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.xs * LineHeight.normal,
  } as TextStyle,

  button: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.md * LineHeight.tight,
  } as TextStyle,

  buttonSm: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.sm * LineHeight.tight,
  } as TextStyle,

  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.sm * LineHeight.normal,
  } as TextStyle,

  price: {
    fontFamily: 'Inter_700Bold',
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    lineHeight: FontSize.xl * LineHeight.tight,
  } as TextStyle,
} as const;
