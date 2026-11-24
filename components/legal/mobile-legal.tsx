import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link, useRouter } from 'expo-router';

import { AppScreen, ScreenTitle } from '@/components/ui/mobile-ui';

type LegalSection = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  summary: string;
  content: string | string[];
};

const sections: Record<'terms' | 'privacy', LegalSection[]> = {
  terms: [
    {
      icon: 'explore',
      title: 'Menggunakan DRStar',
      summary: 'Ketentuan dasar penggunaan platform.',
      content: 'DRStar membantu kamu menemukan informasi event dan memesan tiket secara online. Dengan menggunakan layanan ini, kamu dianggap telah membaca, memahami, dan menyetujui seluruh ketentuan yang berlaku, serta setuju menggunakan layanan secara bertanggung jawab dan sesuai peraturan yang berlaku.',
    },
    {
      icon: 'verified-user',
      title: 'Tanggung Jawab Pengguna',
      summary: 'Keakuratan data yang kamu berikan.',
      content: 'Kamu bertanggung jawab untuk memberikan informasi yang benar, lengkap, dan terbaru saat melakukan pendaftaran maupun pemesanan tiket. Data yang tidak akurat dapat memengaruhi proses pemesanan dan keabsahan tiket.',
    },
    {
      icon: 'confirmation-number',
      title: 'Pemesanan Tiket',
      summary: 'Ketentuan mengikuti penyelenggara event.',
      content: 'Setiap pemesanan yang berhasil dilakukan akan mengikuti ketentuan dari event atau penyelenggara terkait. Pastikan kembali informasi event, jadwal, lokasi, dan jumlah tiket sebelum menyelesaikan pemesanan, karena kesalahan input menjadi tanggung jawab pengguna.',
    },
    {
      icon: 'credit-card',
      title: 'Pembayaran',
      summary: 'Diproses melalui metode resmi DRStar.',
      content: 'Pembayaran tiket dilakukan melalui metode pembayaran yang tersedia di platform DRStar. Pesanan akan diproses setelah pembayaran berhasil dikonfirmasi sesuai dengan ketentuan yang berlaku.',
    },
    {
      icon: 'refresh',
      title: 'Pembatalan & Pengembalian Dana',
      summary: 'Kebijakan berbeda tiap event.',
      content: 'Kebijakan pembatalan dan pengembalian dana dapat berbeda pada setiap event. Kami menyarankan untuk membaca ketentuan event secara saksama sebelum melakukan pembelian tiket.',
    },
    {
      icon: 'security',
      title: 'Aktivitas Terlarang',
      summary: 'Batasan penggunaan layanan.',
      content: 'Pengguna dilarang menggunakan layanan DRStar untuk tindakan yang melanggar hukum, melakukan penipuan, menyalahgunakan sistem, atau mengganggu keamanan dan kenyamanan pengguna lain.',
    },
    {
      icon: 'update',
      title: 'Perubahan Ketentuan',
      summary: 'Pembaruan berkala oleh DRStar.',
      content: 'DRStar berhak mengubah atau memperbarui syarat dan ketentuan sewaktu-waktu. Perubahan akan berlaku sejak dipublikasikan pada website DRStar.',
    },
  ],
  privacy: [
    {
      icon: 'storage',
      title: 'Informasi yang Kami Kumpulkan',
      summary: 'Data yang diperlukan untuk layanan.',
      content: 'DRStar dapat mengumpulkan informasi seperti nama, alamat email, nomor telepon, serta data lain yang diperlukan untuk menyediakan layanan dan memproses pemesanan tiket.',
    },
    {
      icon: 'settings',
      title: 'Bagaimana Kami Menggunakan Informasi',
      summary: 'Untuk memproses dan meningkatkan layanan.',
      content: [
        'Memproses pemesanan tiket',
        'Menghubungi pengguna terkait pesanan atau event',
        'Memberikan informasi dan pembaruan layanan',
        'Meningkatkan kualitas layanan DRStar',
        'Menjaga keamanan sistem dan mencegah penyalahgunaan',
      ],
    },
    {
      icon: 'lock',
      title: 'Perlindungan Data',
      summary: 'Langkah keamanan yang kami terapkan.',
      content: 'Kami menerapkan langkah-langkah keamanan yang sesuai untuk melindungi data pribadi pengguna dari akses, penggunaan, atau penyebaran yang tidak sah.',
    },
    {
      icon: 'share',
      title: 'Berbagi Informasi',
      summary: 'Tidak dijual ke pihak ketiga.',
      content: 'DRStar tidak akan menjual atau menyebarkan informasi pribadi pengguna kepada pihak lain tanpa izin, kecuali diperlukan untuk proses layanan, pembayaran, penyelenggaraan event, atau diwajibkan oleh hukum.',
    },
    {
      icon: 'cookie',
      title: 'Cookie',
      summary: 'Meningkatkan pengalaman penggunaan.',
      content: 'Kami dapat menggunakan cookie atau teknologi serupa untuk meningkatkan pengalaman pengguna, memahami penggunaan website, dan membantu pengembangan layanan.',
    },
    {
      icon: 'verified-user',
      title: 'Hak Pengguna',
      summary: 'Akses atas data pribadimu.',
      content: 'Kamu dapat menghubungi tim DRStar kapan saja untuk menanyakan informasi mengenai data pribadi yang digunakan dalam layanan.',
    },
    {
      icon: 'update',
      title: 'Pembaruan Kebijakan',
      summary: 'Perubahan dipublikasikan secara terbuka.',
      content: 'Kebijakan Privasi ini dapat diperbarui sewaktu-waktu. Perubahan akan dipublikasikan melalui website DRStar. Dengan menggunakan layanan DRStar, kamu menyetujui pengumpulan dan penggunaan informasi sesuai kebijakan ini.',
    },
  ],
};

