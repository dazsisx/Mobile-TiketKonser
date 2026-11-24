import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import LaunchSplash from '@/components/ui/launch-splash';

void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 500, fade: true });

function RootNavigator() {
  const { user, isLoading, isSplashVisible, splashMessage } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Hide native splash once JS and AuthContext are ready
    if (!isLoading) {
      void SplashScreen.hideAsync();
    }
  }, [isLoading]);

  useEffect(() => {
    // Jangan redirect saat splash masih aktif
    if (isLoading || isSplashVisible) return;

    const inAuth = segments[0] === '(auth)';
    const authEntry = inAuth && ['welcome', 'login', 'register'].includes(segments[1] ?? '');
    const isPublicRoute = inAuth || segments[0] === 'legal';

    if (!user && !isPublicRoute) {
      router.replace('/(auth)/welcome');
    }
    if (user && authEntry) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isSplashVisible, router, segments, user]);

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

      {/* Splash loading screen (sebelum login & sesudah login / transisi auth) */}
      {isSplashVisible ? <LaunchSplash message={splashMessage} /> : null}
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
