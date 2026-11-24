import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { BrandLogo } from '@/components/ui/mobile-ui';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Animated.View
          entering={FadeInDown.springify().damping(16).stiffness(95)}
          style={styles.brandCard}>
          <BrandLogo size={86} />
          <View style={styles.artHalo}>
            <Text style={styles.ticketIcon}>✦</Text>
          </View>
          <Text style={styles.eyebrow}>TEMUKAN ACARA FAVORITMU</Text>
          <Text style={styles.title}>Semua keseruan,{'\n'}di satu panggung.</Text>
          <Text style={styles.subtitle}>
            Temukan konser dan acara pilihan, pesan tiket, lalu simpan semuanya dalam satu akun.
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(140).springify().damping(16).stiffness(100)}
          style={styles.actions}>
          <Link href="/(auth)/login" asChild>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryText}>Masuk ke akun</Text>
            </Pressable>
          </Link>
          <Link href="/(auth)/register" asChild>
            <Pressable style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>Buat akun baru</Text>
            </Pressable>
          </Link>
          <Text style={styles.legal}>
            Dengan melanjutkan, kamu menyetujui{' '}
            <Link href="/legal/terms" style={styles.link}>Syarat & Ketentuan</Link> dan{' '}
            <Link href="/legal/privacy" style={styles.link}>Kebijakan Privasi</Link>.
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 20,
  },
  brandCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 22,
  },
  artHalo: {
    width: 168,
    height: 168,
    borderRadius: 56,
    backgroundColor: '#ECFDF5',
    borderColor: '#D5EFE5',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 24,
    transform: [{ rotate: '-6deg' }],
  },
  ticketIcon: {
    color: '#F59E0B',
    fontSize: 64,
    fontWeight: '700',
  },
  eyebrow: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    textAlign: 'center',
  },
  title: {
    color: '#1F2937',
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 330,
    marginTop: 12,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    minHeight: 52,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D6E4DC',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  secondaryText: {
    color: '#0F766E',
    fontSize: 14,
    fontWeight: '800',
  },
  legal: {
    color: '#89938E',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 4,
  },
  link: {
    color: '#0F766E',
    fontWeight: '700',
  },
});
