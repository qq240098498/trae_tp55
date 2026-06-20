import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Room, Booking, Product, Order, Matchmaking, MatchmakingApplicant } from '../shared/types.js';
import { generateId } from '../shared/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

interface Database {
  rooms: Room[];
  bookings: Booking[];
  products: Product[];
  orders: Order[];
  matchmakings: Matchmaking[];
}

let db: Database = loadDatabase();

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDatabase(): Database {
  ensureDataDir();
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    } catch {
      return createInitialDatabase();
    }
  }
  const initial = createInitialDatabase();
  saveDatabase(initial);
  return initial;
}

function saveDatabase(data: Database = db) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function createInitialDatabase(): Database {
  const now = new Date().toISOString();
  const roomData = [
    { roomNumber: 'A101', type: 'mahjong' as const, capacity: 4, hourlyRate: 48 },
    { roomNumber: 'A102', type: 'mahjong' as const, capacity: 4, hourlyRate: 48 },
    { roomNumber: 'A103', type: 'mahjong' as const, capacity: 6, hourlyRate: 68 },
    { roomNumber: 'B201', type: 'poker' as const, capacity: 8, hourlyRate: 58 },
    { roomNumber: 'B202', type: 'poker' as const, capacity: 6, hourlyRate: 48 },
    { roomNumber: 'C301', type: 'werewolf' as const, capacity: 12, hourlyRate: 88 },
    { roomNumber: 'C302', type: 'werewolf' as const, capacity: 15, hourlyRate: 108 },
    { roomNumber: 'D401', type: 'script' as const, capacity: 8, hourlyRate: 128 },
    { roomNumber: 'D402', type: 'script' as const, capacity: 10, hourlyRate: 148 },
    { roomNumber: 'E501', type: 'ps5' as const, capacity: 4, hourlyRate: 38 },
    { roomNumber: 'E502', type: 'ps5' as const, capacity: 2, hourlyRate: 28 },
  ];

  const productData = [
    { name: '铁观音', category: 'tea' as const, price: 28, stock: 100 },
    { name: '普洱茶', category: 'tea' as const, price: 38, stock: 80 },
    { name: '菊花茶', category: 'tea' as const, price: 18, stock: 120 },
    { name: '绿茶', category: 'tea' as const, price: 22, stock: 100 },
    { name: '可乐', category: 'drink' as const, price: 8, stock: 200 },
    { name: '雪碧', category: 'drink' as const, price: 8, stock: 200 },
    { name: '矿泉水', category: 'drink' as const, price: 5, stock: 300 },
    { name: '红牛', category: 'drink' as const, price: 12, stock: 100 },
    { name: '薯片', category: 'snack' as const, price: 15, stock: 80 },
    { name: '瓜子', category: 'snack' as const, price: 12, stock: 150 },
    { name: '花生', category: 'snack' as const, price: 10, stock: 150 },
    { name: '水果拼盘', category: 'snack' as const, price: 58, stock: 30 },
  ];

  return {
    rooms: roomData.map((r) => ({
      id: generateId(),
      ...r,
      status: 'idle' as const,
      createdAt: now,
    })),
    bookings: [],
    products: productData.map((p) => ({
      id: generateId(),
      ...p,
      createdAt: now,
    })),
    orders: [],
    matchmakings: [],
  };
}

