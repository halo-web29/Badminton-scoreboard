import { ColorTheme } from './types';

export const C_BASE = {
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

export const THEMES: Record<ColorTheme, { label: string; teamA: TeamColorConfig; teamB: TeamColorConfig }> = {
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
