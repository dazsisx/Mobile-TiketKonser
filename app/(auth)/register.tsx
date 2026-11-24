import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BrandLogo, ErrorBanner, Field, PrimaryButton } from '@/components/ui/mobile-ui';
import { registerUser } from '@/utils/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError('');
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Nama, email, dan kata sandi wajib diisi.');
      return;
    }
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (!agreed) {
      setError('Setujui syarat dan kebijakan privasi terlebih dahulu.');
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        nama: name.trim(),
        email: email.trim(),
        password,
        ...(phone.trim() ? { no_telepon: phone.trim() } : {}),
      });
      router.replace('/(auth)/login');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Pendaftaran gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <Link href="/(auth)/welcome" style={styles.back}>‹  Kembali</Link>
        <View style={styles.logo}><BrandLogo size={42} /></View>
        <Text style={styles.title}>Buat akun DR Star</Text>
        <Text style={styles.subtitle}>Daftar untuk mulai memesan event favoritmu.</Text>
        {error ? <ErrorBanner message={error} /> : null}
        <Field label="Nama lengkap" value={name} onChangeText={setName} placeholder="Nama sesuai identitas" autoComplete="name" />
        <Field label="Alamat email" value={email} onChangeText={setEmail} placeholder="kamu@contoh.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Field label="Nomor telepon (opsional)" value={phone} onChangeText={setPhone} placeholder="08xxxxxxxxxx" keyboardType="phone-pad" autoComplete="tel" />
        <Field label="Kata sandi" value={password} onChangeText={setPassword} placeholder="Minimal 6 karakter" secureTextEntry autoComplete="new-password" />
        <Field label="Konfirmasi kata sandi" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Ulangi kata sandi" secureTextEntry autoComplete="new-password" />
        <View style={styles.agreement}>
          <Text
            accessibilityRole="button"
            onPress={() => setAgreed((value) => !value)}
            style={[styles.checkbox, agreed && styles.checkboxSelected]}>
            {agreed ? '✓' : ''}
          </Text>
          <Text style={styles.agreementText}>
            Saya menyetujui <Link href="/legal/terms" style={styles.inlineLink}>Syarat & Ketentuan</Link> dan <Link href="/legal/privacy" style={styles.inlineLink}>Kebijakan Privasi</Link>.
          </Text>
        </View>
        <PrimaryButton label="Buat akun" onPress={() => void submit()} loading={loading} />
        <View style={styles.loginLine}>
          <Text style={styles.muted}>Sudah punya akun? </Text>
          <Link href="/(auth)/login" style={styles.inlineLink}>Masuk</Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFBF5' },
  content: { width: '100%', maxWidth: 540, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 14, paddingBottom: 28, gap: 12 },
  back: { color: '#6B7280', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  logo: { alignItems: 'center' },
  title: { color: '#1F2937', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: '#6B7280', fontSize: 12, textAlign: 'center', marginTop: -6, marginBottom: 3 },
  agreement: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingVertical: 3 },
  checkbox: { width: 19, height: 19, borderWidth: 1, borderColor: '#CBD5D1', borderRadius: 5, textAlign: 'center', color: '#FFFFFF', overflow: 'hidden' },
  checkboxSelected: { backgroundColor: '#0F766E', borderColor: '#0F766E' },
  agreementText: { flex: 1, color: '#6B7280', fontSize: 11, lineHeight: 17 },
  inlineLink: { color: '#0F766E', fontWeight: '800' },
  loginLine: { flexDirection: 'row', justifyContent: 'center', paddingTop: 2 },
  muted: { color: '#6B7280', fontSize: 12 },
});
