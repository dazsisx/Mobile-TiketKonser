import { useIsFocused } from '@react-navigation/native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ErrorBanner, LoadingState } from '@/components/ui/mobile-ui';
import { fetchMyOrders, formatRupiah, formatTanggal, getImageUrl, type Order } from '@/utils/api';
import { Image } from 'expo-image';

type OrderFilter = 'semua' | 'pending' | 'lunas' | 'gagal';

const filters: { id: OrderFilter; label: string }[] = [
  { id: 'semua', label: 'Semua' },
  { id: 'pending', label: 'Menunggu' },
  { id: 'lunas', label: 'Berhasil' },
  { id: 'gagal', label: 'Tidak berhasil' },
];

export default function OrdersScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderFilter>('semua');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      setOrders(await fetchMyOrders());
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Riwayat pesanan gagal dimuat.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  const visibleOrders = useMemo(() => orders.filter((order) => {
    if (filter === 'pending') return order.status_bayar === 'pending';
    if (filter === 'lunas') return order.status_bayar === 'lunas';
    if (filter === 'gagal') return order.status_bayar === 'ditolak' || order.status_bayar === 'kadaluarsa';
    return true;
  }), [filter, orders]);

  useEffect(() => {
    if (!isFocused || !orders.some((order) => order.status_bayar === 'pending')) return;
    const timer = setInterval(() => void load(), 15000);
    return () => clearInterval(timer);
  }, [isFocused, load, orders]);

  function openOrder(order: Order) {
    router.push({ pathname: '/pembelian/[id]', params: { id: String(order.id) } });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor="#0F766E" />}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>AKUN SAYA</Text>
        <Text style={styles.title}>Pesanan & tiket</Text>
        <Text style={styles.subtitle}>Pantau status pembayaran dan buka tiketmu.</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((item) => {
            const active = filter === item.id;
            return (
              <Pressable key={item.id} onPress={() => setFilter(item.id)} style={[styles.filter, active && styles.filterActive]}>
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {error ? (
          <View style={styles.errorBlock}>
            <ErrorBanner message={error} />
            <Pressable onPress={() => void load(true)} style={styles.retry}><Text style={styles.retryText}>Coba lagi</Text></Pressable>
          </View>
        ) : null}
        {loading ? (
          <LoadingState label="Memuat pesanan..." />
        ) : visibleOrders.length ? (
          visibleOrders.map((order) => <OrderCard key={order.id} order={order} onPress={() => openOrder(order)} />)
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="confirmation-number" size={36} color="#0F766E" />
            <Text style={styles.emptyTitle}>
              {orders.length ? 'Tidak ada pesanan di kategori ini' : 'Belum ada pesanan'}
            </Text>
            <Text style={styles.emptyText}>
              {orders.length ? 'Pilih filter lain untuk melihat pesananmu.' : 'Event yang kamu beli akan muncul di sini.'}
            </Text>
            {!orders.length ? (
              <Pressable onPress={() => router.push('/(tabs)/explore')} style={styles.exploreButton}>
                <Text style={styles.exploreText}>Cari event</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const isPaid = order.status_bayar === 'lunas';
  const isPending = order.status_bayar === 'pending';
  const statusLabel = isPaid ? 'Pembayaran berhasil' : isPending ? (order.bukti_bayar ? 'Menunggu verifikasi' : 'Menunggu pembayaran') : order.status_bayar === 'kadaluarsa' ? 'Kedaluwarsa' : 'Pembayaran ditolak';
  const poster = getImageUrl(order.event?.image_url ?? order.event?.banner ?? order.event?.poster);
  const created = order.createdAt ?? order.created_at;

  return (
    <Pressable onPress={onPress} style={styles.orderCard}>
      <View style={styles.orderTop}>
        <Text style={styles.orderNumber}>PESANAN #{order.id}</Text>
        <View style={[styles.statusBadge, isPaid ? styles.statusPaid : isPending ? styles.statusPending : styles.statusFailed]}>
          <Text style={[styles.statusText, isPaid ? styles.statusPaidText : isPending ? styles.statusPendingText : styles.statusFailedText]}>{statusLabel}</Text>
        </View>
      </View>
      <View style={styles.orderContent}>
        <View style={styles.posterWrap}>
          {poster ? <Image source={{ uri: poster }} contentFit="cover" style={styles.poster} /> : <MaterialIcons name="confirmation-number" size={24} color="#AAB8B0" />}
        </View>
        <View style={styles.orderInfo}>
          <Text numberOfLines={2} style={styles.eventName}>{order.event?.nama_event ?? 'Event'}</Text>
          <Text style={styles.meta}>{order.kategori_tiket?.nama_kelas ?? 'Kategori tiket'} · {order.jumlah} tiket</Text>
          <Text style={styles.meta}>{created ? formatTanggal(created) : 'Tanggal tidak tersedia'}</Text>
          <Text style={styles.total}>{formatRupiah(order.total_harga)}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color="#9CA3AF" />
      </View>
      <View style={styles.orderFooter}>
        <Text style={styles.code}>{order.kode_tiket ?? 'Kode booking belum tersedia'}</Text>
        <Text style={styles.details}>Lihat detail</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFBF5' },
  content: { paddingHorizontal: 20, paddingTop: 19, paddingBottom: 26, width: '100%', maxWidth: 680, alignSelf: 'center', flexGrow: 1 },
  eyebrow: { color: '#D68B26', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: '#1F2937', fontSize: 26, fontWeight: '900', marginTop: 5 },
  subtitle: { color: '#6B7280', fontSize: 12, marginTop: 5 },
  filters: { gap: 8, paddingVertical: 17 },
  filter: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 17, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  filterActive: { backgroundColor: '#0F766E', borderColor: '#0F766E' },
  filterText: { color: '#6B7280', fontSize: 10, fontWeight: '800' },
  filterTextActive: { color: '#FFFFFF' },
  errorBlock: { marginBottom: 8 },
  retry: { alignSelf: 'flex-end', paddingVertical: 8 },
  retryText: { color: '#0F766E', fontSize: 12, fontWeight: '800' },
  emptyState: { flex: 1, minHeight: 270, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 25, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 19 },
  emptyTitle: { color: '#1F2937', fontSize: 15, fontWeight: '900', marginTop: 12, textAlign: 'center' },
  emptyText: { color: '#89938E', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 6 },
  exploreButton: { marginTop: 16, backgroundColor: '#0F766E', borderRadius: 13, paddingHorizontal: 18, paddingVertical: 11 },
  exploreText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  orderCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 13, marginBottom: 12 },
  orderTop: { minHeight: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  orderNumber: { color: '#1F2937', fontSize: 9, fontWeight: '900' },
  statusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5 },
  statusPaid: { backgroundColor: '#ECFDF5' },
  statusPending: { backgroundColor: '#FFFBEB' },
  statusFailed: { backgroundColor: '#FEF2F2' },
  statusText: { fontSize: 9, fontWeight: '800' },
  statusPaidText: { color: '#047857' },
  statusPendingText: { color: '#B45309' },
  statusFailedText: { color: '#B42318' },
  orderContent: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  posterWrap: { width: 61, height: 75, backgroundColor: '#F3F6F2', borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  poster: { width: '100%', height: '100%' },
  orderInfo: { flex: 1 },
  eventName: { color: '#1F2937', fontSize: 12, fontWeight: '900' },
  meta: { color: '#89938E', fontSize: 9, marginTop: 4 },
  total: { color: '#D68B26', fontSize: 12, fontWeight: '900', marginTop: 6 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  code: { color: '#89938E', fontSize: 9 },
  details: { color: '#0F766E', fontSize: 9, fontWeight: '900' },
});
