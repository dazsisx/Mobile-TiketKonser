import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ErrorBanner, LoadingState } from '@/components/ui/mobile-ui';
import { fetchMyOrder, formatJam, formatRupiah, formatTanggal, getImageUrl, type Order } from '@/utils/api';

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      setOrder(await fetchMyOrder(id));
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Detail pesanan gagal dimuat.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (order?.status_bayar !== 'pending') return;
    const timer = setInterval(() => void load(true), 15000);
    return () => clearInterval(timer);
  }, [load, order?.status_bayar]);

  async function pay() {
    if (!order?.payment_url) {
      setPaymentError('Tautan pembayaran belum tersedia untuk pesanan ini.');
      return;
    }
    setPaymentError('');
    try {
      await WebBrowser.openBrowserAsync(order.payment_url);
      await load(true);
    } catch (caught) {
      setPaymentError(caught instanceof Error ? caught.message : 'Halaman pembayaran gagal dibuka.');
    }
  }

  async function shareBookingCode() {
    if (!order?.kode_tiket) return;
    try {
      await Share.share({ message: `Kode booking DR Star: ${order.kode_tiket}` });
    } catch (caught) {
      setPaymentError(caught instanceof Error ? caught.message : 'Kode booking gagal dibagikan.');
    }
  }

  if (loading) return <SafeAreaView style={styles.safeArea}><LoadingState label="Memuat detail pesanan..." /></SafeAreaView>;
  if (error || !order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹  Kembali</Text></Pressable>
          <ErrorBanner message={error || 'Pesanan tidak ditemukan.'} />
          <Pressable onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>Coba lagi</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isPaid = order.status_bayar === 'lunas';
  const isPending = order.status_bayar === 'pending';
  const isRejected = order.status_bayar === 'ditolak';
  const statusTitle = isPaid ? 'Pembayaran berhasil' : isPending ? (order.bukti_bayar ? 'Menunggu verifikasi' : 'Menunggu pembayaran') : isRejected ? 'Pembayaran ditolak' : 'Pesanan kedaluwarsa';
  const statusMessage = isPaid
    ? 'Pembayaran terkonfirmasi. Tunjukkan QR setiap tiket saat memasuki venue.'
    : isPending
      ? 'Status akan diperbarui otomatis. E-ticket terbit setelah pembayaran terkonfirmasi.'
      : isRejected
        ? 'Pembayaran tidak dapat diproses. Silakan pilih event dan pesan kembali.'
        : 'Batas waktu pembayaran telah berakhir. Silakan pesan kembali jika tiket masih tersedia.';
  const eventImage = getImageUrl(order.event?.image_url ?? order.event?.banner ?? order.event?.poster);
  const orderDate = order.createdAt ?? order.created_at;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor="#0F766E" />}
        showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹  Kembali</Text></Pressable>
        <Text style={styles.eyebrow}>DETAIL PESANAN</Text>
        <Text style={styles.title}>Pesanan #{order.id}</Text>

        <View style={[styles.statusCard, isPaid ? styles.statusPaid : isPending ? styles.statusPending : styles.statusFailed]}>
          <View style={styles.statusIcon}>
            <MaterialIcons
              name={isPaid ? 'check-circle' : isPending ? 'schedule' : 'error'}
              size={24}
              color={isPaid ? '#047857' : isPending ? '#B45309' : '#B42318'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>{statusTitle}</Text>
            <Text style={styles.statusMessage}>{statusMessage}</Text>
          </View>
        </View>

        <View style={styles.eventCard}>
          <View style={styles.posterWrap}>
            {eventImage ? <Image source={{ uri: eventImage }} contentFit="cover" style={styles.poster} /> : <MaterialIcons name="confirmation-number" size={27} color="#AAB8B0" />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.eventName}>{order.event?.nama_event ?? 'Event'}</Text>
            <Text style={styles.muted}>{order.kategori_tiket?.nama_kelas ?? 'Kategori tiket'} · {order.jumlah} tiket</Text>
            <Text style={styles.eventDate}>{order.event?.tanggal ? formatTanggal(order.event.tanggal) : 'Tanggal tidak tersedia'}</Text>
          </View>
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.cardTitle}>Rincian pembayaran</Text>
          <DetailRow label="Kode booking" value={order.kode_tiket ?? '-'} />
          <DetailRow label="Tanggal pesan" value={orderDate ? `${formatTanggal(orderDate)}, ${formatJam(orderDate)}` : '-'} />
          <DetailRow label="Status" value={statusTitle} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total harga</Text>
            <Text style={styles.totalValue}>{formatRupiah(order.total_harga)}</Text>
          </View>
          {order.kode_tiket ? (
            <Pressable onPress={() => void shareBookingCode()} style={styles.shareCode}>
              <MaterialIcons name="share" size={15} color="#0F766E" />
              <Text style={styles.shareCodeText}>Bagikan kode booking</Text>
            </Pressable>
          ) : null}
        </View>

        {paymentError ? <ErrorBanner message={paymentError} /> : null}
        {isPending && order.payment_url ? (
          <Pressable onPress={() => void pay()} style={styles.primaryButton}>
            <Text style={styles.primaryText}>Lanjutkan pembayaran</Text>
            <MaterialIcons name="open-in-new" size={17} color="#FFFFFF" />
          </Pressable>
        ) : null}
        {(isRejected || order.status_bayar === 'kadaluarsa') ? (
          <Pressable onPress={() => router.replace({ pathname: '/events/[id]', params: { id: String(order.event_id) } })} style={styles.primaryButton}>
            <Text style={styles.primaryText}>Pesan ulang</Text>
            <MaterialIcons name="arrow-forward" size={17} color="#FFFFFF" />
          </Pressable>
        ) : null}

        {isPaid ? (
          <View style={styles.ticketSection}>
            <View style={styles.ticketSectionHeading}>
              <Text style={styles.cardTitle}>E-ticket & QR</Text>
              <Text style={styles.ticketHint}>Tunjukkan di pintu masuk</Text>
            </View>
            {order.tiket?.length ? order.tiket.map((ticket) => (
              <View key={ticket.nomor_urut} style={styles.ticketCard}>
                <View style={styles.ticketHead}>
                  <Text style={styles.ticketName}>Tiket {ticket.nomor_urut} dari {order.jumlah}</Text>
                  <Text style={[styles.ticketStatus, ticket.status === 'aktif' ? styles.ticketActive : styles.ticketInactive]}>
                    {ticket.status === 'aktif' ? 'Aktif' : ticket.status === 'terpakai' ? 'Sudah digunakan' : 'Dibatalkan'}
                  </Text>
                </View>
                {ticket.status === 'aktif' && ticket.qr_code ? (
                  <Image source={{ uri: ticket.qr_code }} contentFit="contain" style={styles.qr} />
                ) : (
                  <Text style={styles.muted}>
                    {ticket.status === 'terpakai'
                      ? `Tiket digunakan${ticket.digunakan_pada ? ` pada ${formatTanggal(ticket.digunakan_pada)}` : ''}.`
                      : 'Tiket ini sudah dibatalkan.'}
                  </Text>
                )}
              </View>
            )) : (
              <View style={styles.pendingTicket}>
                <Text style={styles.muted}>QR tiket sedang disiapkan. Tarik untuk memperbarui.</Text>
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.muted}>{label}</Text>
      <Text numberOfLines={2} style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFBF5' },
  content: { paddingHorizontal: 20, paddingTop: 13, paddingBottom: 30, width: '100%', maxWidth: 680, alignSelf: 'center', flexGrow: 1 },
  back: { paddingVertical: 8, marginBottom: 8 },
  backText: { color: '#0F766E', fontSize: 13, fontWeight: '800' },
  eyebrow: { color: '#D68B26', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: '#1F2937', fontSize: 25, fontWeight: '900', marginTop: 5, marginBottom: 15 },
  statusCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 13 },
  statusPaid: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  statusPending: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  statusFailed: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  statusIcon: { marginTop: 1 },
  statusTitle: { color: '#1F2937', fontSize: 14, fontWeight: '900' },
  statusMessage: { color: '#6B7280', fontSize: 11, lineHeight: 17, marginTop: 5 },
  eventCard: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 12, marginBottom: 12 },
  posterWrap: { width: 65, height: 75, borderRadius: 10, overflow: 'hidden', backgroundColor: '#F3F6F2', alignItems: 'center', justifyContent: 'center' },
  poster: { width: '100%', height: '100%' },
  eventName: { color: '#1F2937', fontSize: 13, lineHeight: 18, fontWeight: '900' },
  muted: { color: '#6B7280', fontSize: 10, lineHeight: 16, marginTop: 4 },
  eventDate: { color: '#0F766E', fontSize: 10, fontWeight: '700', marginTop: 6 },
  detailCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 15, marginBottom: 12 },
  cardTitle: { color: '#1F2937', fontSize: 14, fontWeight: '900' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  detailValue: { color: '#1F2937', fontSize: 10, fontWeight: '700', maxWidth: '60%', textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 13 },
  totalLabel: { color: '#1F2937', fontSize: 12, fontWeight: '900' },
  totalValue: { color: '#D68B26', fontSize: 17, fontWeight: '900' },
  shareCode: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 13 },
  shareCodeText: { color: '#0F766E', fontSize: 10, fontWeight: '800' },
  primaryButton: { minHeight: 48, borderRadius: 14, backgroundColor: '#0F766E', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 12 },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  ticketSection: { marginTop: 14 },
  ticketSectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 },
  ticketHint: { color: '#89938E', fontSize: 9 },
  ticketCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 13, marginBottom: 11, alignItems: 'center' },
  ticketHead: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9, borderBottomWidth: 1, borderBottomColor: '#F0F2EF', paddingBottom: 10 },
  ticketName: { color: '#1F2937', fontSize: 12, fontWeight: '900' },
  ticketStatus: { fontSize: 9, fontWeight: '800', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5 },
  ticketActive: { backgroundColor: '#ECFDF5', color: '#047857' },
  ticketInactive: { backgroundColor: '#F3F4F6', color: '#6B7280' },
  qr: { width: 230, height: 230, marginVertical: 13 },
  pendingTicket: { alignItems: 'center', padding: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16 },
  retry: { alignSelf: 'flex-end', paddingVertical: 10 },
  retryText: { color: '#0F766E', fontWeight: '800' },
});
