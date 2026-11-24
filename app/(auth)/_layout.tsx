import { Redirect, Stack, useSegments } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';

export default function AuthLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  if (isLoading) return null;
  const authEntry = ['welcome', 'login', 'register'].includes(segments[1] ?? '');
  if (user && authEntry) return <Redirect href="/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
