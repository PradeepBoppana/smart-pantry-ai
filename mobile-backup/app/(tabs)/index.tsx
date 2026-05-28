import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, SharedStyles, CategoryIcons, CategoryBg, getUrgencyColor, getUrgencyBg } from '../../constants/theme';
import { getPantry, addPantryItem, markItemUsed, clearToken } from '../../services/api';
import { router } from 'expo-router';

const UNITS = ['item', 'lb', 'oz', 'gal', 'ct', 'bag', 'box', 'can', 'bottle'];
const CATEGORIES = Object.keys(CategoryIcons);

export default function PantryScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'other', quantity: '1', unit: 'item', expiryDate: '' });

  const loadItems = useCallback(async () => {
    try {
      const data = await getPantry();
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { loadItems(); }, [loadItems]));

  const handleAdd = async () => {
    if (!newItem.name.trim()) { Alert.alert('Enter item name'); return; }
    try {
      await addPantryItem({
        name: newItem.name,
        category: newItem.category,
        quantity: Number(newItem.quantity) || 1,
        unit: newItem.unit,
        expiryDate: newItem.expiryDate || undefined,
      });
      setNewItem({ name: '', category: 'other', quantity: '1', unit: 'item', expiryDate: '' });
      setShowAdd(false);
      loadItems();
    } catch (err: any) { Alert.alert('Error', err.message); }
  };

  const handleUse = async (id: string) => {
    try { await markItemUsed(id); loadItems(); }
    catch (err: any) { Alert.alert('Error', err.message); }
  };

  const handleLogout = async () => {
    await clearToken();
    router.replace('/');
  };

  const expiring = items.filter(i => i.urgency === 'critical' || i.urgency === 'warning');

  return (
    <SafeAreaView style={SharedStyles.container}>
      {/* Header */}
      <View style={SharedStyles.header}>
        <View>
          <Text style={SharedStyles.headerTitle}>My Pantry</Text>
          <Text style={SharedStyles.headerSub}>{items.length} items tracked</Text>
        </View>
        <TouchableOpacity style={SharedStyles.btnSecondary} onPress={() => setShowAdd(!showAdd)}>
          <Text style={SharedStyles.btnSecondaryText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={SharedStyles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadItems(); }} tintColor={Colors.accent} />}
      >
        {/* Add Form */}
        {showAdd && (
          <View style={[SharedStyles.card, { backgroundColor: Colors.bgWarm }]}>
            <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 12 }}>Add item manually</Text>
            <TextInput
              style={[SharedStyles.input, { marginBottom: 8 }]}
              placeholder="Item name (e.g. Milk)"
              placeholderTextColor={Colors.textMuted}
              value={newItem.name}
              onChangeText={t => setNewItem({ ...newItem, name: t })}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexShrink: 1 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {CATEGORIES.map(c => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setNewItem({ ...newItem, category: c })}
                      style={[s.catChip, newItem.category === c && s.catChipActive]}
                    >
                      <Text style={{ fontSize: 14 }}>{CategoryIcons[c]}</Text>
                      <Text style={[s.catChipText, newItem.category === c && { color: Colors.accent }]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <TextInput
                style={[SharedStyles.input, { width: 70 }]}
                keyboardType="numeric"
                value={newItem.quantity}
                onChangeText={t => setNewItem({ ...newItem, quantity: t })}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {UNITS.map(u => (
                    <TouchableOpacity
                      key={u}
                      onPress={() => setNewItem({ ...newItem, unit: u })}
                      style={[s.unitChip, newItem.unit === u && s.unitChipActive]}
                    >
                      <Text style={[s.unitChipText, newItem.unit === u && { color: Colors.accent }]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
            <TextInput
              style={[SharedStyles.input, { marginBottom: 12 }]}
              placeholder="Expiry date (YYYY-MM-DD)"
              placeholderTextColor={Colors.textMuted}
              value={newItem.expiryDate}
              onChangeText={t => setNewItem({ ...newItem, expiryDate: t })}
            />
            <TouchableOpacity style={SharedStyles.btnPrimary} onPress={handleAdd}>
              <Text style={SharedStyles.btnPrimaryText}>Add to Pantry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Expiring Banner */}
        {expiring.length > 0 && (
          <View style={[SharedStyles.card, { backgroundColor: Colors.amberBg, borderColor: Colors.amber + '33' }]}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.amber, marginBottom: 8 }}>
              ⚠️ Expiring soon ({expiring.length})
            </Text>
            {expiring.slice(0, 3).map(item => (
              <Text key={item.id} style={{ fontSize: 13, marginBottom: 4 }}>
                {CategoryIcons[item.category] || '📦'} {item.name} —{' '}
                <Text style={{ color: getUrgencyColor(item.urgency), fontWeight: '600' }}>
                  {item.daysLeft <= 0 ? 'Expired!' : `${item.daysLeft}d left`}
                </Text>
              </Text>
            ))}
          </View>
        )}

        {/* Items List */}
        {loading ? (
          <View style={SharedStyles.empty}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : items.length === 0 ? (
          <View style={SharedStyles.empty}>
            <Text style={SharedStyles.emptyIcon}>🛒</Text>
            <Text style={SharedStyles.emptyText}>Your pantry is empty</Text>
            <Text style={SharedStyles.emptySub}>Scan groceries or add items manually</Text>
          </View>
        ) : (
          <View style={SharedStyles.card}>
            <Text style={SharedStyles.label}>All Items</Text>
            {items.map(item => (
              <View key={item.id} style={SharedStyles.itemRow}>
                <View style={[SharedStyles.itemIcon, { backgroundColor: CategoryBg[item.category] || Colors.bgMuted }]}>
                  <Text style={{ fontSize: 18 }}>{CategoryIcons[item.category] || '📦'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={SharedStyles.itemName}>{item.name}</Text>
                  <Text style={[SharedStyles.itemMeta, { color: getUrgencyColor(item.urgency) }]}>
                    {item.quantity} {item.unit} · {item.daysLeft != null ? (item.daysLeft <= 0 ? 'Expired' : `${item.daysLeft}d left`) : 'No expiry'}
                  </Text>
                </View>
                <View style={[SharedStyles.badge, { backgroundColor: getUrgencyBg(item.urgency) }]}>
                  <Text style={[SharedStyles.badgeText, { color: getUrgencyColor(item.urgency) }]}>
                    {item.daysLeft != null ? (item.daysLeft <= 0 ? '!' : `${item.daysLeft}d`) : '—'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleUse(item.id)}
                  style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.border }}
                >
                  <Text style={{ fontSize: 12, color: Colors.green }}>✓</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Sign Out */}
        <TouchableOpacity onPress={handleLogout} style={{ alignSelf: 'center', marginTop: 12, padding: 8 }}>
          <Text style={{ fontSize: 12, color: Colors.textMuted }}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard,
  },
  catChipActive: { borderColor: Colors.accent, backgroundColor: Colors.bgWarm },
  catChipText: { fontSize: 11, color: Colors.textSec },
  unitChip: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgCard,
  },
  unitChipActive: { borderColor: Colors.accent, backgroundColor: Colors.bgWarm },
  unitChipText: { fontSize: 12, color: Colors.textSec, fontWeight: '500' },
});
