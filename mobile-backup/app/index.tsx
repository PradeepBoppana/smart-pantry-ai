import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, SharedStyles } from '../constants/theme';
import { login, register, getToken } from '../services/api';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) router.replace('/(tabs)');
      } catch (e) {
        console.log('Auth check failed:', e);
      }
      setChecking(false);
    })();
  }, []);

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Missing fields', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    }
    setLoading(false);
  };

  if (checking) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 56 }}>🥕</Text>
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logo}>
          <Text style={{ fontSize: 56 }}>🥕</Text>
          <Text style={styles.title}>Smart Pantry AI</Text>
          <Text style={styles.subtitle}>Your kitchen memory</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Toggle */}
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, isLogin && styles.toggleActive]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={[styles.toggleText, isLogin && styles.toggleActiveText]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, !isLogin && styles.toggleActive]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={[styles.toggleText, !isLogin && styles.toggleActiveText]}>Register</Text>
            </TouchableOpacity>
          </View>

          {/* Name field */}
          {!isLogin && (
            <View style={styles.field}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={SharedStyles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          )}

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={SharedStyles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <View style={[styles.field, { marginBottom: 24 }]}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={SharedStyles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              onSubmitEditing={handleSubmit}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[SharedStyles.btnPrimary, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={SharedStyles.btnPrimaryText}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          Your AI-powered kitchen companion
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    alignItems: 'center',
    marginBottom: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSec,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.bgMuted,
    borderRadius: 10,
    padding: 3,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleActive: {
    backgroundColor: Colors.bgCard,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  toggleActiveText: {
    color: Colors.text,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSec,
    marginBottom: 6,
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 16,
  },
});