export const store = {
  getRooms(): Room[] {
    return db.rooms;
  },
  getRoomById(id: string): Room | undefined {
    return db.rooms.find((r) => r.id === id);
  },
  createRoom(data: Omit<Room, 'id' | 'createdAt' | 'status'>): Room {
    const room: Room = {
      ...data,
      id: generateId(),
      status: 'idle',
      createdAt: new Date().toISOString(),
    };
    db.rooms.push(room);
    saveDatabase();
    return room;
  },
  updateRoom(id: string, data: Partial<Omit<Room, 'id' | 'createdAt'>>): Room | undefined {
    const idx = db.rooms.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    db.rooms[idx] = { ...db.rooms[idx], ...data };
    saveDatabase();
    return db.rooms[idx];
  },
  deleteRoom(id: string): boolean {
    const idx = db.rooms.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    db.rooms.splice(idx, 1);
    saveDatabase();
    return true;
  },

  getBookings(): Booking[] {
    return db.bookings;
  },
  getBookingById(id: string): Booking | undefined {
    return db.bookings.find((b) => b.id === id);
  },
  createBooking(data: Omit<Booking, 'id' | 'createdAt' | 'status'>): Booking {
    const booking: Booking = {
      ...data,
      id: generateId(),
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    db.bookings.push(booking);
    saveDatabase();
    return booking;
  },
  updateBooking(id: string, data: Partial<Omit<Booking, 'id' | 'createdAt'>>): Booking | undefined {
    const idx = db.bookings.findIndex((b) => b.id === id);
    if (idx === -1) return undefined;
    db.bookings[idx] = { ...db.bookings[idx], ...data };
    saveDatabase();
    return db.bookings[idx];
  },
  deleteBooking(id: string): boolean {
    const idx = db.bookings.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    db.bookings.splice(idx, 1);
    saveDatabase();
    return true;
  },

  getProducts(): Product[] {
    return db.products;
  },
  getProductById(id: string): Product | undefined {
    return db.products.find((p) => p.id === id);
  },
  createProduct(data: Omit<Product, 'id' | 'createdAt'>): Product {
    const product: Product = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    db.products.push(product);
    saveDatabase();
    return product;
  },
  updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>): Product | undefined {
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    db.products[idx] = { ...db.products[idx], ...data };
    saveDatabase();
    return db.products[idx];
  },
  deleteProduct(id: string): boolean {
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    db.products.splice(idx, 1);
    saveDatabase();
    return true;
  },

  getOrders(): Order[] {
    return db.orders;
  },
  getActiveOrders(): Order[] {
    return db.orders.filter((o) => o.status === 'active');
  },
  getOrderById(id: string): Order | undefined {
    return db.orders.find((o) => o.id === id);
  },
  createOrder(data: Omit<Order, 'id' | 'createdAt' | 'status'>): Order {
    const order: Order = {
      ...data,
      id: generateId(),
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    db.orders.push(order);
    saveDatabase();
    return order;
  },
  updateOrder(id: string, data: Partial<Omit<Order, 'id' | 'createdAt'>>): Order | undefined {
    const idx = db.orders.findIndex((o) => o.id === id);
    if (idx === -1) return undefined;
    db.orders[idx] = { ...db.orders[idx], ...data };
    saveDatabase();
    return db.orders[idx];
  },

  getMatchmakings(): Matchmaking[] {
    return db.matchmakings;
  },
  getMatchmakingById(id: string): Matchmaking | undefined {
    return db.matchmakings.find((m) => m.id === id);
  },
  createMatchmaking(data: Omit<Matchmaking, 'id' | 'createdAt' | 'status' | 'applicants' | 'currentPeople'>): Matchmaking {
    const matchmaking: Matchmaking = {
      ...data,
      id: generateId(),
      status: 'recruiting',
      applicants: [],
      currentPeople: 1,
      createdAt: new Date().toISOString(),
    };
    db.matchmakings.push(matchmaking);
    saveDatabase();
    return matchmaking;
  },
  updateMatchmaking(id: string, data: Partial<Omit<Matchmaking, 'id' | 'createdAt'>>): Matchmaking | undefined {
    const idx = db.matchmakings.findIndex((m) => m.id === id);
    if (idx === -1) return undefined;
    db.matchmakings[idx] = { ...db.matchmakings[idx], ...data };
    saveDatabase();
    return db.matchmakings[idx];
  },
  deleteMatchmaking(id: string): boolean {
    const idx = db.matchmakings.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    db.matchmakings.splice(idx, 1);
    saveDatabase();
    return true;
  },
  addApplicant(matchmakingId: string, data: Omit<MatchmakingApplicant, 'id' | 'appliedAt' | 'status'>): Matchmaking | undefined {
    const idx = db.matchmakings.findIndex((m) => m.id === matchmakingId);
    if (idx === -1) return undefined;
    const applicant: MatchmakingApplicant = {
      ...data,
      id: generateId(),
      status: 'pending',
      appliedAt: new Date().toISOString(),
    };
    db.matchmakings[idx].applicants.push(applicant);
    saveDatabase();
    return db.matchmakings[idx];
  },
  updateApplicantStatus(matchmakingId: string, applicantId: string, status: MatchmakingApplicant['status']): Matchmaking | undefined {
    const mIdx = db.matchmakings.findIndex((m) => m.id === matchmakingId);
    if (mIdx === -1) return undefined;
    const aIdx = db.matchmakings[mIdx].applicants.findIndex((a) => a.id === applicantId);
    if (aIdx === -1) return undefined;
    const applicant = db.matchmakings[mIdx].applicants[aIdx];
    const oldStatus = applicant.status;
    db.matchmakings[mIdx].applicants[aIdx] = { ...applicant, status };
    if (oldStatus === 'approved' && status !== 'approved') {
      db.matchmakings[mIdx].currentPeople = Math.max(1, db.matchmakings[mIdx].currentPeople - applicant.peopleCount);
    }
    if (oldStatus !== 'approved' && status === 'approved') {
      db.matchmakings[mIdx].currentPeople += applicant.peopleCount;
    }
    if (db.matchmakings[mIdx].currentPeople >= db.matchmakings[mIdx].totalPeopleNeeded && db.matchmakings[mIdx].status === 'recruiting') {
      db.matchmakings[mIdx].status = 'full';
    }
    if (db.matchmakings[mIdx].currentPeople < db.matchmakings[mIdx].totalPeopleNeeded && db.matchmakings[mIdx].status === 'full') {
      db.matchmakings[mIdx].status = 'recruiting';
    }
    saveDatabase();
    return db.matchmakings[mIdx];
  },
  confirmMatchmaking(id: string, roomId: string): Matchmaking | undefined {
    const idx = db.matchmakings.findIndex((m) => m.id === id);
    if (idx === -1) return undefined;
    db.matchmakings[idx] = {
      ...db.matchmakings[idx],
      status: 'confirmed',
      roomId,
      confirmedAt: new Date().toISOString(),
    };
    saveDatabase();
    return db.matchmakings[idx];
  },
};
