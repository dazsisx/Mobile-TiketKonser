import { Redirect } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';

export default function IndexScreen() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return <Redirect href={user ? '/(tabs)' : '/(auth)/welcome'} />;
}
