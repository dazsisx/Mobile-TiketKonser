import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { AppScreen, ErrorBanner, LoadingState } from '@/components/ui/mobile-ui';
import { fetchEventById, formatRupiah, type EventItem, type TicketCategory } from '@/utils/api';

const MAX_TICKETS_PER_ORDER = 5;

export default function TicketSelectionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [selected, setSelected] = useState<{ categoryId: number; quantity: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setEvent(await fetchEventById(id));
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Event gagal dimuat.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedTier = event?.kategori_tiket?.find((tier) => tier.id === selected?.categoryId);
  const total = selectedTier && selected
    ? Number(selectedTier.harga) * selected.quantity
    : 0;
  const saleOpen = event?.status === 'aktif';

  function remaining(tier: TicketCategory) {
    return Math.max(0, tier.sisa_kuota ?? tier.kuota - tier.terjual);
  }

  function add(tier: TicketCategory) {
    const max = Math.min(MAX_TICKETS_PER_ORDER, remaining(tier));
    setSelected((current) => {
      if (!current || current.categoryId !== tier.id) return max > 0 ? { categoryId: tier.id, quantity: 1 } : current;
      return { categoryId: tier.id, quantity: Math.min(max, current.quantity + 1) };
    });
  }

  function remove(tier: TicketCategory) {
    setSelected((current) => {
      if (!current || current.categoryId !== tier.id) return current;
      return current.quantity <= 1 ? null : { ...current, quantity: current.quantity - 1 };
    });
  }

  function continueToCheckout() {
    if (!selected || !selectedTier || !saleOpen) return;
    router.push({
      pathname: '/pembelian/checkout/[id]',
      params: {
        id: String(id),
        kategori: String(selected.categoryId),
        jumlah: String(selected.quantity),
      },
    });
  }

  if (loading) return <AppScreen scroll={false}><LoadingState label="Memuat pilihan tiket..." /></AppScreen>;
  if (error || !event) {
    return (
      <AppScreen>
        <ErrorBanner message={error || 'Event tidak ditemukan.'} />
        <Pressable onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>Coba lagi</Text></Pressable>
      </AppScreen>
    );
  }

  const tiers = event.kategori_tiket ?? [];
  const canContinue = Boolean(selected && saleOpen);

  return (
    <AppScreen>
      <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹  Kembali ke event</Text></Pressable>
      <Text style={styles.step}>LANGKAH 1 DARI 3</Text>
      <Text style={styles.title}>Pilih tiket</Text>
      <Text style={styles.eventName}>{event.nama_event}</Text>
      <Text style={styles.hint}>Satu kategori per pesanan · maksimal {MAX_TICKETS_PER_ORDER} tiket</Text>
      {!saleOpen ? <ErrorBanner message="Penjualan tiket untuk event ini sedang tidak dibuka." /> : null}

      {tiers.length ? tiers.map((tier) => {
        const available = saleOpen && remaining(tier) > 0;
        const quantity = selected?.categoryId === tier.id ? selected.quantity : 0;
        const max = Math.min(MAX_TICKETS_PER_ORDER, remaining(tier));
        return (
          <View key={tier.id} style={styles.tierCard}>
            <View style={styles.tierHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tierName}>{tier.nama_kelas}</Text>
                <Text style={styles.stock}>
                  {remaining(tier) ? `Tiket tersedia · sisa ${remaining(tier)}` : 'Tiket habis'}
                </Text>
              </View>
              <Text style={styles.price}>{formatRupiah(tier.harga)}</Text>
            </View>
            <View style={styles.dashed} />
            {quantity ? (
              <View style={styles.quantityRow}>
                <Text style={styles.quantityLabel}>Jumlah tiket</Text>
                <View style={styles.quantityControl}>
                  <Pressable accessibilityLabel="Kurangi jumlah" onPress={() => remove(tier)} style={styles.qtyButton}>
                    <MaterialIcons name="remove" size={18} color="#0F766E" />
                  </Pressable>
                  <Text style={styles.quantity}>{quantity}</Text>
                  <Pressable
                    accessibilityLabel="Tambah jumlah"
                    disabled={quantity >= max}
                    onPress={() => add(tier)}
                    style={[styles.qtyButton, styles.addButton, quantity >= max && styles.disabledButton]}>
                    <MaterialIcons name="add" size={18} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable disabled={!available} onPress={() => add(tier)} style={[styles.addTierButton, !available && styles.disabledButton]}>
                <Text style={[styles.addTierText, !available && styles.disabledText]}>
                  {available ? 'Pilih tiket' : 'Tidak tersedia'}
                </Text>
                {available ? <MaterialIcons name="add" size={17} color="#0F766E" /> : null}
              </Pressable>
            )}
          </View>
        );
      }) : (
        <View style={styles.empty}>
          <MaterialIcons name="confirmation-number" size={28} color="#0F766E" />
          <Text style={styles.emptyText}>Belum ada kategori tiket untuk event ini.</Text>
        </View>
      )}

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total {selected?.quantity ?? 0} tiket</Text>
          <Text style={styles.summaryPrice}>{formatRupiah(total)}</Text>
        </View>
        <Pressable disabled={!canContinue} onPress={continueToCheckout} style={[styles.continueButton, !canContinue && styles.disabledButton]}>
          <Text style={[styles.continueText, !canContinue && styles.disabledText]}>Lanjutkan ke detail pesanan</Text>
          <MaterialIcons name="arrow-forward" size={17} color={canContinue ? '#FFFFFF' : '#9CA3AF'} />
        </Pressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  back: { paddingVertical: 8 },
  backText: { color: '#0F766E', fontSize: 13, fontWeight: '800' },
  step: { color: '#D68B26', fontSize: 9, fontWeight: '900', letterSpacing: 1.4, marginTop: 9 },
  title: { color: '#1F2937', fontSize: 26, fontWeight: '900', marginTop: 4 },
  eventName: { color: '#6B7280', fontSize: 13, marginTop: 4 },
  hint: { color: '#89938E', fontSize: 11, marginTop: 13, marginBottom: 10 },
  tierCard: { padding: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, marginTop: 12 },
  tierHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tierName: { color: '#1F2937', fontSize: 14, fontWeight: '900' },
  stock: { color: '#89938E', fontSize: 10, marginTop: 5 },
  price: { color: '#D68B26', fontSize: 14, fontWeight: '900' },
  dashed: { borderBottomWidth: 1, borderStyle: 'dashed', borderBottomColor: '#D9E1DC', marginVertical: 13 },
  addTierButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1, borderColor: '#CDE5DA', borderRadius: 12, backgroundColor: '#F6FBF7' },
  addTierText: { color: '#0F766E', fontSize: 12, fontWeight: '800' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quantityLabel: { color: '#6B7280', fontSize: 11, fontWeight: '700' },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  qtyButton: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECFDF5' },
  addButton: { backgroundColor: '#0F766E' },
  quantity: { color: '#1F2937', fontSize: 14, fontWeight: '900' },
  disabledButton: { backgroundColor: '#EEF0EF', borderColor: '#EEF0EF' },
  disabledText: { color: '#9CA3AF' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 26, backgroundColor: '#FFFFFF', borderRadius: 16, marginTop: 15 },
  emptyText: { color: '#6B7280', fontSize: 12, marginTop: 8, textAlign: 'center' },
  summary: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 17, padding: 15, marginTop: 23 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryLabel: { color: '#6B7280', fontSize: 12 },
  summaryPrice: { color: '#D68B26', fontSize: 16, fontWeight: '900' },
  continueButton: { minHeight: 48, borderRadius: 14, backgroundColor: '#0F766E', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  continueText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  retry: { alignSelf: 'flex-end', paddingVertical: 10 },
  retryText: { color: '#0F766E', fontWeight: '800' },
});
