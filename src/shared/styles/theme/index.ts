import { colors } from './colors';
import { tokens } from './tokens';

export const theme = {
  colors,
  ...tokens
};

export type Theme = typeof theme;

// Exporte para integração com Radix UI Themes
export const radixThemeConfig = {
  accentColor: 'blue',
  grayColor: 'slate',
  radius: 'medium',
  scaling: '100%',
};