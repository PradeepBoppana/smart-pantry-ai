import { StyleSheet } from 'react-native';

export const Colors = {
  bg: '#FDFAF6',
  bgCard: '#FFFFFF',
  bgMuted: '#F5F0E8',
  bgWarm: '#FFF8F0',
  text: '#2D2417',
  textSec: '#7A6E5D',
  textMuted: '#B5A898',
  accent: '#E07B3C',
  accentHover: '#C96A2F',
  green: '#4A8C5C',
  greenBg: '#EFF7F1',
  red: '#C44B3F',
  redBg: '#FDF0EE',
  amber: '#C48A2A',
  amberBg: '#FFF8EB',
  blue: '#3B7BC0',
  blueBg: '#EFF5FC',
  border: '#E8E0D4',
  borderLight: '#F0EBE3',
  white: '#FFFFFF',
};

export const CategoryIcons: Record<string, string> = {
  dairy: '🥛',
  meat: '🥩',
  vegetables: '🥬',
  fruits: '🍎',
  grains: '🌾',
  beverages: '🥤',
  snacks: '🍪',
  condiments: '🧂',
  frozen: '🧊',
  other: '📦',
};

export const CategoryBg: Record<string, string> = {
  dairy: Colors.blueBg,
  meat: Colors.redBg,
  vegetables: Colors.greenBg,
  fruits: Colors.amberBg,
  grains: Colors.bgMuted,
  beverages: Colors.blueBg,
  snacks: Colors.amberBg,
  condiments: Colors.bgMuted,
  frozen: Colors.blueBg,
  other: Colors.bgMuted,
};

export function getUrgencyColor(urgency: string) {
  if (urgency === 'expired' || urgency === 'critical') return Colors.red;
  if (urgency === 'warning') return Colors.amber;
  return Colors.green;
}

export function getUrgencyBg(urgency: string) {
  if (urgency === 'expired' || urgency === 'critical') return Colors.redBg;
  if (urgency === 'warning') return Colors.amberBg;
  return Colors.greenBg;
}

export const SharedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.textSec,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  btnPrimary: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  btnSecondary: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    backgroundColor: Colors.bgCard,
    color: Colors.text,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  itemMeta: {
    fontSize: 12,
    color: Colors.textSec,
    marginTop: 2,
  },
  empty: {
    alignItems: 'center',
    padding: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSec,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});
