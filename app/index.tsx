import { Redirect } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';

export default function IndexScreen() {
  const { user, isLoading, isSplashVisible } = useAuth();

  // Tunggu sampai inisialisasi dan splash selesai
  if (isLoading || isSplashVisible) {
    return null;
  }

  return <Redirect href={user ? '/(tabs)' : '/(auth)/welcome'} />;
}
