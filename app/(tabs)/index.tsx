import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { CompactEventCard } from '@/components/events/event-card';
import { BrandLogo, ErrorBanner, LoadingState } from '@/components/ui/mobile-ui';
import { useAuth } from '@/contexts/AuthContext';
import { fetchEvents, formatTanggal, getHargaTermurah, getImageUrl, type EventItem } from '@/utils/api';

export default function HomeScreen() {
  const router = useRouter();
  const { user, startupError } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadEvents = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else if (!events.length) setLoading(true);
    try {
      const result = await fetchEvents();
      setEvents(result.filter((event) => event.status !== 'draft'));
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Event gagal dimuat.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [events.length]);

  useFocusEffect(useCallback(() => {
    void loadEvents();
  }, [loadEvents]));

  const upcoming = events
    .filter((event) => new Date(event.tanggal).getTime() >= Date.now())
    .sort((left, right) => new Date(left.tanggal).getTime() - new Date(right.tanggal).getTime());
  const featured = upcoming[0] ?? events[0];
  const spotlight = upcoming.slice(featured === upcoming[0] ? 1 : 0, 7);
  const genres = Array.from(
    new Set(events.map((event) => event.artis?.genre?.trim()).filter((genre): genre is string => Boolean(genre)))
  ).slice(0, 4);

  function openEvent(event: EventItem) {
    router.push({ pathname: '/events/[id]', params: { id: String(event.id) } });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadEvents(true)} tintColor="#0F766E" />}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <BrandLogo size={42} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buka profil"
            onPress={() => router.push('/(tabs)/profile')}
            style={styles.avatar}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} contentFit="cover" style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {user?.nama.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() ?? 'DR'}
              </Text>
            )}
          </Pressable>
        </View>

        <Animated.Text
          entering={FadeInDown.delay(80).springify().damping(18).stiffness(115)}
          style={styles.greeting}>
          Halo, {user?.nama.split(' ')[0] ?? 'teman'}!
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.delay(140).springify().damping(18).stiffness(115)}
          style={styles.subtitle}>
          Waktunya bikin cerita baru.
        </Animated.Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/explore')}
          style={styles.search}>
          <MaterialIcons name="search" size={21} color="#73817B" />
          <Text style={styles.searchText}>Cari event favoritmu</Text>
          <MaterialIcons name="tune" size={20} color="#53736A" />
        </Pressable>

        {startupError ? <ErrorBanner message={`Sesi tersimpan, tetapi belum dapat diperiksa: ${startupError}`} /> : null}
        {error ? (
          <View style={styles.errorBlock}>
            <ErrorBanner message={error} />
            <Pressable onPress={() => void loadEvents(true)} style={styles.retry}>
              <Text style={styles.retryText}>Coba lagi</Text>
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <LoadingState label="Memuat event..." />
        ) : (
          <>
            {featured ? (
              <Animated.View entering={FadeInUp.delay(180).springify().damping(17).stiffness(100)}>
                <Pressable onPress={() => openEvent(featured)} style={styles.hero}>
                  {getImageUrl(featured.poster ?? featured.image_url ?? featured.banner) ? (
                    <Image
                      source={{ uri: getImageUrl(featured.poster ?? featured.image_url ?? featured.banner) ?? '' }}
                      contentFit="cover"
                      style={StyleSheet.absoluteFill}
                    />
                  ) : null}
                  <View style={styles.heroShade} />
                  <View style={styles.heroContent}>
                    <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>EVENT TERDEKAT</Text></View>
                    <Text numberOfLines={2} style={styles.heroTitle}>{featured.nama_event}</Text>
                    <Text numberOfLines={1} style={styles.heroInfo}>
                      {formatTanggal(featured.tanggal)} · {featured.lokasi}
                    </Text>
                    <View style={styles.heroFooter}>
                      <Text style={styles.heroPrice}>
                        {featured.kategori_tiket?.length ? `Mulai ${getHargaTermurah(featured.kategori_tiket)}` : 'Lihat tiket'}
                      </Text>
                      <View style={styles.heroArrow}><MaterialIcons name="arrow-forward" size={17} color="#1F2937" /></View>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ) : (
              <View style={styles.emptyHero}>
                <MaterialIcons name="event-busy" size={30} color="#0F766E" />
                <Text style={styles.emptyTitle}>Belum ada event tersedia</Text>
                <Text style={styles.emptyText}>Event baru akan muncul di sini.</Text>
              </View>
            )}

            {genres.length ? (
              <View style={styles.genreSection}>
                <Text style={styles.sectionTitle}>Jelajahi kategori</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreList}>
                  {genres.map((genre) => (
                    <Pressable
                      key={genre}
                      onPress={() => router.push({ pathname: '/(tabs)/explore', params: { genre } })}
                      style={styles.genreChip}>
                      <MaterialIcons name="music-note" size={16} color="#0F766E" />
                      <Text style={styles.genreText}>{genre}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionTitle}>Event pilihan</Text>
                <Text style={styles.sectionSubtitle}>Temukan pengalaman berikutnya</Text>
              </View>
              <Pressable onPress={() => router.push('/(tabs)/explore')}>
                <Text style={styles.seeAll}>Lihat semua</Text>
              </Pressable>
            </View>
            {spotlight.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventRail}>
                {spotlight.map((event, index) => (
                  <CompactEventCard key={event.id} event={event} onPress={() => openEvent(event)} index={index} />
                ))}
              </ScrollView>
            ) : !featured && !error ? (
              <Text style={styles.emptyText}>Cek kembali nanti untuk event terbaru.</Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFBF5' },
  content: { paddingHorizontal: 20, paddingTop: 13, paddingBottom: 26, width: '100%', maxWidth: 680, alignSelf: 'center', flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  avatar: { width: 42, height: 42, borderRadius: 15, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#D5EFE5' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: '#0F766E', fontSize: 13, fontWeight: '900' },
  greeting: { color: '#1F2937', fontSize: 24, fontWeight: '900' },
  subtitle: { color: '#6B7280', fontSize: 13, marginTop: 3, marginBottom: 17 },
  search: { height: 51, borderRadius: 15, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 19 },
  searchText: { flex: 1, color: '#89938E', fontSize: 12 },
  errorBlock: { marginBottom: 14 },
  retry: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 4 },
  retryText: { color: '#0F766E', fontSize: 12, fontWeight: '800' },
  hero: { minHeight: 226, borderRadius: 22, overflow: 'hidden', backgroundColor: '#19483D', justifyContent: 'flex-end', marginBottom: 23 },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20, 42, 34, 0.62)' },
  heroContent: { padding: 18 },
  heroBadge: { alignSelf: 'flex-start', borderRadius: 7, backgroundColor: '#F59E0B', paddingHorizontal: 9, paddingVertical: 5, marginBottom: 10 },
  heroBadgeText: { color: '#1F2937', fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  heroTitle: { color: '#FFFFFF', fontSize: 22, lineHeight: 27, fontWeight: '900', maxWidth: 280 },
  heroInfo: { color: '#E5E7EB', fontSize: 11, marginTop: 6 },
  heroFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 13 },
  heroPrice: { color: '#FCD34D', fontSize: 12, fontWeight: '800' },
  heroArrow: { width: 32, height: 32, borderRadius: 11, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  emptyHero: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', minHeight: 180, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 23 },
  emptyTitle: { color: '#1F2937', fontSize: 15, fontWeight: '800', marginTop: 10 },
  emptyText: { color: '#89938E', fontSize: 12, marginTop: 5 },
  genreSection: { marginBottom: 22 },
  sectionTitle: { color: '#1F2937', fontSize: 17, fontWeight: '900' },
  genreList: { gap: 8, paddingTop: 11 },
  genreChip: { flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 },
  genreText: { color: '#45564E', fontSize: 11, fontWeight: '700' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionSubtitle: { color: '#89938E', fontSize: 11, marginTop: 4 },
  seeAll: { color: '#0F766E', fontSize: 11, fontWeight: '800' },
  eventRail: { gap: 11, paddingBottom: 4 },
});
