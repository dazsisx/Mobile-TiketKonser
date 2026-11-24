import { Platform } from 'react-native';

const TOKEN_KEY = 'drstar_token';
const USER_KEY = 'drstar_user';
const RESET_EMAIL_KEY = 'drstar_reset_email';
const RESET_TOKEN_KEY = 'drstar_reset_token';

export type StoredUser = {
  id: number;
  nama: string;
  email: string;
  role: 'admin' | 'admin_offline' | 'pelanggan';
  avatar_url?: string | null;
  no_telepon?: string | null;
};

async function getValue(key: string) {
  if (Platform.OS === 'web') {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  }
  const SecureStore = await import('expo-secure-store');
  return SecureStore.getItemAsync(key);
}

async function setValue(key: string, value: string) {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    return;
  }
  const SecureStore = await import('expo-secure-store');
  await SecureStore.setItemAsync(key, value);
}

async function removeValue(key: string) {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    return;
  }
  const SecureStore = await import('expo-secure-store');
  await SecureStore.deleteItemAsync(key);
}

export async function getStoredToken() {
  return getValue(TOKEN_KEY);
}

export async function getStoredUser() {
  const rawUser = await getValue(USER_KEY);
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as StoredUser;
  } catch {
    await removeValue(USER_KEY);
    return null;
  }
}

export async function saveSession(token: string, user: StoredUser) {
  try {
    await setValue(TOKEN_KEY, token);
    await setValue(USER_KEY, JSON.stringify(user));
  } catch (error) {
    await clearSession();
    throw error;
  }
}

export async function saveStoredUser(user: StoredUser) {
  await setValue(USER_KEY, JSON.stringify(user));
}

export async function clearSession() {
  await Promise.all([removeValue(TOKEN_KEY), removeValue(USER_KEY)]);
}

export async function saveResetEmail(email: string) {
  await setValue(RESET_EMAIL_KEY, email);
}

export async function getResetEmail() {
  return getValue(RESET_EMAIL_KEY);
}

export async function saveResetToken(token: string) {
  await setValue(RESET_TOKEN_KEY, token);
}

export async function getResetToken() {
  return getValue(RESET_TOKEN_KEY);
}

export async function clearPasswordReset() {
  await Promise.all([removeValue(RESET_EMAIL_KEY), removeValue(RESET_TOKEN_KEY)]);
}
