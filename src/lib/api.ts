import type { Room, Booking, Product, Order, Stats, OrderItem, PaymentMethod, Matchmaking, MatchmakingApplicant, RoomType } from '@shared/types';

const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(data.error || `请求错误: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const roomsApi = {
  list: () => request<Room[]>('/rooms'),
  get: (id: string) => request<Room>(`/rooms/${id}`),
  create: (data: Omit<Room, 'id' | 'createdAt' | 'status'>) =>
    request<Room>('/rooms', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Omit<Room, 'id' | 'createdAt'>>) =>
    request<Room>(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => request<{ success: boolean }>(`/rooms/${id}`, { method: 'DELETE' }),
  setCleaningDone: (id: string) =>
    request<Room>(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'idle' }) }),
};

export const bookingsApi = {
  list: () => request<Booking[]>('/bookings'),
  get: (id: string) => request<Booking>(`/bookings/${id}`),
  create: (data: Omit<Booking, 'id' | 'createdAt' | 'status'>) =>
    request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Omit<Booking, 'id' | 'createdAt'>>) =>
    request<Booking>(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => request<{ success: boolean }>(`/bookings/${id}`, { method: 'DELETE' }),
};

export const productsApi = {
  list: () => request<Product[]>('/products'),
  get: (id: string) => request<Product>(`/products/${id}`),
  create: (data: Omit<Product, 'id' | 'createdAt'>) =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>) =>
    request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => request<{ success: boolean }>(`/products/${id}`, { method: 'DELETE' }),
};

export const ordersApi = {
  list: () => request<Order[]>('/orders'),
  active: () => request<Order[]>('/orders/active'),
  get: (id: string) => request<Order>(`/orders/${id}`),
  create: (data: { roomId: string; customerName?: string; customerCount: number; source?: 'walkin' | 'booking'; bookingId?: string }) =>
    request<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateItems: (id: string, items: OrderItem[]) =>
    request<Order>(`/orders/${id}`, { method: 'PUT', body: JSON.stringify({ items }) }),
  checkout: (id: string, data: { discount?: number; paymentMethod: PaymentMethod }) =>
    request<Order>(`/orders/${id}/checkout`, { method: 'POST', body: JSON.stringify(data) }),
};

export const statsApi = {
  get: () => request<Stats>('/stats'),
};

export const matchmakingApi = {
  list: () => request<Matchmaking[]>('/matchmaking'),
  get: (id: string) => request<Matchmaking>(`/matchmaking/${id}`),
  create: (data: { roomType: RoomType; hostName: string; hostPhone: string; totalPeopleNeeded: number; note?: string }) =>
    request<Matchmaking>('/matchmaking', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Omit<Matchmaking, 'id' | 'createdAt'>>) =>
    request<Matchmaking>(`/matchmaking/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => request<{ success: boolean }>(`/matchmaking/${id}`, { method: 'DELETE' }),
  apply: (id: string, data: { name: string; phone: string; peopleCount: number }) =>
    request<Matchmaking>(`/matchmaking/${id}/apply`, { method: 'POST', body: JSON.stringify(data) }),
  updateApplicantStatus: (id: string, applicantId: string, status: MatchmakingApplicant['status']) =>
    request<Matchmaking>(`/matchmaking/${id}/applicants/${applicantId}`, { method: 'PUT', body: JSON.stringify({ status }) }),
  confirm: (id: string, roomId: string) =>
    request<Matchmaking>(`/matchmaking/${id}/confirm`, { method: 'POST', body: JSON.stringify({ roomId }) }),
  cancel: (id: string) =>
    request<Matchmaking>(`/matchmaking/${id}/cancel`, { method: 'POST' }),
};
