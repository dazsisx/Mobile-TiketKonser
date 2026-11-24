import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BrandLogo, ErrorBanner, Field, PrimaryButton } from '@/components/ui/mobile-ui';
import { resetPassword } from '@/utils/api';
import {
  clearPasswordReset,
  getResetEmail,
  getResetToken,
} from '@/utils/session-storage';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getResetEmail(), getResetToken()])
      .then(([storedEmail, storedToken]) => {
        if (!active) return;
        if (!storedEmail || !storedToken) router.replace('/(auth)/forgot-password');
        else {
          setEmail(storedEmail);
          setResetToken(storedToken);
        }
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : 'Data pemulihan gagal dibaca.');
      });
    return () => {
      active = false;
    };
  }, [router]);

  async function submit() {
    setError('');
    if (!password || !confirmPassword) {
      setError('Isi dan konfirmasi kata sandi baru.');
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      setError('Gunakan minimal 8 karakter, huruf besar, huruf kecil, dan angka.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (!email || !resetToken) {
      setError('Sesi reset tidak ditemukan. Ulangi proses lupa kata sandi.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ email, resetToken, password });
      await clearPasswordReset();
      setSuccess(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Kata sandi gagal diubah.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <Link href="/(auth)/login" style={styles.back}>‹  Kembali ke masuk</Link>
        <View style={styles.logo}><BrandLogo size={44} /></View>
        {success ? (
          <>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.title}>Kata sandi diperbarui</Text>
            <Text style={styles.subtitle}>Sekarang kamu bisa masuk menggunakan kata sandi baru.</Text>
            <PrimaryButton label="Masuk" onPress={() => router.replace('/(auth)/login')} />
          </>
        ) : (
          <>
            <Text style={styles.title}>Buat kata sandi baru</Text>
            <Text style={styles.subtitle}>Kata sandi minimal 8 karakter dengan huruf besar, huruf kecil, dan angka.</Text>
            {error ? <ErrorBanner message={error} /> : null}
            <Field label="Kata sandi baru" value={password} onChangeText={setPassword} placeholder="Masukkan kata sandi" secureTextEntry autoComplete="new-password" />
            <Field label="Ulangi kata sandi" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Konfirmasi kata sandi" secureTextEntry autoComplete="new-password" />
            <PrimaryButton label="Simpan kata sandi" onPress={() => void submit()} loading={loading} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFBF5', justifyContent: 'center' },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', padding: 24, gap: 16 },
  back: { color: '#6B7280', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  logo: { alignItems: 'center' },
  title: { color: '#1F2937', fontSize: 25, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: '#6B7280', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: -8 },
  successIcon: { color: '#0F766E', fontSize: 42, fontWeight: '900', textAlign: 'center' },
});
