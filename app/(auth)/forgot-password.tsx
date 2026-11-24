import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BrandLogo, ErrorBanner, Field, PrimaryButton } from '@/components/ui/mobile-ui';
import { forgotPassword } from '@/utils/api';
import { saveResetEmail } from '@/utils/session-storage';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Masukkan alamat email yang valid.');
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(normalizedEmail);
      await saveResetEmail(normalizedEmail);
      router.push('/(auth)/verify-otp');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Kode OTP gagal dikirim.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <Link href="/(auth)/login" style={styles.back}>‹  Kembali ke masuk</Link>
        <View style={styles.logo}><BrandLogo size={46} /></View>
        <Text style={styles.icon}>✉</Text>
        <Text style={styles.title}>Lupa kata sandi?</Text>
        <Text style={styles.subtitle}>Masukkan email terdaftar. Kami akan mengirim kode OTP untuk mengatur ulang kata sandimu.</Text>
        {error ? <ErrorBanner message={error} /> : null}
        <Field
          label="Alamat email"
          value={email}
          onChangeText={setEmail}
          placeholder="kamu@contoh.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <PrimaryButton label="Kirim kode OTP" onPress={() => void submit()} loading={loading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFBF5', justifyContent: 'center' },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', padding: 24, gap: 16 },
  back: { color: '#6B7280', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  logo: { alignItems: 'center' },
  icon: { color: '#0F766E', fontSize: 30, textAlign: 'center', marginTop: -4 },
  title: { color: '#1F2937', fontSize: 25, fontWeight: '900', textAlign: 'center', marginTop: -10 },
  subtitle: { color: '#6B7280', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: -8 },
});
