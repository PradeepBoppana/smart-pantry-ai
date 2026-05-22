import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, SharedStyles } from '../../constants/theme';
import { getShoppingList, generateShoppingList, addShoppingItem, toggleShoppingItem } from '../../services/api';

export default function ShoppingScreen() {
  const [list, setList] = useState<any>(null);
  const [dontBuy, setDontBuy] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [addText, setAddText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadList = useCallback(async () => {
    try {
      const data = await getShoppingList();
      setList(data.list);
    } catch (err) { console.error(err); }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); loadList(); }, [loadList]));

  const handleGenerate = async () => {
    setGenLoading(true);
    try {
      const data = await generateShoppingList();
      setList(data.list);
      setDontBuy(data.dontBuy || []);
    } catch (err: any) { Alert.alert('Error', err.message); }
    setGenLoading(false);
  };

  const handleAdd = async () => {
    if (!addText.trim()) return;
    try {
      const data = await addShoppingItem(addText);
      setList(data.list);
      setAddText('');
    } catch (err: any) { Alert.alert('Error', err.message); }
  };

  const handleToggle = async (index: number) => {
    try {
      const data = await toggleShoppingItem(index);
      setList(data.list);
    } catch (err: any) { Alert.alert('Error', err.message); }
  };

  const items = list?.items || [];
  const unchecked = items.filter((i: any) => !i.checked);
  const checked = items.filter((i: any) => i.checked);

  return (
    <SafeAreaView style={SharedStyles.container}>
      <View style={SharedStyles.header}>
        <View>
          <Text style={SharedStyles.headerTitle}>Shopping List</Text>
          <Text style={SharedStyles.headerSub}>{unchecked.length} items to buy</Text>
        </View>
        <TouchableOpacity
          style={[SharedStyles.btnSecondary, genLoading && { opacity: 0.7 }]}
          onPress={handleGenerate}
          disabled={genLoading}
        >
          {genLoading ? (
            <ActivityIndicator size="small" color={Colors.accent} />
          ) : (
            <Text style={SharedStyles.btnSecondaryText}>🤖 AI Generate</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={SharedStyles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadList(); }} tintColor={Colors.accent} />}
      >
        {/* Add Input */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <TextInput
            style={[SharedStyles.input, { flex: 1 }]}
            placeholder="Add item..."
            placeholderTextColor={Colors.textMuted}
            value={addText}
            onChangeText={setAddText}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <TouchableOpacity style={SharedStyles.btnSecondary} onPress={handleAdd}>
            <Text style={SharedStyles.btnSecondaryText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Don't Buy Warning */}
        {dontBuy.length > 0 && (
          <View style={[SharedStyles.card, { backgroundColor: Colors.amberBg, borderColor: Colors.amber + '33' }]}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.amber, marginBottom: 6 }}>
              ⚠️ Don't buy — already have
            </Text>
            {dontBuy.map((item, i) => (
              <Text key={i} style={{ fontSize: 12, color: Colors.text, paddingVertical: 2 }}>
                {item.name} — {item.reason}
              </Text>
            ))}
          </View>
        )}

        {loading ? (
          <View style={SharedStyles.empty}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : items.length === 0 ? (
          <View style={SharedStyles.empty}>
            <Text style={SharedStyles.emptyIcon}>🛒</Text>
            <Text style={SharedStyles.emptyText}>No shopping list yet</Text>
            <Text style={SharedStyles.emptySub}>Add items or let AI generate</Text>
          </View>
        ) : (
          <>
            {/* Unchecked */}
            {unchecked.length > 0 && (
              <View style={SharedStyles.card}>
                <Text style={SharedStyles.label}>Need to buy</Text>
                {items.map((item: any, idx: number) => !item.checked && (
                  <TouchableOpacity key={idx} style={SharedStyles.itemRow} onPress={() => handleToggle(idx)}>
                    <View style={s.uncheckedCircle} />
                    <View style={{ flex: 1 }}>
                      <Text style={SharedStyles.itemName}>{item.name}</Text>
                      {item.reason && <Text style={SharedStyles.itemMeta}>{item.reason}</Text>}
                    </View>
                    {item.autoGenerated && (
                      <View style={[SharedStyles.badge, { backgroundColor: Colors.blueBg }]}>
                        <Text style={[SharedStyles.badgeText, { color: Colors.blue }]}>AI</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Checked */}
            {checked.length > 0 && (
              <View style={[SharedStyles.card, { opacity: 0.6 }]}>
                <Text style={SharedStyles.label}>Done ({checked.length})</Text>
                {items.map((item: any, idx: number) => item.checked && (
                  <TouchableOpacity key={idx} style={SharedStyles.itemRow} onPress={() => handleToggle(idx)}>
                    <View style={s.checkedCircle}>
                      <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>
                    </View>
                    <Text style={s.checkedText}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  uncheckedCircle: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.border,
  },
  checkedCircle: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.green,
    alignItems: 'center', justifyContent: 'center',
  },
  checkedText: {
    fontSize: 14, color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
});
