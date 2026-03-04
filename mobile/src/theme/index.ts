import { Platform } from 'react-native';

export const Colors = {
  // Primary: Front Desk cyan-blue
  primary: '#0E7490',
  primaryDark: '#155E75',
  primaryLight: '#22D3EE',
  accent: '#06B6D4',

  // Front Desk Professional Theme - Blue/Teal
  fdPrimary: '#0E7490',        // Professional cyan-blue
  fdPrimaryDark: '#155E75',    // Darker cyan-blue
  fdPrimaryLight: '#22D3EE',   // Light cyan accent
  fdAccent: '#06B6D4',         // Cyan accent
  fdSecondary: '#64748B',      // Slate gray
  fdSurface: '#F8FAFC',        // Light surface
  fdBackground: '#F1F5F9',     // Light background

  // Backgrounds
  background: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceLight: '#F8FAFC',
  card: '#FFFFFF',
  cardHighlight: '#E2E8F0',

  // Borders
  border: '#CBD5E1',
  borderLight: '#E2E8F0',
  borderGold: '#0E749040',

  // Text
  text: '#0F172A',
  textSecondary: '#475569',
  textLight: '#64748B',
  textWhite: '#0F172A',
  textDark: '#111111',
  textGold: '#0E7490',

  // Status
  success: '#00E676',
  warning: '#FFD600',
  error: '#FF5252',
  info: '#40C4FF',

  // Agreement status
  statusDraft: '#0EA5E9',
  statusActive: '#00E676',
  statusClosed: '#64748B',

  // Fuel
  fuelEmpty: '#FF5252',
  fuelQuarter: '#FF9100',
  fuelHalf: '#FFD600',
  fuelThreeQuarter: '#76FF03',
  fuelFull: '#00E676',

  // Gradients (for manual use)
  goldGradientStart: '#0E7490',
  goldGradientEnd: '#06B6D4',
  darkGradientStart: '#155E75',
  darkGradientEnd: '#0E7490',
  // Front Desk gradient
  fdGradientStart: '#0E7490',
  fdGradientEnd: '#06B6D4',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const Typography = {
  h1: { fontSize: 26, fontWeight: 'bold' as const, letterSpacing: 0.5 },
  h2: { fontSize: 22, fontWeight: 'bold' as const, letterSpacing: 0.3 },
  h3: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 16, fontWeight: 'normal' as const },
  bodySmall: { fontSize: 14, fontWeight: 'normal' as const },
  caption: { fontSize: 12, fontWeight: 'normal' as const },
  label: { fontSize: 14, fontWeight: '600' as const },
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  round: 999,
};

export const Shadow3D = {
  card: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardLight: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  button: {
    ...Platform.select({
      ios: {
        shadowColor: '#0E7490',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.32,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  fab: {
    ...Platform.select({
      ios: {
        shadowColor: '#0E7490',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.42,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  raised: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  goldGlow: {
    ...Platform.select({
      ios: {
        shadowColor: '#0E7490',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.22,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
};
