import { Redirect, Tabs } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { HapticTab } from '@/components/haptic-tab';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user || user.role !== 'pelanggan') return <Redirect href="/(auth)/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0F766E',
        tabBarInactiveTintColor: '#89938E',
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: 62,
          paddingTop: 5,
          paddingBottom: 5,
          borderTopColor: '#E8ECE8',
          backgroundColor: '#FFFFFF',
        },
        tabBarLabelStyle: { fontSize: 9, fontWeight: '700' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home-filled" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Jelajah',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="explore" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pesanan',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="confirmation-number" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="favorite" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
