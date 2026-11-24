import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { AppScreen, ErrorBanner, LoadingState } from '@/components/ui/mobile-ui';
import { useAuth } from '@/contexts/AuthContext';
import {
  createOrder,
  fetchEventById,
  formatJam,
  formatRupiah,
  formatTanggal,
  type EventItem,
} from '@/utils/api';

const MAX_TICKETS_PER_ORDER = 5;

export default function CheckoutScreen() {
  const router = useRouter();
  const { id, kategori, jumlah } = useLocalSearchParams<{
    id: string;
    kategori?: string;
    jumlah?: string;
  }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetchEventById(id)
      .then((result) => {
        if (active) setEvent(result);
      })
      .catch((caught: unknown) => {
        if (active) setLoadError(caught instanceof Error ? caught.message : 'Event gagal dimuat.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const categoryId = Number(kategori);
  const quantity = Number(jumlah);
  const selectedTier = event?.kategori_tiket?.find((tier) => tier.id === categoryId);
  const remaining = selectedTier
    ? Math.max(0, selectedTier.sisa_kuota ?? selectedTier.kuota - selectedTier.terjual)
    : 0;
  const total = selectedTier ? Number(selectedTier.harga) * quantity : 0;
  const paramsValid = Number.isInteger(categoryId) && Number.isInteger(quantity) && quantity > 0 && quantity <= MAX_TICKETS_PER_ORDER;
  const canSubmit = Boolean(
    selectedTier &&
    event?.status === 'aktif' &&
    paramsValid &&
    quantity <= remaining &&
    agreeTerms &&
    agreePrivacy &&
    !submitting &&
    !createdOrderId
  );

  const buyerName = useMemo(() => user?.nama ?? '', [user?.nama]);

  async function pay() {
    if (!canSubmit || !event || !selectedTier) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const order = await createOrder({
        event_id: event.id,
        kategori_tiket_id: selectedTier.id,
        jumlah: quantity,
      });
      setCreatedOrderId(order.id);
      if (!order.payment_url) {
        throw new Error('Sesi pembayaran belum tersedia. Buka detail pesanan untuk memeriksa statusnya.');
      }
      await WebBrowser.openBrowserAsync(order.payment_url);
      router.replace({ pathname: '/pembelian/[id]', params: { id: String(order.id) } });
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : 'Pesanan gagal dibuat.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <AppScreen scroll={false}><LoadingState label="Menyiapkan pesanan..." /></AppScreen>;
  if (loadError || !event) {
    return (
      <AppScreen>
        <ErrorBanner message={loadError || 'Event tidak ditemukan.'} />
        <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>Kembali</Text></Pressable>
      </AppScreen>
    );
  }
  if (!paramsValid || !selectedTier) {
    return (
      <AppScreen>
        <ErrorBanner message="Pilihan tiket tidak valid. Pilih kategori dan jumlah tiket kembali." />
        <Pressable onPress={() => router.replace({ pathname: '/pembelian/tiket/[id]', params: { id: String(id) } })} style={styles.back}>
          <Text style={styles.backText}>Pilih tiket kembali</Text>
        </Pressable>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹  Kembali ke tiket</Text></Pressable>
      <Text style={styles.step}>LANGKAH 2 DARI 3</Text>
      <Text style={styles.title}>Detail pesanan</Text>
      <Text style={styles.eventName}>{event.nama_event}</Text>

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Data pembeli</Text>
        <View style={styles.buyerRow}>
          <View style={styles.buyerIcon}><MaterialIcons name="person" size={19} color="#0F766E" /></View>
          <View>
            <Text style={styles.buyerName}>{buyerName}</Text>
            <Text style={styles.infoText}>{user?.email}</Text>
            <Text style={styles.caption}>Pesanan dibuat menggunakan akun ini.</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Informasi event</Text>
        <Fact icon="event" value={`${formatTanggal(event.tanggal)} · ${formatJam(event.tanggal)}`} />
        <Fact icon="place" value={event.lokasi} />
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Ringkasan pesanan</Text>
        <View style={styles.summaryRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.buyerName}>{selectedTier.nama_kelas} × {quantity}</Text>
            <Text style={styles.infoText}>{formatRupiah(selectedTier.harga)} per tiket</Text>
          </View>
          <Text style={styles.buyerName}>{formatRupiah(total)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.cardTitle}>Total</Text>
          <Text style={styles.totalPrice}>{formatRupiah(total)}</Text>
        </View>
        {quantity > remaining ? <ErrorBanner message={`Sisa kuota hanya ${remaining} tiket. Kembali dan ubah jumlah.`} /> : null}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Cara pembayaran</Text>
        <Text style={styles.infoText}>
          Pembayaran diproses melalui Midtrans. E-ticket dengan QR akan terbit otomatis setelah pembayaran berhasil dikonfirmasi.
        </Text>
      </View>

      <CheckRow
        selected={agreeTerms}
        onPress={() => setAgreeTerms((value) => !value)}
        text={<Text>Saya setuju dengan <Link href="/legal/terms" style={styles.inlineLink}>Syarat & Ketentuan</Link> DR Star.</Text>}
      />
      <CheckRow
        selected={agreePrivacy}
        onPress={() => setAgreePrivacy((value) => !value)}
        text={<Text>Saya menyetujui <Link href="/legal/privacy" style={styles.inlineLink}>Kebijakan Privasi</Link> DR Star.</Text>}
      />
      {submitError ? <ErrorBanner message={submitError} /> : null}

      {createdOrderId ? (
        <Pressable onPress={() => router.replace({ pathname: '/pembelian/[id]', params: { id: String(createdOrderId) } })} style={styles.payButton}>
          <Text style={styles.payText}>Lihat status pesanan</Text>
        </Pressable>
      ) : (
        <Pressable disabled={!canSubmit} onPress={() => void pay()} style={[styles.payButton, !canSubmit && styles.disabled]}>
          <Text style={[styles.payText, !canSubmit && styles.disabledText]}>
            {submitting ? 'Membuka pembayaran...' : 'Buat pesanan & bayar'}
          </Text>
          {!submitting ? <MaterialIcons name="arrow-forward" size={17} color={canSubmit ? '#FFFFFF' : '#9CA3AF'} /> : null}
        </Pressable>
      )}
    </AppScreen>
  );
}

function Fact({ icon, value }: { icon: keyof typeof MaterialIcons.glyphMap; value: string }) {
  return (
    <View style={styles.fact}>
      <MaterialIcons name={icon} size={16} color="#0F766E" />
      <Text style={styles.infoText}>{value}</Text>
    </View>
  );
}

function CheckRow({
  selected,
  onPress,
  text,
}: {
  selected: boolean;
  onPress: () => void;
  text: React.ReactNode;
}) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={onPress} style={styles.checkRow}>
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected ? <MaterialIcons name="check" size={15} color="#FFFFFF" /> : null}
      </View>
      <Text style={styles.checkText}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  back: { paddingVertical: 8 },
  backText: { color: '#0F766E', fontSize: 13, fontWeight: '800' },
  step: { color: '#D68B26', fontSize: 9, fontWeight: '900', letterSpacing: 1.4, marginTop: 7 },
  title: { color: '#1F2937', fontSize: 26, fontWeight: '900', marginTop: 4 },
  eventName: { color: '#6B7280', fontSize: 13, marginTop: 4, marginBottom: 13 },
  infoCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 15, marginBottom: 11, gap: 12 },
  cardTitle: { color: '#1F2937', fontSize: 13, fontWeight: '900' },
  buyerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  buyerIcon: { width: 36, height: 36, borderRadius: 13, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  buyerName: { color: '#1F2937', fontSize: 12, fontWeight: '800' },
  infoText: { color: '#6B7280', fontSize: 11, lineHeight: 17 },
  caption: { color: '#9CA3AF', fontSize: 9, marginTop: 3 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 12 },
  totalPrice: { color: '#D68B26', fontSize: 17, fontWeight: '900' },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingVertical: 6 },
  checkbox: { width: 19, height: 19, borderRadius: 5, borderWidth: 1, borderColor: '#CBD5D1', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: '#0F766E', borderColor: '#0F766E' },
  checkText: { flex: 1, color: '#6B7280', fontSize: 11, lineHeight: 17 },
  inlineLink: { color: '#0F766E', fontWeight: '800' },
  payButton: { minHeight: 49, borderRadius: 14, backgroundColor: '#0F766E', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, marginTop: 8 },
  payText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  disabled: { backgroundColor: '#EEF0EF' },
  disabledText: { color: '#9CA3AF' },
});
