import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Colors, SharedStyles, CategoryIcons, CategoryBg } from '../../constants/theme';
import { scanImage, bulkAddItems } from '../../services/api';
import { router } from 'expo-router';

export default function ScanScreen() {
  const [scanType, setScanType] = useState<'photo' | 'receipt'>('photo');
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to scan groceries');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      processImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow camera access to scan groceries');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      processImage(result.assets[0].uri);
    }
  };

  const processImage = async (uri: string) => {
    setImageUri(uri);
    setScanning(true);
    setResults(null);
    try {
      const data = await scanImage(uri, scanType);
      setResults(data);
    } catch (err: any) {
      Alert.alert('Scan failed', err.message + '\n\nMake sure OPENAI_API_KEY is set in your .env file.');
      setImageUri(null);
    }
    setScanning(false);
  };

  const confirmItems = async () => {
    if (!results?.items?.length) return;
    try {
      await bulkAddItems(
        results.items.map((i: any) => ({
          name: i.name,
          category: i.category || 'other',
          quantity: i.quantity || 1,
          unit: i.unit || 'item',
          expiryDate: i.expiryDate,
          confidence: i.confidence,
        })),
        results.scanSessionId
      );
      Alert.alert('Success', `${results.items.length} items added to pantry!`);
      setResults(null);
      setImageUri(null);
      router.navigate('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const reset = () => {
    setResults(null);
    setImageUri(null);
    setScanning(false);
  };

  return (
    <SafeAreaView style={SharedStyles.container}>
      <View style={SharedStyles.header}>
        <View>
          <Text style={SharedStyles.headerTitle}>Scan Groceries</Text>
          <Text style={SharedStyles.headerSub}>Photo or receipt — AI detects everything</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={SharedStyles.scrollContent}>
        {/* Scan Type Picker */}
        {!results && !scanning && (
          <>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {([['photo', '📸', 'Grocery Photo'], ['receipt', '🧾', 'Receipt']] as const).map(([type, icon, label]) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setScanType(type)}
                  style={[
                    SharedStyles.card,
                    { flex: 1, alignItems: 'center', marginBottom: 0 },
                    scanType === type && { borderColor: Colors.accent, borderWidth: 2, backgroundColor: Colors.bgWarm },
                  ]}
                >
                  <Text style={{ fontSize: 28, marginBottom: 4 }}>{icon}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600' }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Camera / Gallery Buttons */}
            <TouchableOpacity onPress={takePhoto} style={[s.uploadBox, { marginBottom: 10 }]}>
              <Text style={{ fontSize: 42, marginBottom: 8 }}>📷</Text>
              <Text style={s.uploadTitle}>Take a Photo</Text>
              <Text style={s.uploadSub}>Open camera to snap your groceries</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={pickImage} style={s.uploadBox}>
              <Text style={{ fontSize: 42, marginBottom: 8 }}>🖼️</Text>
              <Text style={s.uploadTitle}>Pick from Gallery</Text>
              <Text style={s.uploadSub}>Choose an existing photo or receipt</Text>
            </TouchableOpacity>

            <View style={[SharedStyles.card, { backgroundColor: Colors.blueBg, marginTop: 12 }]}>
              <Text style={{ fontSize: 13, color: Colors.blue, lineHeight: 20 }}>
                <Text style={{ fontWeight: '700' }}>💡 Tip: </Text>
                Make sure OPENAI_API_KEY is set in your .env file. Spread groceries on a table for best results.
              </Text>
            </View>
          </>
        )}

        {/* Scanning State */}
        {scanning && (
          <View style={[SharedStyles.empty, { paddingVertical: 64 }]}>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={s.previewImage} />
            )}
            <ActivityIndicator size="large" color={Colors.accent} style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text }}>
              AI is analyzing your {scanType}...
            </Text>
            <Text style={{ fontSize: 13, color: Colors.textSec, marginTop: 4 }}>
              This may take a few seconds
            </Text>
          </View>
        )}

        {/* Results */}
        {results && (
          <>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={s.previewImage} />
            )}

            <View style={[SharedStyles.card, { backgroundColor: Colors.greenBg, borderColor: Colors.green + '33' }]}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.green }}>
                ✅ Detected {results.items?.length || 0} items
              </Text>
            </View>

            <View style={SharedStyles.card}>
              {results.items?.map((item: any, i: number) => (
                <View key={i} style={SharedStyles.itemRow}>
                  <View style={[SharedStyles.itemIcon, { backgroundColor: CategoryBg[item.category] || Colors.bgMuted }]}>
                    <Text style={{ fontSize: 18 }}>{CategoryIcons[item.category] || '📦'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={SharedStyles.itemName}>{item.name}</Text>
                    <Text style={SharedStyles.itemMeta}>
                      {item.quantity || 1} {item.unit || 'item'} · expires {item.expiryDate || '?'}
                    </Text>
                  </View>
                  <View style={[SharedStyles.badge, { backgroundColor: Colors.greenBg }]}>
                    <Text style={[SharedStyles.badgeText, { color: Colors.green }]}>
                      {Math.round((item.confidence || 0.9) * 100)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={[SharedStyles.btnSecondary, { flex: 1 }]} onPress={reset}>
                <Text style={SharedStyles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[SharedStyles.btnPrimary, { flex: 2 }]} onPress={confirmItems}>
                <Text style={SharedStyles.btnPrimaryText}>✓ Add All to Pantry</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  uploadBox: {
    backgroundColor: Colors.bgWarm,
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.accent + '44',
    borderStyle: 'dashed',
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.accent,
    marginBottom: 4,
  },
  uploadSub: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    marginBottom: 12,
    resizeMode: 'cover',
  },
});
