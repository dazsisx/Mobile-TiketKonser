import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BrandLogo, ErrorBanner, Field, PrimaryButton } from '@/components/ui/mobile-ui';
import { resendResetOtp, verifyResetOtp } from '@/utils/api';
import { getResetEmail, saveResetToken } from '@/utils/session-storage';

const RESEND_SECONDS = 60;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let active = true;
    getResetEmail()
      .then((storedEmail) => {
        if (!active) return;
        if (!storedEmail) router.replace('/(auth)/forgot-password');
        else setEmail(storedEmail);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : 'Data pemulihan gagal dibaca.');
      });
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function submit() {
    setError('');
    if (!email) {
      router.replace('/(auth)/forgot-password');
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError('Masukkan 6 digit kode OTP.');
      return;
    }
    setLoading(true);
    try {
      const result = await verifyResetOtp(email, code);
      await saveResetToken(result.resetToken);
      router.push('/(auth)/reset-password');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Kode OTP tidak valid atau kedaluwarsa.');
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!email || cooldown > 0 || resending) return;
    setError('');
    setResending(true);
    try {
      await resendResetOtp(email);
      setCode('');
      setCooldown(RESEND_SECONDS);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Kode OTP gagal dikirim ulang.');
    } finally {
      setResending(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <Link href="/(auth)/forgot-password" style={styles.back}>‹  Ganti email</Link>
        <View style={styles.logo}><BrandLogo size={44} /></View>
        <Text style={styles.icon}>⌑</Text>
        <Text style={styles.title}>Verifikasi email</Text>
        <Text style={styles.subtitle}>
          Masukkan kode 6 digit yang dikirim ke <Text style={styles.email}>{email || 'email kamu'}</Text>.
        </Text>
        {error ? <ErrorBanner message={error} /> : null}
        <Field
          label="Kode OTP"
          value={code}
          onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          textAlign="center"
          style={styles.otpField}
        />
        <PrimaryButton label="Verifikasi kode" onPress={() => void submit()} loading={loading} />
        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Belum menerima kode? </Text>
          <Text
            accessibilityRole="button"
            onPress={() => void resend()}
            style={[styles.resendAction, (cooldown > 0 || resending) && styles.resendDisabled]}>
            {resending ? 'Mengirim...' : cooldown > 0 ? `Kirim ulang (${cooldown}s)` : 'Kirim ulang'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFBF5', justifyContent: 'center' },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', padding: 24, gap: 16 },
  back: { color: '#6B7280', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  logo: { alignItems: 'center' },
  icon: { color: '#0F766E', fontSize: 34, textAlign: 'center', marginTop: -8 },
  title: { color: '#1F2937', fontSize: 25, fontWeight: '900', textAlign: 'center', marginTop: -12 },
  subtitle: { color: '#6B7280', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: -8 },
  email: { color: '#1F2937', fontWeight: '800' },
  otpField: { fontSize: 22, fontWeight: '800', letterSpacing: 7 },
  resendRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  resendText: { color: '#6B7280', fontSize: 12 },
  resendAction: { color: '#0F766E', fontSize: 12, fontWeight: '800' },
  resendDisabled: { color: '#9CA3AF' },
});
