import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  formatRupiah,
  formatTanggal,
  getHargaTermurah,
  getImageUrl,
  type EventItem,
} from '@/utils/api';

export default function EventCard({
  event,
  onPress,
  favorite,
  onFavorite,
  index = 0,
}: {
  event: EventItem;
  onPress: () => void;
  favorite?: boolean;
  onFavorite?: () => void;
  index?: number;
}) {
  const image = getImageUrl(event.poster ?? event.image_url ?? event.banner);
  const price = event.kategori_tiket?.length
    ? `Mulai ${getHargaTermurah(event.kategori_tiket)}`
    : 'Harga belum tersedia';

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 5) * 70).springify().damping(17).stiffness(105)}
      style={styles.card}>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.main}>
        <View style={styles.imageWrap}>
          {image ? (
            <Image source={{ uri: image }} contentFit="cover" style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <MaterialIcons name="image" size={28} color="#AAB8B0" />
              <Text style={styles.placeholderText}>Poster belum tersedia</Text>
            </View>
          )}
          {event.status === 'ditutup' ? (
            <View style={styles.closedBadge}>
              <Text style={styles.closedText}>Tiket ditutup</Text>
            </View>
          ) : null}
          {onFavorite ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={favorite ? 'Hapus dari wishlist' : 'Simpan ke wishlist'}
              onPress={onFavorite}
              style={styles.favorite}>
              <MaterialIcons
                name={favorite ? 'favorite' : 'favorite-border'}
                size={20}
                color={favorite ? '#E11D48' : '#1F2937'}
              />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.details}>
          <Text numberOfLines={2} style={styles.name}>{event.nama_event}</Text>
          <View style={styles.infoRow}>
            <MaterialIcons name="event" size={14} color="#0F766E" />
            <Text numberOfLines={1} style={styles.infoText}>{formatTanggal(event.tanggal)}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="place" size={14} color="#0F766E" />
            <Text numberOfLines={1} style={styles.infoText}>{event.lokasi}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text numberOfLines={1} style={styles.price}>{price}</Text>
            <MaterialIcons name="arrow-forward" size={17} color="#0F766E" />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function CompactEventCard({
  event,
  onPress,
  index = 0,
}: {
  event: EventItem;
  onPress: () => void;
  index?: number;
}) {
  const image = getImageUrl(event.poster ?? event.image_url ?? event.banner);
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 5) * 70).springify().damping(17).stiffness(105)}>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.compactCard}>
        <View style={styles.compactImageWrap}>
          {image ? (
            <Image source={{ uri: image }} contentFit="cover" style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <MaterialIcons name="confirmation-number" size={26} color="#AAB8B0" />
            </View>
          )}
        </View>
        <Text numberOfLines={2} style={styles.compactName}>{event.nama_event}</Text>
        <Text numberOfLines={1} style={styles.compactDate}>{formatTanggal(event.tanggal)}</Text>
        <Text numberOfLines={1} style={styles.compactPrice}>
          {event.kategori_tiket?.length
            ? formatRupiah(Math.min(...event.kategori_tiket.map((tier) => Number(tier.harga))))
            : 'Tiket segera'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECE8',
    borderRadius: 19,
    marginBottom: 14,
  },
  main: {
    flexDirection: 'row',
    minHeight: 140,
  },
  imageWrap: {
    width: 122,
    minHeight: 140,
    backgroundColor: '#E8EFE9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    padding: 8,
    backgroundColor: '#F3F6F2',
  },
  placeholderText: {
    color: '#89938E',
    fontSize: 9,
    textAlign: 'center',
  },
  closedBadge: {
    position: 'absolute',
    left: 7,
    bottom: 7,
    borderRadius: 7,
    backgroundColor: 'rgba(31,41,55,0.82)',
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  closedText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  favorite: {
    position: 'absolute',
    right: 7,
    top: 7,
    width: 31,
    height: 31,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  details: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  name: {
    color: '#1F2937',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  infoText: {
    flex: 1,
    color: '#7A8580',
    fontSize: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F2EF',
    paddingTop: 7,
    marginTop: 4,
  },
  price: {
    color: '#D68B26',
    fontSize: 10,
    fontWeight: '800',
    flex: 1,
  },
  compactCard: {
    width: 164,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECE8',
    borderRadius: 16,
    overflow: 'hidden',
    paddingBottom: 10,
  },
  compactImageWrap: {
    height: 112,
    backgroundColor: '#E8EFE9',
  },
  compactName: {
    color: '#1F2937',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    paddingHorizontal: 9,
    marginTop: 8,
  },
  compactDate: {
    color: '#7A8580',
    fontSize: 9,
    paddingHorizontal: 9,
    marginTop: 4,
  },
  compactPrice: {
    color: '#D68B26',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 9,
    marginTop: 5,
  },
});
