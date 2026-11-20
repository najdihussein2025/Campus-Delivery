import { Platform } from 'react-native';

// Official Université Antonine palette (ua.edu.lb stylesheet). `primaryText` is the primary
// colour to use for TEXT and ICONS (in dark mode it is lighter so it stays readable);
// `primary` is for filled surfaces that carry white text.
export const lightColors = {
  // Header surfaces: UA blue in light mode, a deep navy with a subtle border in dark mode
  headerBg: '#005BAA',
  headerText: '#FFFFFF',
  headerBorder: 'transparent',
  primary: '#005BAA',
  primaryText: '#005BAA',
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
  successSolid: '#009444',
  successText: '#007A38',
  successSoft: '#E3F4EA',
  danger: '#ED1C24',
  dangerSolid: '#ED1C24',
  dangerText: '#C8161D',
  dangerSoft: '#FDE7E8',
  warning: '#E8930C',
  warningText: '#9A5F00',
  warningSoft: '#FEF2DC',
  info: '#00AEEF',
  infoText: '#0F5CA8',
  infoSoft: '#E0F5FD',
  overlay: 'rgba(12, 38, 64, 0.55)',
  cardBorder: 'transparent',
};

// `successSolid` / `dangerSolid` are fills that carry white text.
// Same token names as lightColors, tuned for dark surfaces (text pairs checked for WCAG AA)
export const darkColors = {
  headerBg: '#0B1E36',
  headerText: '#FFFFFF',
  headerBorder: '#1E3550',
  primary: '#005BAA',
  primaryText: '#6CB4F0',
  primaryDark: '#0C2640',
  primaryMid: '#2670BA',
  primarySoft: '#12304F',
  textBrand: '#B5C7DB',
  accent: '#33BEF2',
  accentSoft: '#0E3445',
  accentWarm: '#FBB040',
  accentWarmSoft: '#3A2A10',
  background: '#0B1520',
  surface: '#132131',
  surfaceMuted: '#1A2B3E',
  border: '#263A50',
  text: '#E9EFF6',
  textMuted: '#9DAEC2',
  textOnDark: '#FFFFFF',
  success: '#3CC37A',
  successSolid: '#087A43',
  successText: '#3CC37A',
  successSoft: '#123826',
  danger: '#FF5A60',
  dangerSolid: '#C8161D',
  dangerText: '#FF8A8F',
  dangerSoft: '#3D1517',
  warning: '#F2A93B',
  warningText: '#F5B95C',
  warningSoft: '#3A2A10',
  info: '#33BEF2',
  infoText: '#6CC8F5',
  infoSoft: '#0E3445',
  overlay: 'rgba(0, 0, 0, 0.7)',
  cardBorder: '#263A50',
};

// Colours that stay the same in light and dark mode (white icons on coloured tiles, dark ink)
export const fixedColors = { white: '#FFFFFF', ink: '#0C2640' };

export const gradients = {
  brand: ['#005BAA', '#0C2640'],
  hero: ['#0F6BC0', '#005BAA', '#0C2640'],
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

// Text styles depend on the theme colours, so they are built from a palette
export const makeTypography = (c) => ({
  display: { fontFamily: fonts.extrabold, fontSize: 32, lineHeight: 38, color: c.text },
  h1: { fontFamily: fonts.extrabold, fontSize: 25, lineHeight: 31, color: c.text },
  h2: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26, color: c.text },
  h3: { fontFamily: fonts.bold, fontSize: 16.5, lineHeight: 22, color: c.text },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: c.text },
  bodyStrong: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22, color: c.text },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.textMuted },
  micro: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    lineHeight: 15,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: c.textBrand,
  },
  price: { fontFamily: fonts.extrabold, fontSize: 16, color: c.text },
});

export const shadow = {
  card: Platform.select({
    ios: {
      shadowColor: '#0C2640',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
    },
    default: { elevation: 3, shadowColor: '#0C2640' },
  }),
  raised: Platform.select({
    ios: {
      shadowColor: '#0C2640',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    default: { elevation: 12, shadowColor: '#0C2640' },
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
