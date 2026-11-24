import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import EventCard from '@/components/events/event-card';
import { ErrorBanner, LoadingState } from '@/components/ui/mobile-ui';
import { addToWishlist, fetchEvents, fetchWishlist, removeFromWishlist, type EventItem } from '@/utils/api';

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ genre?: string }>();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [activeGenre, setActiveGenre] = useState('Semua');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [wishlistError, setWishlistError] = useState('');
  const [favoriteBusyId, setFavoriteBusyId] = useState<number | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const [allEvents, wishlist] = await Promise.all([fetchEvents(), fetchWishlist()]);
      setEvents(allEvents.filter((event) => event.status !== 'draft'));
      setWishlistIds(wishlist.map((event) => event.id));
      setError('');
      setWishlistError('');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Event gagal dimuat.';
      setError(message);
      setWishlistError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  const genres = useMemo(() => {
    const available = Array.from(
      new Set(events.map((event) => event.artis?.genre?.trim()).filter((genre): genre is string => Boolean(genre)))
    );
    return ['Semua', ...available];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('id-ID');
    return events.filter((event) => {
      const artistGenre = event.artis?.genre?.trim() || 'Lainnya';
      const matchesGenre = activeGenre === 'Semua' || artistGenre === activeGenre;
      const searchable = [event.nama_event, event.lokasi, event.artis?.nama, artistGenre]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('id-ID');
      return matchesGenre && (!query || searchable.includes(query));
    });
  }, [activeGenre, events, search]);

  function openEvent(event: EventItem) {
    router.push({ pathname: '/events/[id]', params: { id: String(event.id) } });
  }

  async function toggleWishlist(eventId: number) {
    setFavoriteBusyId(eventId);
    setWishlistError('');
    try {
      if (wishlistIds.includes(eventId)) {
        await removeFromWishlist(eventId);
        setWishlistIds((current) => current.filter((id) => id !== eventId));
      } else {
        await addToWishlist(eventId);
        setWishlistIds((current) => [...current, eventId]);
      }
    } catch (caught) {
      setWishlistError(caught instanceof Error ? caught.message : 'Wishlist gagal diperbarui.');
    } finally {
      setFavoriteBusyId(null);
    }
  }

  useFocusEffect(useCallback(() => {
    if (params.genre) setActiveGenre(params.genre);
  }, [params.genre]));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor="#0F766E" />}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>TEMUKAN KESERUANMU</Text>
            <Text style={styles.title}>Jelajahi event</Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/wishlist')} style={styles.heartButton}>
            <MaterialIcons name="favorite-border" size={22} color="#0F766E" />
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={21} color="#818B86" />
          <TextInput
            accessibilityLabel="Cari event, artis, atau lokasi"
            placeholder="Cari event, artis, atau lokasi"
            placeholderTextColor="#939B97"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {search ? (
            <Pressable accessibilityLabel="Hapus pencarian" onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={19} color="#818B86" />
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal contentContainerStyle={styles.categories} showsHorizontalScrollIndicator={false}>
          {genres.map((genre) => {
            const selected = genre === activeGenre;
            return (
              <Pressable
                key={genre}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setActiveGenre(genre)}
                style={[styles.categoryChip, selected && styles.categoryChipSelected]}>
                <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{genre}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Semua event</Text>
            <Text style={styles.sectionSubtitle}>{filteredEvents.length} event tersedia</Text>
          </View>
          <MaterialIcons name="sort" size={21} color="#53736A" />
        </View>

        {error ? (
          <View style={styles.errorBlock}>
            <ErrorBanner message={error} />
            <Pressable onPress={() => void load(true)} style={styles.retry}>
              <Text style={styles.retryText}>Coba lagi</Text>
            </Pressable>
          </View>
        ) : null}
        {wishlistError && !error ? <ErrorBanner message={wishlistError} /> : null}

        {loading ? (
          <LoadingState label="Memuat daftar event..." />
        ) : filteredEvents.length ? (
          filteredEvents.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => openEvent(event)}
              favorite={wishlistIds.includes(event.id)}
              onFavorite={() => void toggleWishlist(event.id)}
              index={index}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={34} color="#81928B" />
            <Text style={styles.emptyTitle}>Event tidak ditemukan</Text>
            <Text style={styles.emptyDescription}>Ubah kata kunci atau pilih kategori lain.</Text>
          </View>
        )}
        {favoriteBusyId !== null ? <Text style={styles.saving}>Memperbarui wishlist...</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFBF5' },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28, width: '100%', maxWidth: 680, alignSelf: 'center', flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  eyebrow: { color: '#678078', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 7 },
  title: { color: '#1F2937', fontSize: 27, fontWeight: '900' },
  heartButton: { width: 43, height: 43, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8ECE8', borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  searchBox: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8ECE8' },
  searchInput: { flex: 1, color: '#1F2937', fontSize: 12, paddingVertical: 0 },
  categories: { gap: 8, paddingTop: 17, paddingBottom: 23 },
  categoryChip: { paddingHorizontal: 15, height: 36, justifyContent: 'center', borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5EAE6' },
  categoryChipSelected: { backgroundColor: '#0F766E', borderColor: '#0F766E' },
  categoryText: { color: '#68756F', fontSize: 11, fontWeight: '700' },
  categoryTextSelected: { color: '#FFFFFF' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { color: '#1F2937', fontSize: 17, fontWeight: '900' },
  sectionSubtitle: { color: '#87918B', fontSize: 11, marginTop: 4 },
  errorBlock: { marginBottom: 10 },
  retry: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 4 },
  retryText: { color: '#0F766E', fontSize: 12, fontWeight: '800' },
  emptyState: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 48, backgroundColor: '#FFFFFF', borderRadius: 20 },
  emptyTitle: { color: '#1F2937', fontWeight: '800', fontSize: 15, marginTop: 12 },
  emptyDescription: { color: '#87918B', fontSize: 12, marginTop: 5, textAlign: 'center' },
  saving: { color: '#0F766E', fontSize: 11, textAlign: 'center', marginBottom: 8 },
});
