import { getStoredToken, saveSession, clearSession } from './session-storage';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api';
export const API_BASE_URL = `${configuredApiUrl.replace(/\/+$/, '').replace(/\/api$/, '')}/api`;
const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');

export type AuthUser = {
  id: number;
  nama: string;
  email: string;
  role: 'admin' | 'admin_offline' | 'pelanggan';
  avatar_url?: string | null;
  no_telepon?: string | null;
};

export type AuthData = AuthUser & { token: string };

export type TicketCategory = {
  id: number;
  event_id: number;
  nama_kelas: string;
  harga: string;
  kuota: number;
  terjual: number;
  sisa_kuota?: number;
};

export type EventItem = {
  id: number;
  nama_event: string;
  deskripsi: string | null;
  tanggal: string;
  lokasi: string;
  poster: string | null;
  image_url?: string | null;
  banner?: string | null;
  status: 'draft' | 'aktif' | 'ditutup' | 'selesai';
  artis?: {
    id: number;
    nama: string;
    bio?: string | null;
    foto?: string | null;
    genre?: string | null;
  };
  kategori_tiket?: TicketCategory[];
};

export type OrderTicket = {
  nomor_urut: number;
  status: 'aktif' | 'terpakai' | 'dibatalkan';
  digunakan_pada: string | null;
  qr_code: string | null;
};

export type Order = {
  id: number;
  event_id: number;
  kategori_tiket_id: number;
  jumlah: number;
  total_harga: string;
  status_bayar: 'pending' | 'lunas' | 'ditolak' | 'kadaluarsa';
  bukti_bayar: string | null;
  payment_url?: string | null;
  payment_status?: string | null;
  kode_tiket: string | null;
  tiket?: OrderTicket[];
  createdAt?: string;
  created_at?: string;
  event?: Pick<EventItem, 'id' | 'nama_event' | 'tanggal' | 'lokasi' | 'image_url' | 'banner' | 'poster'>;
  kategori_tiket?: Pick<TicketCategory, 'id' | 'nama_kelas' | 'harga'>;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
  total?: number;
};

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true
): Promise<T> {
  const token = authenticated ? await getStoredToken() : null;
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? error.message : 'Tidak dapat terhubung ke server.',
      0
    );
  }

  const body = (await response.json().catch(() => null)) as
    | { success?: boolean; message?: string; data?: T }
    | null;
  if (!response.ok || !body?.success) {
    throw new ApiError(
      body?.message ?? `Permintaan gagal (status ${response.status}).`,
      response.status
    );
  }
  return body.data as T;
}

export async function loginUser(payload: { email: string; password: string }) {
  return request<AuthData>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify(payload) },
    false
  );
}

export async function registerUser(payload: {
  nama: string;
  email: string;
  password: string;
  no_telepon?: string;
}) {
  return request<AuthData>(
    '/auth/register',
    { method: 'POST', body: JSON.stringify(payload) },
    false
  );
}

export async function fetchProfile() {
  return request<AuthUser>('/auth/profile');
}

export async function updateProfile(payload: {
  nama: string;
  no_telepon: string;
  password?: string;
}) {
  return request<AuthUser>('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function uploadAvatar(uri: string, fileName: string, mimeType: string) {
  const fileResponse = await fetch(uri);
  if (!fileResponse.ok) throw new Error('Foto profil gagal dibaca.');

  const formData = new FormData();
  const blob = await fileResponse.blob();
  formData.append('avatar', blob.slice(0, blob.size, mimeType), fileName);
  return request<AuthUser>('/auth/avatar', { method: 'POST', body: formData });
}

export async function fetchEvents() {
  return request<EventItem[]>('/event');
}

export async function fetchEventById(id: string | number) {
  return request<EventItem>(`/event/${encodeURIComponent(String(id))}`);
}

export async function fetchWishlist() {
  return request<EventItem[]>('/wishlist');
}

export async function addToWishlist(eventId: number) {
  return request<null>('/wishlist', {
    method: 'POST',
    body: JSON.stringify({ event_id: eventId }),
  });
}

export async function removeFromWishlist(eventId: number) {
  return request<null>(`/wishlist/${eventId}`, { method: 'DELETE' });
}

export async function fetchMyOrders() {
  return request<Order[]>('/pesanan/riwayat');
}

export async function fetchMyOrder(id: string | number) {
  return request<Order>(`/pesanan/${encodeURIComponent(String(id))}`);
}

export async function createOrder(payload: {
  event_id: number;
  kategori_tiket_id: number;
  jumlah: number;
}) {
  return request<Order>('/pesanan', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function forgotPassword(email: string) {
  return request<null>(
    '/auth/forgot-password',
    { method: 'POST', body: JSON.stringify({ email }) },
    false
  );
}

export async function verifyResetOtp(email: string, otp: string) {
  return request<{ resetToken: string }>(
    '/auth/verify-reset-otp',
    { method: 'POST', body: JSON.stringify({ email, otp }) },
    false
  );
}

export async function resendResetOtp(email: string) {
  return request<null>(
    '/auth/resend-reset-otp',
    { method: 'POST', body: JSON.stringify({ email }) },
    false
  );
}

export async function resetPassword(payload: {
  email: string;
  resetToken: string;
  password: string;
}) {
  return request<null>(
    '/auth/reset-password',
    { method: 'POST', body: JSON.stringify(payload) },
    false
  );
}

export function getImageUrl(path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}/${path.replace(/\\/g, '/').replace(/^\/+/, '')}`;
}

export function formatRupiah(value: number | string) {
  const number = typeof value === 'string' ? Number.parseFloat(value) : value;
  return `Rp${(Number.isFinite(number) ? Math.round(number) : 0).toLocaleString('id-ID')}`;
}

export function formatTanggal(value: string) {
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatJam(value: string) {
  return `${new Date(value).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })} WIB`;
}

export function getHargaTermurah(categories?: TicketCategory[]) {
  if (!categories?.length) return 'Belum tersedia';
  return formatRupiah(Math.min(...categories.map((category) => Number(category.harga))));
}

export async function persistAuth(data: AuthData) {
  if (data.role !== 'pelanggan') throw new Error('Aplikasi ini hanya untuk akun pelanggan.');
  const { token, ...user } = data;
  await saveSession(token, { ...user, role: 'pelanggan' });
}

export async function clearAuth() {
  await clearSession();
}
