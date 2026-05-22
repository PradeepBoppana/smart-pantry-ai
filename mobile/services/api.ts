import { Platform } from 'react-native';

const API_BASE = 'https://smart-pantry-ai-production.up.railway.app/api';

let authToken: string | null = null;

const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    const SecureStore = require('expo-secure-store');
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    const SecureStore = require('expo-secure-store');
    await SecureStore.setItemAsync(key, value);
  },
  async delete(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    const SecureStore = require('expo-secure-store');
    await SecureStore.deleteItemAsync(key);
  },
};

export async function initAuth() {
  authToken = await storage.get('sp_token');
}

export async function getToken() {
  if (!authToken) {
    authToken = await storage.get('sp_token');
  }
  return authToken;
}

export async function setToken(token: string) {
  authToken = token;
  await storage.set('sp_token', token);
}

export async function clearToken() {
  authToken = null;
  await storage.delete('sp_token');
  await storage.delete('sp_user');
}

export async function saveUser(user: any) {
  await storage.set('sp_user', JSON.stringify(user));
}

export async function getUser() {
  const u = await storage.get('sp_user');
  return u ? JSON.parse(u) : null;
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const headers: any = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function login(email: string, password: string) {
  const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  await setToken(data.token);
  await saveUser(data.user);
  return data;
}

export async function register(name: string, email: string, password: string) {
  const data = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
  await setToken(data.token);
  await saveUser(data.user);
  return data;
}

export async function getPantry() { return apiFetch('/pantry'); }

export async function addPantryItem(item: { name: string; category: string; quantity: number; unit: string; expiryDate?: string }) {
  return apiFetch('/pantry', { method: 'POST', body: JSON.stringify(item) });
}

export async function markItemUsed(id: string) {
  return apiFetch('/pantry/' + id + '/use', { method: 'POST', body: JSON.stringify({}) });
}

export async function bulkAddItems(items: any[], scanSessionId?: string) {
  return apiFetch('/pantry/bulk', { method: 'POST', body: JSON.stringify({ items, scanSessionId }) });
}

export async function scanImage(imageUri: string, type: 'photo' | 'receipt') {
  const token = await getToken();
  const formData = new FormData();
  formData.append('image', { uri: imageUri, type: 'image/jpeg', name: 'scan.jpg' } as any);
  const res = await fetch(API_BASE + '/scan/' + type, { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Scan failed');
  return data;
}

export async function getRecipeSuggestions(count: number = 5) { return apiFetch('/recipes/suggest?count=' + count); }

export async function getShoppingList() { return apiFetch('/shopping'); }

export async function generateShoppingList() {
  return apiFetch('/shopping/generate', { method: 'POST', body: JSON.stringify({}) });
}

export async function addShoppingItem(name: string) {
  return apiFetch('/shopping/add', { method: 'POST', body: JSON.stringify({ name }) });
}

export async function toggleShoppingItem(index: number) {
  return apiFetch('/shopping/check/' + index, { method: 'PUT', body: JSON.stringify({}) });
}

export async function getHealthScore() { return apiFetch('/stats/health'); }
export async function getWasteStats() { return apiFetch('/stats/waste'); }
export async function getSummary() { return apiFetch('/stats/summary'); }