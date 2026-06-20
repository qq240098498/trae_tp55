export type RoomType = 'mahjong' | 'poker' | 'werewolf' | 'script' | 'ps5';
export type RoomStatus = 'idle' | 'occupied' | 'reserved' | 'cleaning';

export interface PackageRate {
  hours: number;
  price: number;
}

export interface Room {
  id: string;
  roomNumber: string;
  type: RoomType;
  capacity: number;
  hourlyRate: number;
  packageRate?: PackageRate[];
  status: RoomStatus;
  createdAt: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  roomId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  deposit: number;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
}

export type ProductCategory = 'tea' | 'snack' | 'drink' | 'other';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  stock: number;
  image?: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export type PaymentMethod = 'cash' | 'wechat' | 'alipay' | 'card';
export type OrderStatus = 'active' | 'completed' | 'cancelled';
export type OrderSource = 'walkin' | 'booking';

export interface Order {
  id: string;
  roomId: string;
  customerName?: string;
  customerCount: number;
  startTime: string;
  endTime?: string;
  durationHours?: number;
  bookedHours?: number;
  autoRenew: boolean;
  baseAmount: number;
  items: OrderItem[];
  itemsAmount: number;
  discount?: number;
  totalAmount: number;
  paidAmount?: number;
  paymentMethod?: PaymentMethod;
  status: OrderStatus;
  source: OrderSource;
  bookingId?: string;
  createdAt: string;
  completedAt?: string;
  renewCount: number;
}

export interface Stats {
  todayRevenue: number;
  todayOrders: number;
  occupiedRooms: number;
  idleRooms: number;
  reservedRooms: number;
  cleaningRooms: number;
}

export type MatchmakingStatus = 'recruiting' | 'full' | 'confirmed' | 'cancelled';

export interface MatchmakingApplicant {
  id: string;
  name: string;
  phone: string;
  peopleCount: number;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
}

export interface Matchmaking {
  id: string;
  roomType: RoomType;
  roomId?: string;
  hostName: string;
  hostPhone: string;
  totalPeopleNeeded: number;
  currentPeople: number;
  note?: string;
  status: MatchmakingStatus;
  applicants: MatchmakingApplicant[];
  createdAt: string;
  confirmedAt?: string;
}

export const MATCHMAKING_STATUS_LABELS: Record<MatchmakingStatus, string> = {
  recruiting: '招募中',
  full: '已满员',
  confirmed: '已成局',
  cancelled: '已取消',
};

export const APPLICANT_STATUS_LABELS: Record<MatchmakingApplicant['status'], string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
};

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  mahjong: '麻将',
  poker: '扑克',
  werewolf: '狼人杀',
  script: '剧本杀',
  ps5: 'PS5',
};

export const ROOM_TYPE_ICONS: Record<RoomType, string> = {
  mahjong: '🀄',
  poker: '🎴',
  werewolf: '🐺',
  script: '📜',
  ps5: '🎮',
};

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  idle: '空闲',
  occupied: '使用中',
  reserved: '已预约',
  cleaning: '清理中',
};

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  tea: '茶水',
  snack: '零食',
  drink: '饮品',
  other: '其他',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: '现金',
  wechat: '微信支付',
  alipay: '支付宝',
  card: '银行卡',
};

export interface CustomerPreference {
  id: string;
  customerPhone: string;
  customerName: string;
  preferredRoomIds: { roomId: string; count: number }[];
  preferredRoomTypes: { type: RoomType; count: number }[];
  preferredTea: string;
  seatPreference: string;
  visitCount: number;
  lastVisitAt: string;
  createdAt: string;
  updatedAt: string;
}

export const CUSTOMER_PREFERENCE_TEA_OPTIONS = ['铁观音', '普洱茶', '菊花茶', '绿茶', '可乐', '雪碧', '矿泉水', '红牛'];
