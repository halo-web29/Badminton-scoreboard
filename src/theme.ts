import { ColorTheme } from './types';

export const C_BASE_LIGHT = {
  bg: '#F7F6F2',
  card: '#FFFFFF',
  text: '#323232',
  sub: '#7C7C7C',
  border: '#EDE9E0',
  softBorder: '#E6E2D8',
  shadow: '0 4px 18px rgba(50,50,50,0.06)',
  cardShadow: '0 8px 24px rgba(40,40,40,0.07)',
  danger: '#E55353',
  dangerBg: '#FDF2F2',
  softBg: '#F1EFEA',
  inputBg: '#FBFAF8',
};

export const C_BASE_DARK = {
  bg: '#12161F',
  card: '#1A2232',
  text: '#F3F6FA',
  sub: '#94A3B8',
  border: '#263348',
  softBorder: '#202A3C',
  shadow: '0 4px 18px rgba(0,0,0,0.4)',
  cardShadow: '0 8px 24px rgba(0,0,0,0.5)',
  danger: '#F87171',
  dangerBg: 'rgba(239, 68, 68, 0.16)',
  softBg: '#1E273A',
  inputBg: '#151C28',
};

// Default fallback export for base colors
export const C_BASE = C_BASE_LIGHT;

export interface TeamColorConfig {
  name: string;
  primary: string;
  bg: string;
  border: string;
  text: string;
  pillBg: string;
  activeBorder: string;
  serveBg: string;
  serveBadge: string;
  recvBg: string;
  recvBadge: string;
}

export const THEMES_LIGHT: Record<ColorTheme, { label: string; teamA: TeamColorConfig; teamB: TeamColorConfig }> = {
  coral: {
    label: 'Soft Blue & Coral',
    teamA: {
      name: 'Soft Blue',
      primary: '#4A80E8',
      bg: '#F2F7FF',
      border: '#C2DAFC',
      activeBorder: '#4A80E8',
      text: '#1E4DB8',
      pillBg: '#E3EDFE',
      serveBg: '#E8F1FE',
      serveBadge: '#4A80E8',
      recvBg: '#F0F5FD',
      recvBadge: '#3B6EC9',
    },
    teamB: {
      name: 'Soft Coral',
      primary: '#FA6E59',
      bg: '#FFF4F2',
      border: '#FED2C7',
      activeBorder: '#FA6E59',
      text: '#B63620',
      pillBg: '#FEE8E3',
      serveBg: '#FEECE7',
      serveBadge: '#FA6E59',
      recvBg: '#FFF0ED',
      recvBadge: '#DE5642',
    },
  },
  green: {
    label: 'Soft Blue & Green',
    teamA: {
      name: 'Soft Blue',
      primary: '#4A80E8',
      bg: '#F2F7FF',
      border: '#C2DAFC',
      activeBorder: '#4A80E8',
      text: '#1E4DB8',
      pillBg: '#E3EDFE',
      serveBg: '#E8F1FE',
      serveBadge: '#4A80E8',
      recvBg: '#F0F5FD',
      recvBadge: '#3B6EC9',
    },
    teamB: {
      name: 'Soft Green',
      primary: '#36A76A',
      bg: '#F0FAF4',
      border: '#BFE9D0',
      activeBorder: '#36A76A',
      text: '#18683B',
      pillBg: '#E0F6EA',
      serveBg: '#E8F8EE',
      serveBadge: '#36A76A',
      recvBg: '#EDF9F2',
      recvBadge: '#2C8E58',
    },
  },
};

// Brighter, highly luminous and vibrant team colors specifically crafted for dark mode (#12161F)
export const THEMES_DARK: Record<ColorTheme, { label: string; teamA: TeamColorConfig; teamB: TeamColorConfig }> = {
  coral: {
    label: 'Electric Blue & Vibrant Coral',
    teamA: {
      name: 'Electric Blue',
      primary: '#5B96F8',
      bg: '#142136',
      border: 'rgba(91, 150, 248, 0.35)',
      activeBorder: '#5B96F8',
      text: '#93C5FD',
      pillBg: 'rgba(91, 150, 248, 0.22)',
      serveBg: '#172740',
      serveBadge: '#5B96F8',
      recvBg: '#131F33',
      recvBadge: '#93C5FD',
    },
    teamB: {
      name: 'Vibrant Coral',
      primary: '#FF7660',
      bg: '#2B1B1E',
      border: 'rgba(255, 118, 96, 0.35)',
      activeBorder: '#FF7660',
      text: '#FFA294',
      pillBg: 'rgba(255, 118, 96, 0.22)',
      serveBg: '#351F23',
      serveBadge: '#FF7660',
      recvBg: '#27181B',
      recvBadge: '#FFA294',
    },
  },
  green: {
    label: 'Electric Blue & Vibrant Green',
    teamA: {
      name: 'Electric Blue',
      primary: '#5B96F8',
      bg: '#142136',
      border: 'rgba(91, 150, 248, 0.35)',
      activeBorder: '#5B96F8',
      text: '#93C5FD',
      pillBg: 'rgba(91, 150, 248, 0.22)',
      serveBg: '#172740',
      serveBadge: '#5B96F8',
      recvBg: '#131F33',
      recvBadge: '#93C5FD',
    },
    teamB: {
      name: 'Vibrant Mint Green',
      primary: '#3CD885',
      bg: '#12261E',
      border: 'rgba(60, 216, 133, 0.35)',
      activeBorder: '#3CD885',
      text: '#86EFAC',
      pillBg: 'rgba(60, 216, 133, 0.22)',
      serveBg: '#163126',
      serveBadge: '#3CD885',
      recvBg: '#10221A',
      recvBadge: '#86EFAC',
    },
  },
};

export const THEMES = THEMES_LIGHT;

export function getBaseColors(isDark: boolean) {
  return isDark ? C_BASE_DARK : C_BASE_LIGHT;
}

export function getThemeConfig(theme: ColorTheme, isDark: boolean) {
  return isDark ? THEMES_DARK[theme] : THEMES_LIGHT[theme];
}
