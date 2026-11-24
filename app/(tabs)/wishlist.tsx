import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import EventCard from '@/components/events/event-card';
import { ErrorBanner, LoadingState } from '@/components/ui/mobile-ui';
import { fetchWishlist, removeFromWishlist, type EventItem } from '@/utils/api';

export default function WishlistScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState<number | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      setEvents(await fetchWishlist());
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Wishlist gagal dimuat.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  async function remove(event: EventItem) {
    setRemovingId(event.id);
    setError('');
    try {
      await removeFromWishlist(event.id);
      setEvents((current) => current.filter((item) => item.id !== event.id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Event gagal dihapus dari wishlist.');
    } finally {
      setRemovingId(null);
    }
  }

  function openEvent(event: EventItem) {
    router.push({ pathname: '/events/[id]', params: { id: String(event.id) } });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor="#0F766E" />}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>AKUN SAYA</Text>
        <Text style={styles.title}>Wishlist</Text>
        <Text style={styles.subtitle}>Event yang ingin kamu datangi.</Text>
        {error ? (
          <View style={styles.errorBlock}>
            <ErrorBanner message={error} />
            <Pressable onPress={() => void load(true)} style={styles.retry}><Text style={styles.retryText}>Coba lagi</Text></Pressable>
          </View>
        ) : null}
        {loading ? (
          <LoadingState label="Memuat wishlist..." />
        ) : events.length ? (
          events.map((event, index) => (
            <View key={event.id}>
              <EventCard event={event} onPress={() => openEvent(event)} index={index} />
              <Pressable
                accessibilityRole="button"
                disabled={removingId === event.id}
                onPress={() => void remove(event)}
                style={styles.removeButton}>
                <MaterialIcons name="delete-outline" size={16} color="#B42318" />
                <Text style={styles.removeText}>
                  {removingId === event.id ? 'Menghapus...' : 'Hapus dari wishlist'}
                </Text>
              </Pressable>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="favorite-border" size={35} color="#E11D48" />
            <Text style={styles.emptyTitle}>Wishlist masih kosong</Text>
            <Text style={styles.emptyText}>Simpan event favoritmu agar mudah ditemukan lagi.</Text>
            <Pressable onPress={() => router.push('/(tabs)/explore')} style={styles.exploreButton}>
              <Text style={styles.exploreText}>Jelajahi event</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFBF5' },
  content: { paddingHorizontal: 20, paddingTop: 19, paddingBottom: 26, width: '100%', maxWidth: 680, alignSelf: 'center', flexGrow: 1 },
  eyebrow: { color: '#D68B26', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: '#1F2937', fontSize: 27, fontWeight: '900', marginTop: 5 },
  subtitle: { color: '#6B7280', fontSize: 12, marginTop: 5, marginBottom: 19 },
  errorBlock: { marginBottom: 8 },
  retry: { alignSelf: 'flex-end', paddingVertical: 8 },
  retryText: { color: '#0F766E', fontSize: 12, fontWeight: '800' },
  removeButton: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, marginTop: -12, marginBottom: 14 },
  removeText: { color: '#B42318', fontSize: 10, fontWeight: '800' },
  emptyState: { flex: 1, minHeight: 270, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 25, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 19 },
  emptyTitle: { color: '#1F2937', fontSize: 16, fontWeight: '900', marginTop: 12 },
  emptyText: { color: '#89938E', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6 },
  exploreButton: { marginTop: 17, backgroundColor: '#0F766E', borderRadius: 13, paddingHorizontal: 17, paddingVertical: 11 },
  exploreText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
});
