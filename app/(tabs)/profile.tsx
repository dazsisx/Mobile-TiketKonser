import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ErrorBanner, Field, LoadingState, PrimaryButton } from '@/components/ui/mobile-ui';
import { useAuth } from '@/contexts/AuthContext';
import { fetchProfile, updateProfile, uploadAvatar } from '@/utils/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuth();
  const [name, setName] = useState(user?.nama ?? '');
  const [phone, setPhone] = useState(user?.no_telepon ?? '');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const profile = await fetchProfile();
      await updateUser(profile);
      setName(profile.nama);
      setPhone(profile.no_telepon ?? '');
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Profil gagal dimuat.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [updateUser]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  async function save() {
    setError('');
    setSuccess('');
    if (name.trim().length < 2) {
      setError('Nama minimal 2 karakter.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProfile({ nama: name.trim(), no_telepon: phone.trim() });
      await updateUser(updated);
      setName(updated.nama);
      setPhone(updated.no_telepon ?? '');
      setSuccess('Informasi akun berhasil diperbarui.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Profil gagal diperbarui.');
    } finally {
      setSaving(false);
    }
  }

  async function changeAvatar() {
    setError('');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Izinkan akses galeri untuk memilih foto profil.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled) return;

      const image = result.assets[0];
      if (image.fileSize && image.fileSize > 5 * 1024 * 1024) {
        setError('Ukuran foto profil maksimal 5 MB.');
        return;
      }
      setAvatarLoading(true);
      await updateUser(await uploadAvatar(
        image.uri,
        image.fileName ?? `avatar-${Date.now()}.jpg`,
        image.mimeType ?? 'image/jpeg'
      ));
      setSuccess('Foto profil berhasil diperbarui.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Foto profil gagal diperbarui.');
    } finally {
      setAvatarLoading(false);
    }
  }

  async function confirmSignOut() {
    try {
      await logout();
      router.replace('/(auth)/welcome');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal keluar dari akun.');
      setConfirmLogout(false);
    }
  }

  if (loading) {
    return <SafeAreaView style={styles.safeArea}><LoadingState label="Memuat profil..." /></SafeAreaView>;
  }

  const initials = user?.nama.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() ?? 'DR';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor="#0F766E" />}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>AKUN SAYA</Text>
        <Text style={styles.title}>Profil</Text>
        <View style={styles.profileCard}>
          <Pressable
            accessibilityRole="button"
            disabled={avatarLoading}
            onPress={() => void changeAvatar()}
            style={styles.avatar}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} contentFit="cover" style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
            <View style={styles.cameraBadge}><MaterialIcons name="photo-camera" size={14} color="#FFFFFF" /></View>
          </Pressable>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.nama}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userRole}>Pelanggan DR Star</Text>
          </View>
          <Pressable accessibilityLabel="Ganti foto profil" disabled={avatarLoading} onPress={() => void changeAvatar()} style={styles.changePhoto}>
            <Text style={styles.changePhotoText}>{avatarLoading ? '...' : 'Edit'}</Text>
          </Pressable>
        </View>

        {error ? <ErrorBanner message={error} /> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi dasar</Text>
          <Field label="Nama lengkap" value={name} onChangeText={setName} placeholder="Nama lengkap" autoComplete="name" />
          <Field label="Alamat email" value={user?.email ?? ''} editable={false} selectTextOnFocus={false} />
          <Field label="Nomor telepon" value={phone} onChangeText={setPhone} placeholder="08xxxxxxxxxx" keyboardType="phone-pad" autoComplete="tel" />
          <PrimaryButton label="Simpan perubahan" onPress={() => void save()} loading={saving} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Keamanan</Text>
          <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={styles.menuRow}>
            <View style={styles.menuIcon}><MaterialIcons name="lock-outline" size={19} color="#0F766E" /></View>
            <View style={styles.menuCopy}>
              <Text style={styles.menuTitle}>Atur ulang kata sandi</Text>
              <Text style={styles.menuSubtitle}>Verifikasi melalui email</Text>
            </View>
            <MaterialIcons name="chevron-right" size={21} color="#9CA3AF" />
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/orders')} style={styles.menuRow}>
            <View style={styles.menuIcon}><MaterialIcons name="confirmation-number" size={19} color="#0F766E" /></View>
            <View style={styles.menuCopy}>
              <Text style={styles.menuTitle}>Riwayat pembelian</Text>
              <Text style={styles.menuSubtitle}>Lihat status pesanan dan tiket</Text>
            </View>
            <MaterialIcons name="chevron-right" size={21} color="#9CA3AF" />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aplikasi</Text>
          <Pressable onPress={() => router.push('/legal/terms')} style={styles.menuRow}>
            <View style={styles.menuIcon}><MaterialIcons name="description" size={19} color="#0F766E" /></View>
            <View style={styles.menuCopy}><Text style={styles.menuTitle}>Syarat & Ketentuan</Text></View>
            <MaterialIcons name="chevron-right" size={21} color="#9CA3AF" />
          </Pressable>
          <Pressable onPress={() => router.push('/legal/privacy')} style={styles.menuRow}>
            <View style={styles.menuIcon}><MaterialIcons name="shield" size={19} color="#0F766E" /></View>
            <View style={styles.menuCopy}><Text style={styles.menuTitle}>Kebijakan Privasi</Text></View>
            <MaterialIcons name="chevron-right" size={21} color="#9CA3AF" />
          </Pressable>
        </View>

        {confirmLogout ? (
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Keluar dari akun ini?</Text>
            <Text style={styles.confirmText}>Kamu perlu masuk lagi untuk melihat pesanan dan wishlist.</Text>
            <View style={styles.confirmActions}>
              <Pressable onPress={() => setConfirmLogout(false)} style={styles.cancelButton}><Text style={styles.cancelText}>Batal</Text></Pressable>
              <Pressable onPress={() => void confirmSignOut()} style={styles.logoutButton}><Text style={styles.logoutText}>Keluar</Text></Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={() => setConfirmLogout(true)} style={styles.logoutButton}>
            <MaterialIcons name="logout" size={17} color="#B42318" />
            <Text style={styles.logoutText}>Keluar dari akun</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFBF5' },
  content: { flexGrow: 1, width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 26, gap: 12 },
  eyebrow: { color: '#D68B26', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: '#1F2937', fontSize: 26, fontWeight: '900', marginTop: -7 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  avatar: { width: 58, height: 58, borderRadius: 20, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitials: { color: '#0F766E', fontSize: 18, fontWeight: '900' },
  cameraBadge: { position: 'absolute', right: 0, bottom: 0, backgroundColor: '#0F766E', borderTopLeftRadius: 8, padding: 4 },
  userInfo: { flex: 1 },
  userName: { color: '#1F2937', fontSize: 13, fontWeight: '900' },
  userEmail: { color: '#6B7280', fontSize: 10, marginTop: 3 },
  userRole: { color: '#0F766E', fontSize: 9, fontWeight: '800', marginTop: 5 },
  changePhoto: { paddingHorizontal: 8, paddingVertical: 6 },
  changePhotoText: { color: '#0F766E', fontSize: 10, fontWeight: '900' },
  section: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 14, gap: 13 },
  sectionTitle: { color: '#1F2937', fontSize: 13, fontWeight: '900' },
  success: { color: '#047857', fontSize: 11, fontWeight: '700' },
  menuRow: { minHeight: 47, flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  menuCopy: { flex: 1 },
  menuTitle: { color: '#1F2937', fontSize: 11, fontWeight: '800' },
  menuSubtitle: { color: '#89938E', fontSize: 9, marginTop: 3 },
  logoutButton: { minHeight: 45, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FFFFFF', borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  logoutText: { color: '#B42318', fontSize: 11, fontWeight: '900' },
  confirmCard: { padding: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#FECACA', borderRadius: 14 },
  confirmTitle: { color: '#1F2937', fontSize: 13, fontWeight: '900' },
  confirmText: { color: '#6B7280', fontSize: 10, lineHeight: 16, marginTop: 5 },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, marginTop: 12 },
  cancelButton: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F3F4F6' },
  cancelText: { color: '#6B7280', fontSize: 10, fontWeight: '800' },
});
