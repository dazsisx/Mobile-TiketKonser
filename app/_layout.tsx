import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import LaunchSplash from '@/components/ui/launch-splash';

void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 500, fade: true });

function RootNavigator() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [showLaunchSplash, setShowLaunchSplash] = useState(true);

  useEffect(() => {
    if (isLoading || showLaunchSplash) return;
    const inAuth = segments[0] === '(auth)';
    const authEntry = inAuth && ['welcome', 'login', 'register'].includes(segments[1] ?? '');
    const isPublicRoute = inAuth || segments[0] === 'legal';
    if (!user && !isPublicRoute) router.replace('/(auth)/welcome');
    if (user && authEntry) router.replace('/(tabs)');
  }, [isLoading, router, segments, showLaunchSplash, user]);

  useEffect(() => {
    if (!isLoading) void SplashScreen.hideAsync();
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => setShowLaunchSplash(false), 1400);
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (isLoading) return null;

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 300,
          contentStyle: { backgroundColor: '#FFFBF5' },
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="events/[id]" />
        <Stack.Screen name="pembelian/tiket/[id]" />
        <Stack.Screen name="pembelian/checkout/[id]" />
        <Stack.Screen name="pembelian/[id]" />
        <Stack.Screen name="legal/terms" />
        <Stack.Screen name="legal/privacy" />
      </Stack>
      {showLaunchSplash ? <LaunchSplash /> : null}
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootNavigator />
        <StatusBar style="dark" />
      </ThemeProvider>
    </AuthProvider>
  );
}
