import { StyleSheet } from 'react-native';
import { fonts, radius, spacing, makeTypography } from '../../theme/theme';

export const HERO_HEIGHT = 200;
export const COMPACT_HERO_HEIGHT = 160;
export const TABS_HEIGHT = 60;

export const createStyles = (c) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  menuList: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 6,
  },
  headerTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: c.headerText, maxWidth: 220 },
  heroWrap: { height: HERO_HEIGHT, overflow: 'hidden', backgroundColor: c.primaryDark },
  compactHero: { height: COMPACT_HERO_HEIGHT },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  hero: { flex: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, justifyContent: 'flex-end' },
  heroIcon: { position: 'absolute', right: spacing.lg, top: spacing.lg },
  heroBottom: {},
  heroName: { fontFamily: fonts.extrabold, fontSize: 26, lineHeight: 31, color: '#FFFFFF' },
  heroDescription: { fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 19, color: 'rgba(255,255,255,0.9)', marginTop: 2, marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', marginLeft: spacing.md, maxWidth: '45%' },
  metaText: { fontFamily: fonts.medium, fontSize: 13, color: '#FFFFFF', marginLeft: 4 },
  tabsBar: {
    height: TABS_HEIGHT,
    backgroundColor: c.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  fullWidthTabs: { paddingLeft: 0, paddingRight: 0 },
  menuControls: {
    alignItems: 'flex-start',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: c.background,
  },
  activeFilters: { flexDirection: 'row', flexWrap: 'wrap' },
  searchRow: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  searchInput: { flex: 1, marginBottom: 0 },
  // The tab row: clips the sliding underline to the row (it never shows under the Diet chip)
  tabsClip: { flex: 1, height: TABS_HEIGHT - 1, justifyContent: 'center', overflow: 'hidden' },
  tab: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md },
  tabText: { fontFamily: fonts.bold, fontSize: 15, color: c.textMuted },
  tabTextActive: { color: c.primaryText },
  // Sliding underline: fixed 100 px wide, resized with scaleX from the active tab's measured width
  underline: { position: 'absolute', left: 0, bottom: 0, width: 100, height: 3, borderRadius: 2, backgroundColor: c.primaryText },
  countLine: { ...makeTypography(c).caption, marginTop: spacing.md },
  loyalty: { marginTop: spacing.md },
  chips: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  closedText: { fontFamily: fonts.medium, fontSize: 13.5, color: c.dangerText, marginLeft: spacing.sm, flex: 1 },
  group: { marginTop: spacing.lg },
  groupHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: spacing.md },
  groupTitle: makeTypography(c).h2,
  groupCount: makeTypography(c).caption,
  productRow: { paddingRight: spacing.lg, paddingBottom: spacing.sm },
  bagButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bagBubble: { position: 'absolute', top: 2, right: -2 },
});
