import { create } from 'zustand';
import type { Room, Booking, Product, Order, Stats, OrderItem, Matchmaking, MatchmakingApplicant, RoomType } from '@shared/types';
import { roomsApi, bookingsApi, productsApi, ordersApi, statsApi, matchmakingApi } from '@/lib/api';

interface AppState {
  rooms: Room[];
  bookings: Booking[];
  products: Product[];
  orders: Order[];
  activeOrders: Order[];
  matchmakings: Matchmaking[];
  stats: Stats | null;
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  fetchRooms: () => Promise<void>;
  fetchBookings: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchActiveOrders: () => Promise<void>;
  fetchMatchmakings: () => Promise<void>;
  fetchStats: () => Promise<void>;
  createRoom: (data: Omit<Room, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateRoom: (id: string, data: Partial<Omit<Room, 'id' | 'createdAt'>>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  setRoomCleaningDone: (id: string) => Promise<void>;
  createBooking: (data: Omit<Booking, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateBooking: (id: string, data: Partial<Omit<Booking, 'id' | 'createdAt'>>) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  createProduct: (data: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  createOrder: (data: { roomId: string; customerName?: string; customerCount: number; source?: 'walkin' | 'booking'; bookingId?: string }) => Promise<Order>;
  updateOrderItems: (id: string, items: OrderItem[]) => Promise<void>;
  checkoutOrder: (id: string, data: { discount?: number; paymentMethod: any }) => Promise<Order>;
  getActiveOrderByRoom: (roomId: string) => Order | undefined;
  createMatchmaking: (data: { roomType: RoomType; hostName: string; hostPhone: string; totalPeopleNeeded: number; note?: string }) => Promise<void>;
  deleteMatchmaking: (id: string) => Promise<void>;
  applyMatchmaking: (id: string, data: { name: string; phone: string; peopleCount: number }) => Promise<void>;
  updateApplicantStatus: (matchmakingId: string, applicantId: string, status: MatchmakingApplicant['status']) => Promise<void>;
  confirmMatchmaking: (id: string, roomId: string) => Promise<void>;
  cancelMatchmaking: (id: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  rooms: [],
  bookings: [],
  products: [],
  orders: [],
  activeOrders: [],
  matchmakings: [],
  stats: null,
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const [rooms, bookings, products, activeOrders, matchmakings, stats] = await Promise.all([
        roomsApi.list(),
        bookingsApi.list(),
        productsApi.list(),
        ordersApi.active(),
        matchmakingApi.list(),
        statsApi.get(),
      ]);
      set({ rooms, bookings, products, activeOrders, matchmakings, stats, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchRooms: async () => {
    try {
      const rooms = await roomsApi.list();
      set({ rooms });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  fetchBookings: async () => {
    try {
      const bookings = await bookingsApi.list();
      set({ bookings });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  fetchProducts: async () => {
    try {
      const products = await productsApi.list();
      set({ products });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  fetchOrders: async () => {
    try {
      const orders = await ordersApi.list();
      set({ orders });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  fetchActiveOrders: async () => {
    try {
      const activeOrders = await ordersApi.active();
      set({ activeOrders });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await statsApi.get();
      set({ stats });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  fetchMatchmakings: async () => {
    try {
      const matchmakings = await matchmakingApi.list();
      set({ matchmakings });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  createRoom: async (data) => {
    await roomsApi.create(data);
    await get().fetchRooms();
  },

  updateRoom: async (id, data) => {
    await roomsApi.update(id, data);
    await get().fetchRooms();
    await get().fetchStats();
  },

  deleteRoom: async (id) => {
    await roomsApi.remove(id);
    await get().fetchRooms();
    await get().fetchStats();
  },

  setRoomCleaningDone: async (id) => {
    await roomsApi.setCleaningDone(id);
    await get().fetchRooms();
    await get().fetchStats();
  },

  createBooking: async (data) => {
    await bookingsApi.create(data);
    await get().fetchBookings();
    await get().fetchRooms();
    await get().fetchStats();
  },

  updateBooking: async (id, data) => {
    await bookingsApi.update(id, data);
    await get().fetchBookings();
  },

  deleteBooking: async (id) => {
    await bookingsApi.remove(id);
    await get().fetchBookings();
    await get().fetchRooms();
    await get().fetchStats();
  },

  createProduct: async (data) => {
    await productsApi.create(data);
    await get().fetchProducts();
  },

  updateProduct: async (id, data) => {
    await productsApi.update(id, data);
    await get().fetchProducts();
  },

  deleteProduct: async (id) => {
    await productsApi.remove(id);
    await get().fetchProducts();
  },

  createOrder: async (data) => {
    const order = await ordersApi.create(data);
    await get().fetchActiveOrders();
    await get().fetchRooms();
    await get().fetchStats();
    return order;
  },

  updateOrderItems: async (id, items) => {
    await ordersApi.updateItems(id, items);
    await get().fetchActiveOrders();
  },

  checkoutOrder: async (id, data) => {
    const order = await ordersApi.checkout(id, data);
    await get().fetchActiveOrders();
    await get().fetchRooms();
    await get().fetchStats();
    return order;
  },

  getActiveOrderByRoom: (roomId) => {
    return get().activeOrders.find((o) => o.roomId === roomId);
  },

  createMatchmaking: async (data) => {
    await matchmakingApi.create(data);
    await get().fetchMatchmakings();
  },

  deleteMatchmaking: async (id) => {
    await matchmakingApi.remove(id);
    await get().fetchMatchmakings();
  },

  applyMatchmaking: async (id, data) => {
    await matchmakingApi.apply(id, data);
    await get().fetchMatchmakings();
  },

  updateApplicantStatus: async (matchmakingId, applicantId, status) => {
    await matchmakingApi.updateApplicantStatus(matchmakingId, applicantId, status);
    await get().fetchMatchmakings();
  },

  confirmMatchmaking: async (id, roomId) => {
    await matchmakingApi.confirm(id, roomId);
    await get().fetchMatchmakings();
    await get().fetchRooms();
  },

  cancelMatchmaking: async (id) => {
    await matchmakingApi.cancel(id);
    await get().fetchMatchmakings();
  },
}));
