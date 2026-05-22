import * as SecureStore from 'expo-secure-store';

// Change this to your computer's local IP when testing on a physical device
// Use 'localhost' for iOS simulator, '10.0.2.2' for Android emulator
const API_BASE = 'http://localhost:3000/api';

let authToken: string | null = null;

export async function initAuth() {
  authToken = await SecureStore.getItemAsync('sp_token');
}

export async function getToken() {
  if (!authToken) {
    authToken = await SecureStore.getItemAsync('sp_token');
  }
  return authToken;
}

export async function setToken(token: string) {
  authToken = token;
  await SecureStore.setItemAsync('sp_token', token);
}

export async function clearToken() {
  authToken = null;
  await SecureStore.deleteItemAsync('sp_token');
  await SecureStore.deleteItemAsync('sp_user');
}

export async function saveUser(user: any) {
  await SecureStore.setItemAsync('sp_user', JSON.stringify(user));
}

export async function getUser() {
  const u = await SecureStore.getItemAsync('sp_user');
  return u ? JSON.parse(u) : null;
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const headers: any = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ============ AUTH ============
export async function login(email: string, password: string) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  await setToken(data.token);
  await saveUser(data.user);
  return data;
}

export async function register(name: string, email: string, password: string) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  await setToken(data.token);
  await saveUser(data.user);
  return data;
}

// ============ PANTRY ============
export async function getPantry() {
  return apiFetch('/pantry');
}

export async function addPantryItem(item: {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
}) {
  return apiFetch('/pantry', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function markItemUsed(id: string) {
  return apiFetch(`/pantry/${id}/use`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function bulkAddItems(items: any[], scanSessionId?: string) {
  return apiFetch('/pantry/bulk', {
    method: 'POST',
    body: JSON.stringify({ items, scanSessionId }),
  });
}

// ============ SCAN ============
export async function scanImage(imageUri: string, type: 'photo' | 'receipt') {
  const token = await getToken();
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'scan.jpg',
  } as any);

  const res = await fetch(`${API_BASE}/scan/${type}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Scan failed');
  return data;
}

// ============ RECIPES ============
export async function getRecipeSuggestions(count = 5) {
  return apiFetch(`/recipes/suggest?count=${count}`);
}

// ============ SHOPPING ============
export async function getShoppingList() {
  return apiFetch('/shopping');
}

export async function generateShoppingList() {
  return apiFetch('/shopping/generate', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function addShoppingItem(name: string) {
  return apiFetch('/shopping/add', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function toggleShoppingItem(index: number) {
  return apiFetch(`/shopping/check/${index}`, {
    method: 'PUT',
    body: JSON.stringify({}),
  });
}

// ============ STATS ============
export async function getHealthScore() {
  return apiFetch('/stats/health');
}

export async function getWasteStats() {
  return apiFetch('/stats/waste');
}

export async function getSummary() {
  return apiFetch('/stats/summary');
}
