import { Platform } from 'react-native';

// Official Université Antonine palette (ua.edu.lb stylesheet)
export const colors = {
  primary: '#005BAA',
  primaryDark: '#0C2640',
  primaryMid: '#0F5CA8',
  primarySoft: '#E6F0F9',
  textBrand: '#32577C',
  accent: '#00AEEF',
  accentSoft: '#E0F5FD',
  accentWarm: '#FBB040',
  accentWarmSoft: '#FEF2DC',
  background: '#F3F5F8',
  surface: '#FFFFFF',
  surfaceMuted: '#EDEFF3',
  border: '#D8DEE6',
  text: '#0C2640',
  textMuted: '#5B6B7F',
  textOnDark: '#FFFFFF',
  success: '#009444',
  successSoft: '#E3F4EA',
  danger: '#ED1C24',
  dangerText: '#C8161D',
  dangerSoft: '#FDE7E8',
  warning: '#E8930C',
  warningText: '#9A5F00',
  warningSoft: '#FEF2DC',
  info: '#00AEEF',
  infoText: '#0F5CA8',
  infoSoft: '#E0F5FD',
};

export const gradients = {
  brand: [colors.primary, colors.primaryDark],
  hero: ['#0F6BC0', colors.primary, colors.primaryDark],
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 };

// Karla for display/titles/prices/buttons, Roboto for body text (as on ua.edu.lb)
export const fonts = {
  regular: 'Roboto_400Regular',
  medium: 'Roboto_500Medium',
  bodyBold: 'Roboto_700Bold',
  semibold: 'Karla_600SemiBold',
  bold: 'Karla_700Bold',
  extrabold: 'Karla_800ExtraBold',
};

export const MAX_FONT_SCALE = 1.3;

export const typography = {
  display: { fontFamily: fonts.extrabold, fontSize: 32, lineHeight: 38, color: colors.text },
  h1: { fontFamily: fonts.extrabold, fontSize: 25, lineHeight: 31, color: colors.text },
  h2: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26, color: colors.text },
  h3: { fontFamily: fonts.bold, fontSize: 16.5, lineHeight: 22, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.text },
  bodyStrong: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22, color: colors.text },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  micro: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    lineHeight: 15,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textBrand,
  },
  price: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text },
};

export const shadow = {
  card: Platform.select({
    ios: {
      shadowColor: colors.primaryDark,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
    },
    default: { elevation: 3, shadowColor: colors.primaryDark },
  }),
  raised: Platform.select({
    ios: {
      shadowColor: colors.primaryDark,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    default: { elevation: 12, shadowColor: colors.primaryDark },
  }),
};

// UA faculty palette used for category tiles
export const categoryColors = {
  Food: ['#FBB040', '#E8930C'],
  Drinks: ['#8A6236', '#6E4D26'],
  Stationery: ['#00AEEF', '#0F5CA8'],
  Printing: ['#7F3F98', '#5E2C72'],
  Sandwiches: ['#FBB040', '#E8930C'],
  Manakish: ['#ED6B24', '#C9501A'],
  Salads: ['#2DB36A', '#009444'],
  Snacks: ['#B72467', '#8E1B50'],
  'Hot Drinks': ['#8A6236', '#6E4D26'],
  'Cold Drinks': ['#00C4C6', '#00999B'],
  Notebooks: ['#00AEEF', '#0F5CA8'],
  Writing: ['#3E7FC0', '#005BAA'],
  Accessories: ['#32577C', '#0C2640'],
};

export const categoryIcons = {
  Food: 'fast-food',
  Drinks: 'cafe',
  Stationery: 'book',
  Printing: 'print',
  Sandwiches: 'fast-food',
  Manakish: 'pizza',
  Salads: 'leaf',
  Snacks: 'nutrition',
  'Hot Drinks': 'cafe',
  'Cold Drinks': 'beer',
  Notebooks: 'book',
  Writing: 'pencil',
  Accessories: 'calculator',
};

export const getCategoryColors = (category) => categoryColors[category] || gradients.brand;
export const getCategoryIcon = (category) => categoryIcons[category] || 'cube';

export const logos = {
  blue: require('../../assets/brand/ua-logo.png'),
  white: require('../../assets/brand/ua-logo-white.png'),
  ratio: 3.3,
};