export default function MobileLegal({ variant }: { variant: 'terms' | 'privacy' }) {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState(0);
  const isTerms = variant === 'terms';

  return (
    <AppScreen>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>‹  Kembali</Text>
      </Pressable>
      <ScreenTitle
        eyebrow="Legalitas"
        title={isTerms ? 'Syarat & Ketentuan' : 'Kebijakan Privasi'}
        subtitle={
          isTerms
            ? 'Ketentuan penggunaan layanan DRStar sebelum memesan tiket.'
            : 'Bagaimana DRStar mengumpulkan, menggunakan, dan melindungi data pribadimu.'
        }
      />
      <View style={styles.switcher}>
        <Link href="/legal/terms" asChild>
          <Pressable style={[styles.switchItem, isTerms && styles.switchActive]}>
            <Text style={[styles.switchText, isTerms && styles.switchTextActive]}>Ketentuan</Text>
          </Pressable>
        </Link>
        <Link href="/legal/privacy" asChild>
          <Pressable style={[styles.switchItem, !isTerms && styles.switchActive]}>
            <Text style={[styles.switchText, !isTerms && styles.switchTextActive]}>Privasi</Text>
          </Pressable>
        </Link>
      </View>
      <View style={styles.list}>
        {sections[variant].map((section, index) => {
          const isOpen = openIndex === index;
          return (
            <View key={section.title} style={styles.section}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                onPress={() => setOpenIndex(isOpen ? -1 : index)}
                style={styles.sectionButton}>
                <View style={styles.iconBox}>
                  <MaterialIcons name={section.icon} size={19} color="#0F766E" />
                </View>
                <View style={styles.sectionText}>
                  <Text style={styles.sectionTitle}>{index + 1}. {section.title}</Text>
                  <Text style={styles.summary}>{section.summary}</Text>
                </View>
                <MaterialIcons name={isOpen ? 'expand-less' : 'expand-more'} size={21} color="#6B7280" />
              </Pressable>
              {isOpen ? (
                <View style={styles.detail}>
                  {Array.isArray(section.content) ? section.content.map((item) => (
                    <View key={item} style={styles.bullet}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.body}>{item}</Text>
                    </View>
                  )) : <Text style={styles.body}>{section.content}</Text>}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  back: { paddingVertical: 8, marginBottom: 8 },
  backText: { color: '#0F766E', fontSize: 13, fontWeight: '800' },
  switcher: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  switchItem: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 18, paddingHorizontal: 13, paddingVertical: 8 },
  switchActive: { backgroundColor: '#0F766E', borderColor: '#0F766E' },
  switchText: { color: '#6B7280', fontSize: 10, fontWeight: '700' },
  switchTextActive: { color: '#FFFFFF' },
  list: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, overflow: 'hidden' },
  section: { borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  sectionButton: { minHeight: 69, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 12, gap: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  sectionText: { flex: 1 },
  sectionTitle: { color: '#1F2937', fontSize: 12, fontWeight: '800' },
  summary: { color: '#9CA3AF', fontSize: 10, marginTop: 3 },
  detail: { paddingLeft: 59, paddingRight: 18, paddingBottom: 16, gap: 8 },
  body: { color: '#6B7280', fontSize: 12, lineHeight: 19, flexShrink: 1 },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#0F766E', marginTop: 7 },
});
