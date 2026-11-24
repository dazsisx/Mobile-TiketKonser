import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { AppScreen, ErrorBanner, LoadingState } from '@/components/ui/mobile-ui';
import {
  addToWishlist,
  fetchEventById,
  fetchWishlist,
  formatJam,
  formatRupiah,
  formatTanggal,
  getHargaTermurah,
  getImageUrl,
  removeFromWishlist,
  type EventItem,
} from '@/utils/api';

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wishlist, setWishlist] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [wishlistError, setWishlistError] = useState('');
  const [activeTab, setActiveTab] = useState<'deskripsi' | 'kreator'>('deskripsi');

  const load = useCallback(async () => {
    try {
      const eventData = await fetchEventById(id);
      setEvent(eventData);
      setError('');
      try {
        const savedEvents = await fetchWishlist();
        setWishlist(savedEvents.some((item) => item.id === eventData.id));
        setWishlistError('');
      } catch (caught) {
        setWishlistError(caught instanceof Error ? caught.message : 'Wishlist gagal dimuat.');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Event gagal dimuat.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleWishlist() {
    if (!event || wishlistBusy) return;
    setWishlistBusy(true);
    setWishlistError('');
    try {
      if (wishlist) await removeFromWishlist(event.id);
      else await addToWishlist(event.id);
      setWishlist((current) => !current);
    } catch (caught) {
      setWishlistError(caught instanceof Error ? caught.message : 'Wishlist gagal diperbarui.');
    } finally {
      setWishlistBusy(false);
    }
  }

  async function shareEvent() {
    if (!event) return;
    try {
      await Share.share({
        title: event.nama_event,
        message: `${event.nama_event} · ${event.lokasi} · ${formatTanggal(event.tanggal)}`,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Event gagal dibagikan.');
    }
  }

  if (loading) return <AppScreen scroll={false}><LoadingState label="Memuat detail event..." /></AppScreen>;
  if (error || !event) {
    return (
      <AppScreen>
        <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹  Kembali</Text></Pressable>
        <ErrorBanner message={error || 'Event tidak ditemukan.'} />
        <Pressable onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>Coba lagi</Text></Pressable>
      </AppScreen>
    );
  }

  const poster = getImageUrl(event.poster ?? event.image_url ?? event.banner);
  const price = event.kategori_tiket?.length
    ? `Mulai ${getHargaTermurah(event.kategori_tiket)}`
    : 'Harga belum tersedia';
  const saleOpen = event.status === 'aktif' && Boolean(event.kategori_tiket?.some((tier) => tier.kuota > tier.terjual));

  return (
    <AppScreen>
      <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹  Kembali ke event</Text></Pressable>
      <View style={styles.posterWrap}>
        {poster ? (
          <Image source={{ uri: poster }} contentFit="cover" style={styles.poster} />
        ) : (
          <View style={styles.posterFallback}><MaterialIcons name="image" size={40} color="#AAB8B0" /><Text style={styles.fallbackText}>Poster belum diunggah</Text></View>
        )}
        <View style={styles.statusBadge}><Text style={styles.statusText}>{event.status === 'aktif' ? 'PENJUALAN DIBUKA' : event.status.toUpperCase()}</Text></View>
      </View>

      <View style={styles.titleRow}>
        <View style={styles.titleCopy}>
          <Text style={styles.title}>{event.nama_event}</Text>
          <Text style={styles.creator}>oleh {event.artis?.nama ?? 'Promotor'}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={wishlist ? 'Hapus dari wishlist' : 'Simpan ke wishlist'}
          onPress={() => void toggleWishlist()}
          disabled={wishlistBusy}
          style={styles.iconButton}>
          <MaterialIcons name={wishlist ? 'favorite' : 'favorite-border'} size={22} color={wishlist ? '#E11D48' : '#0F766E'} />
        </Pressable>
      </View>
      {wishlistError ? <ErrorBanner message={wishlistError} /> : null}
      <Pressable onPress={() => void shareEvent()} style={styles.shareButton}>
        <MaterialIcons name="share" size={16} color="#0F766E" />
        <Text style={styles.shareText}>Bagikan event</Text>
      </Pressable>

      <View style={styles.facts}>
        <Fact icon="event" label="Tanggal" value={formatTanggal(event.tanggal)} />
        <Fact icon="schedule" label="Waktu" value={formatJam(event.tanggal)} />
        <Fact icon="place" label="Lokasi" value={event.lokasi} />
      </View>

      <View style={styles.priceCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.priceLabel}>Harga tiket</Text>
          <Text style={styles.price}>{price}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={!saleOpen}
          onPress={() => router.push({ pathname: '/pembelian/tiket/[id]', params: { id: String(event.id) } })}
          style={[styles.buyButton, !saleOpen && styles.buyDisabled]}>
          <Text style={styles.buyText}>{saleOpen ? 'Beli tiket' : 'Tiket tidak tersedia'}</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <Pressable onPress={() => setActiveTab('deskripsi')} style={[styles.tab, activeTab === 'deskripsi' && styles.activeTab]}>
          <Text style={[styles.tabText, activeTab === 'deskripsi' && styles.activeTabText]}>Deskripsi</Text>
        </Pressable>
        <Pressable onPress={() => setActiveTab('kreator')} style={[styles.tab, activeTab === 'kreator' && styles.activeTab]}>
          <Text style={[styles.tabText, activeTab === 'kreator' && styles.activeTabText]}>Profil kreator</Text>
        </Pressable>
      </View>
      <Text style={styles.bodyText}>
        {activeTab === 'deskripsi'
          ? event.deskripsi || 'Belum ada deskripsi untuk event ini.'
          : event.artis?.bio || 'Belum ada profil kreator untuk event ini.'}
      </Text>

      <View style={styles.ticketSection}>
        <Text style={styles.sectionTitle}>Kategori tiket</Text>
        {event.kategori_tiket?.length ? event.kategori_tiket.map((tier) => (
          <View key={tier.id} style={styles.tierRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tierName}>{tier.nama_kelas}</Text>
              <Text style={styles.tierStock}>{Math.max(0, tier.sisa_kuota ?? tier.kuota - tier.terjual)} tiket tersedia</Text>
            </View>
            <Text style={styles.tierPrice}>{formatRupiah(tier.harga)}</Text>
          </View>
        )) : <Text style={styles.fallbackText}>Belum ada kategori tiket.</Text>}
      </View>
    </AppScreen>
  );
}

function Fact({ icon, label, value }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <MaterialIcons name={icon} size={19} color="#0F766E" />
      <View style={{ flex: 1 }}>
        <Text style={styles.factLabel}>{label}</Text>
        <Text style={styles.factValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { paddingVertical: 8, marginBottom: 8 },
  backText: { color: '#0F766E', fontSize: 13, fontWeight: '800' },
  posterWrap: { height: 245, borderRadius: 19, overflow: 'hidden', backgroundColor: '#E8EFE9' },
  poster: { width: '100%', height: '100%' },
  posterFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  fallbackText: { color: '#89938E', fontSize: 12 },
  statusBadge: { position: 'absolute', left: 12, top: 12, borderRadius: 8, backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { color: '#0F766E', fontSize: 9, fontWeight: '900' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginTop: 16 },
  titleCopy: { flex: 1 },
  title: { color: '#1F2937', fontSize: 24, lineHeight: 29, fontWeight: '900' },
  creator: { color: '#6B7280', fontSize: 12, marginTop: 6 },
  iconButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  shareButton: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 11 },
  shareText: { color: '#0F766E', fontSize: 11, fontWeight: '800' },
  facts: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8ECE8', borderRadius: 16, paddingHorizontal: 13, paddingVertical: 4, marginTop: 17 },
  fact: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#F0F2EF' },
  factLabel: { color: '#89938E', fontSize: 10 },
  factValue: { color: '#1F2937', fontSize: 12, fontWeight: '700', marginTop: 3 },
  priceCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF7E8', borderRadius: 16, borderWidth: 1, borderColor: '#F5E5C5', padding: 14, marginTop: 14 },
  priceLabel: { color: '#6B7280', fontSize: 10 },
  price: { color: '#D68B26', fontSize: 16, fontWeight: '900', marginTop: 4 },
  buyButton: { minHeight: 43, borderRadius: 13, backgroundColor: '#0F766E', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 14 },
  buyDisabled: { backgroundColor: '#9CA3AF' },
  buyText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  tabs: { flexDirection: 'row', gap: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginTop: 23 },
  tab: { paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#0F766E' },
  tabText: { color: '#89938E', fontSize: 12, fontWeight: '700' },
  activeTabText: { color: '#0F766E' },
  bodyText: { color: '#6B7280', fontSize: 13, lineHeight: 21, marginTop: 14 },
  ticketSection: { marginTop: 24 },
  sectionTitle: { color: '#1F2937', fontSize: 17, fontWeight: '900', marginBottom: 10 },
  tierRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#E8ECE8' },
  tierName: { color: '#1F2937', fontSize: 13, fontWeight: '800' },
  tierStock: { color: '#89938E', fontSize: 10, marginTop: 4 },
  tierPrice: { color: '#D68B26', fontSize: 12, fontWeight: '800' },
  retry: { alignSelf: 'flex-end', paddingVertical: 10 },
  retryText: { color: '#0F766E', fontWeight: '800' },
});
