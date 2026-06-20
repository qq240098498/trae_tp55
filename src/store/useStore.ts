import { create } from 'zustand';
import type { Room, Booking, Product, Order, Stats, OrderItem } from '@shared/types';
import { roomsApi, bookingsApi, productsApi, ordersApi, statsApi } from '@/lib/api';

interface AppState {
  rooms: Room[];
  bookings: Booking[];
  products: Product[];
  orders: Order[];
  activeOrders: Order[];
  stats: Stats | null;
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  fetchRooms: () => Promise<void>;
  fetchBookings: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchActiveOrders: () => Promise<void>;
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
}

export const useStore = create<AppState>((set, get) => ({
  rooms: [],
  bookings: [],
  products: [],
  orders: [],
  activeOrders: [],
  stats: null,
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const [rooms, bookings, products, activeOrders, stats] = await Promise.all([
        roomsApi.list(),
        bookingsApi.list(),
        productsApi.list(),
        ordersApi.active(),
        statsApi.get(),
      ]);
      set({ rooms, bookings, products, activeOrders, stats, loading: false });
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
}));
