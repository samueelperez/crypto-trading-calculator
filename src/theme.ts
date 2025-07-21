import { MD3LightTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  displayLarge: {
    fontFamily: 'System',
    fontSize: 57,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 64,
  },
  displayMedium: {
    fontFamily: 'System',
    fontSize: 45,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 52,
  },
  displaySmall: {
    fontFamily: 'System',
    fontSize: 36,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 44,
  },
  headlineLarge: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 40,
  },
  headlineMedium: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 36,
  },
  headlineSmall: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 32,
  },
  titleLarge: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 28,
  },
  titleMedium: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  titleSmall: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelLarge: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelMedium: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  labelSmall: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  bodyLarge: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.4,
    lineHeight: 16,
  },
};

export const theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0F172A',
    onPrimary: '#FFFFFF',
    primaryContainer: '#3B82F6',
    onPrimaryContainer: '#FFFFFF',
    secondary: '#64748B',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E2E8F0',
    onSecondaryContainer: '#1E293B',
    tertiary: '#7C3AED',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#DDD6FE',
    onTertiaryContainer: '#1E1B4B',
    error: '#DC2626',
    onError: '#FFFFFF',
    errorContainer: '#FEE2E2',
    onErrorContainer: '#7F1D1D',
    background: '#FFFFFF',
    onBackground: '#0F172A',
    surface: '#FFFFFF',
    onSurface: '#0F172A',
    surfaceVariant: '#F1F5F9',
    onSurfaceVariant: '#475569',
    outline: '#CBD5E1',
    outlineVariant: '#E2E8F0',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#1E293B',
    inverseOnSurface: '#F8FAFC',
    inversePrimary: '#60A5FA',
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#FFFFFF',
      level3: '#FFFFFF',
      level4: '#FFFFFF',
      level5: '#FFFFFF',
    },
    surfaceDisabled: '#F1F5F9',
    onSurfaceDisabled: '#94A3B8',
    backdrop: 'rgba(15, 23, 42, 0.4)',
  },
  roundness: 12,
};

// Additional color constants for the app
export const colors = {
  success: '#10b981', // emerald-500
  warning: '#f59e0b', // amber-500
  info: '#3b82f6', // blue-500
  muted: '#64748b', // slate-500
  border: '#e2e8f0', // slate-200
  input: '#f8fafc', // slate-50
  ring: '#3b82f6', // blue-500
  card: '#ffffff',
  cardForeground: '#0f172a', // slate-900
  popover: '#ffffff',
  popoverForeground: '#0f172a', // slate-900
  accent: '#f1f5f9', // slate-100
  accentForeground: '#0f172a', // slate-900
  destructive: '#ef4444', // red-500
  destructiveForeground: '#ffffff',
  foreground: '#0f172a', // slate-900
  background: '#ffffff',
  secondary: '#f8fafc', // slate-50
  secondaryForeground: '#0f172a', // slate-900
}; 