import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, SharedStyles, CategoryIcons } from '../../constants/theme';
import { getHealthScore, getWasteStats, getSummary } from '../../services/api';

export default function StatsScreen() {
  const [health, setHealth] = useState<any>(null);
  const [waste, setWaste] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const [h, w, s] = await Promise.all([getHealthScore(), getWasteStats(), getSummary()]);
        setHealth(h); setWaste(w); setSummary(s);
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, []));

  if (loading) {
    return (
      <SafeAreaView style={SharedStyles.container}>
        <View style={SharedStyles.header}>
          <View>
            <Text style={SharedStyles.headerTitle}>Fridge Health</Text>
            <Text style={SharedStyles.headerSub}>Your kitchen performance</Text>
          </View>
        </View>
        <View style={SharedStyles.empty}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const score = health?.score || 0;
  const scoreColor = score >= 70 ? Colors.green : score >= 40 ? Colors.amber : Colors.red;

  return (
    <SafeAreaView style={SharedStyles.container}>
      <View style={SharedStyles.header}>
        <View>
          <Text style={SharedStyles.headerTitle}>Fridge Health</Text>
          <Text style={SharedStyles.headerSub}>Your kitchen performance</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={SharedStyles.scrollContent}>
        {/* Score Circle */}
        <View style={[SharedStyles.card, { alignItems: 'center' }]}>
          <View style={[s.scoreCircle, { borderColor: scoreColor }]}>
            <Text style={[s.scoreNum, { color: scoreColor }]}>{score}</Text>
            <Text style={s.scoreLabel}>Score</Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 4 }}>
            {score >= 80 ? '🌟 Excellent!' : score >= 60 ? '👍 Good job!' : score >= 40 ? '⚡ Room to improve' : '🔴 Needs attention'}
          </Text>
          <Text style={{ fontSize: 12, color: Colors.textSec }}>Based on the last 30 days</Text>
        </View>

        {/* Stat Grid */}
        <View style={s.statGrid}>
          <View style={[s.statCard, { backgroundColor: Colors.greenBg }]}>
            <Text style={[s.statNum, { color: Colors.green }]}>{health?.stats?.estimatedSavings || '$0'}</Text>
            <Text style={s.statLabel}>Saved</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: Colors.redBg }]}>
            <Text style={[s.statNum, { color: Colors.red }]}>{health?.breakdown?.wasteRate || '0%'}</Text>
            <Text style={s.statLabel}>Waste rate</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: Colors.blueBg }]}>
            <Text style={[s.statNum, { color: Colors.blue }]}>{summary?.activeItems || 0}</Text>
            <Text style={s.statLabel}>Active items</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: Colors.amberBg }]}>
            <Text style={[s.statNum, { color: Colors.amber }]}>{summary?.expiringSoon || 0}</Text>
            <Text style={s.statLabel}>Expiring soon</Text>
          </View>
        </View>

        {/* Breakdown */}
        {health?.breakdown && (
          <View style={SharedStyles.card}>
            <Text style={SharedStyles.label}>Breakdown</Text>
            {[
              ['Used before expiry', health.breakdown.usedBeforeExpiry, Colors.green],
              ['Freshness score', health.breakdown.freshnessScore, Colors.blue],
              ['Waste rate', health.breakdown.wasteRate, Colors.red],
            ].map(([label, value, color]) => (
              <View key={label as string} style={s.breakdownRow}>
                <Text style={{ fontSize: 13, color: Colors.text }}>{label}</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: color as string }}>{value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Most Wasted */}
        {waste?.byCategory?.length > 0 && (
          <View style={SharedStyles.card}>
            <Text style={SharedStyles.label}>Most Wasted Categories</Text>
            {waste.byCategory.slice(0, 5).map((cat: any, i: number) => (
              <View key={i} style={SharedStyles.itemRow}>
                <View style={[SharedStyles.itemIcon, { backgroundColor: Colors.redBg }]}>
                  <Text style={{ fontSize: 18 }}>{CategoryIcons[cat.category] || '📦'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={SharedStyles.itemName}>{cat.category}</Text>
                  <Text style={SharedStyles.itemMeta}>{cat.count} items wasted</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tip */}
        {waste?.tip && (
          <View style={[SharedStyles.card, { backgroundColor: Colors.blueBg }]}>
            <Text style={{ fontSize: 13, color: Colors.blue, lineHeight: 20 }}>💡 {waste.tip}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  scoreCircle: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 6, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  scoreNum: { fontSize: 32, fontWeight: '700' },
  scoreLabel: { fontSize: 11, color: Colors.textSec },
  statGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10,
  },
  statCard: {
    width: '48%', borderRadius: 12, padding: 14, alignItems: 'center',
  },
  statNum: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 11, color: Colors.textSec, marginTop: 2 },
  breakdownRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
});
