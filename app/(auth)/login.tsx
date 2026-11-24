import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { BrandLogo, ErrorBanner, Field, PrimaryButton } from '@/components/ui/mobile-ui';
import { useAuth } from '@/contexts/AuthContext';
import { loginUser } from '@/utils/api';

export default function LoginScreen() {
  const router = useRouter();
  const { login, showSplash, hideSplash } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError('');
    if (!email.trim() || !password) {
      setError('Email dan kata sandi wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser({ email: email.trim(), password });
      if (data.role !== 'pelanggan') {
        throw new Error('Aplikasi ini hanya untuk akun pelanggan.');
      }
      // Tampilkan splash loading screen sesudah login
      showSplash('Menyiapkan akun kamu...');
      await login(data);
      await new Promise((resolve) => setTimeout(resolve, 800));
      router.replace('/(tabs)');
      setTimeout(() => hideSplash(), 400);
    } catch (caught) {
      hideSplash();
      setError(caught instanceof Error ? caught.message : 'Gagal masuk. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <Link href="/(auth)/welcome" style={styles.back}>‹  Kembali</Link>
        <View style={styles.logo}><BrandLogo size={46} /></View>
        <Text style={styles.title}>Selamat datang kembali</Text>
        <Text style={styles.subtitle}>Masuk untuk menemukan dan memesan event favoritmu.</Text>
        {error ? <ErrorBanner message={error} /> : null}
        <Field
          label="Alamat email"
          value={email}
          onChangeText={setEmail}
          placeholder="kamu@contoh.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <View>
          <Field
            label="Kata sandi"
            value={password}
            onChangeText={setPassword}
            placeholder="Masukkan kata sandi"
            secureTextEntry={!showPassword}
            autoComplete="password"
            textContentType="password"
            onSubmitEditing={() => void submit()}
          />
          <Pressable
            accessibilityLabel={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            onPress={() => setShowPassword((value) => !value)}
            style={styles.showPassword}>
            <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={19} color="#6B7280" />
          </Pressable>
        </View>
        <Link href="/(auth)/forgot-password" style={styles.forgot}>Lupa kata sandi?</Link>
        <PrimaryButton label="Masuk" onPress={() => void submit()} loading={loading} />
        <View style={styles.registerLine}>
          <Text style={styles.muted}>Belum punya akun? </Text>
          <Link href="/(auth)/register" style={styles.link}>Daftar sekarang</Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFBF5', justifyContent: 'center' },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', padding: 24, gap: 16 },
  back: { color: '#6B7280', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  logo: { alignItems: 'center', marginBottom: 4 },
  title: { color: '#1F2937', fontSize: 25, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: '#6B7280', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: -8, marginBottom: 4 },
  showPassword: { position: 'absolute', right: 12, bottom: 13, padding: 5 },
  forgot: { color: '#0F766E', fontSize: 12, fontWeight: '700', alignSelf: 'flex-end', marginTop: -5 },
  registerLine: { flexDirection: 'row', justifyContent: 'center', marginTop: 3 },
  muted: { color: '#6B7280', fontSize: 12 },
  link: { color: '#0F766E', fontSize: 12, fontWeight: '800' },
});
