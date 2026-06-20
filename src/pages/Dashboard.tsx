import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  Sofa,
  CalendarClock,
  Sparkles,
  Play,
  CalendarPlus,
  Eye,
  CheckCircle2,
  UserPlus,
  Clock,
  AlertTriangle,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  ROOM_TYPE_LABELS,
  ROOM_TYPE_ICONS,
  ROOM_STATUS_LABELS,
  type Room,
  type Order,
} from '@shared/types';
import { formatCurrency, calculateDuration, formatTime, getRemainingMinutes, formatRemainingTime } from '@shared/utils';
import Modal from '@/components/Modal';

const statusStyles: Record<string, { bg: string; bar: string; badge: string; text: string }> = {
  idle: {
    bg: 'from-green-50 to-emerald-50/50',
    bar: 'bg-gradient-to-r from-emerald-400 to-green-500',
    badge: 'bg-emerald-100 text-emerald-700',
    text: '空闲中',
  },
  occupied: {
    bg: 'from-coral-50 to-orange-50/50',
    bar: 'bg-gradient-to-r from-coral to-orange-500',
    badge: 'bg-coral-100 text-coral-700',
    text: '使用中',
  },
  reserved: {
    bg: 'from-gold-50 to-amber-50/50',
    bar: 'bg-gradient-to-r from-gold to-amber-500',
    badge: 'bg-gold-100 text-gold-700',
    text: '已预约',
  },
  cleaning: {
    bg: 'from-blue-50 to-sky-50/50',
    bar: 'bg-gradient-to-r from-sky-400 to-blue-500',
    badge: 'bg-sky-100 text-sky-700',
    text: '清理中',
  },
};

function RoomCard({
  room,
  activeOrder,
  onOpen,
  onBooking,
  onCleanDone,
}: {
  room: Room;
  activeOrder?: Order;
  onOpen: (room: Room) => void;
  onBooking: (room: Room) => void;
  onCleanDone: (roomId: string) => void | Promise<void>;
}) {
  const style = statusStyles[room.status];
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (room.status !== 'occupied' || !activeOrder) return;
    const update = () => {
      setElapsed(calculateDuration(activeOrder.startTime, new Date()));
      setRemaining(getRemainingMinutes(activeOrder.startTime, activeOrder.bookedHours));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [room.status, activeOrder]);

  const hours = Math.floor(elapsed / 60);
  const mins = Math.floor(elapsed % 60);
  const currentFee = Math.ceil(elapsed / 60) * room.hourlyRate + (activeOrder?.itemsAmount || 0);
  const isWarning = remaining !== null && remaining <= 15 && remaining > 0;
  const isOverdue = remaining !== null && remaining <= 0;

  const cardClass = isWarning
    ? 'ring-2 ring-amber-400 ring-offset-2 animate-pulse'
    : isOverdue
    ? 'ring-2 ring-red-400 ring-offset-2'
    : '';

  return (
    <div
      className={`card card-hover relative overflow-hidden group animate-fade-in-up ${cardClass}`}
      style={{ animationDelay: `${Math.random() * 0.3}s` }}
    >
      <div className={`h-2 ${isOverdue ? 'bg-gradient-to-r from-red-400 to-red-500' : isWarning ? 'bg-gradient-to-r from-amber-400 to-orange-500' : style.bar}`} />
      <div className={`p-5 bg-gradient-to-br ${style.bg}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{ROOM_TYPE_ICONS[room.type]}</span>
              <h3 className="font-serif text-xl font-bold text-primary">{room.roomNumber}</h3>
            </div>
            <p className="text-sm text-ink-500">
              {ROOM_TYPE_LABELS[room.type]} · 容纳{room.capacity}人
            </p>
          </div>
          <span className={`badge ${style.badge}`}>
            {room.status === 'occupied' && (
              <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
            )}
            {ROOM_STATUS_LABELS[room.status]}
          </span>
        </div>

        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-500">小时单价</span>
            <span className="font-semibold text-primary">{formatCurrency(room.hourlyRate)}</span>
          </div>
          {activeOrder && room.status === 'occupied' && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-500">已用时长</span>
                <span className="font-mono font-semibold text-ink-700 animate-tick" key={elapsed}>
                  {String(hours).padStart(2, '0')}:{String(mins).padStart(2, '0')}
                </span>
              </div>
              {remaining !== null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    剩余时间
                  </span>
                  <span
                    className={`font-mono font-semibold animate-tick ${
                      isOverdue
                        ? 'text-red-600'
                        : isWarning
                        ? 'text-amber-600'
                        : 'text-ink-700'
                    }`}
                    key={remaining}
                  >
                    {isOverdue ? '超时 ' : ''}
                    {formatRemainingTime(remaining)}
                  </span>
                </div>
              )}
              {activeOrder?.bookedHours && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-500">自动续费</span>
                  <span className={`font-semibold text-sm ${activeOrder.autoRenew ? 'text-emerald-600' : 'text-ink-400'}`}>
                    {activeOrder.autoRenew ? '已开启' : '已关闭'}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-500">客人数量</span>
                <span className="font-semibold text-ink-700">
                  <Users className="w-3.5 h-3.5 inline mr-1 text-gold" />
                  {activeOrder.customerCount}人
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-cream-300/50 mt-2">
                <span className="text-sm text-ink-500">当前消费</span>
                <span className="font-serif text-xl font-bold gold-gradient-text animate-tick" key={currentFee}>
                  {formatCurrency(currentFee)}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2">
          {room.status === 'idle' && (
            <>
              <button
                onClick={() => onOpen(room)}
                className="flex-1 btn-primary text-sm py-2 px-3 flex items-center justify-center gap-1.5"
              >
                <Play className="w-4 h-4" />
                开台
              </button>
              <button
                onClick={() => onBooking(room)}
                className="flex-1 btn-outline text-sm py-2 px-3 flex items-center justify-center gap-1.5"
              >
                <CalendarPlus className="w-4 h-4" />
                预约
              </button>
            </>
          )}
          {room.status === 'occupied' && activeOrder && (
            <button
              onClick={() => onOpen(room)}
              className="flex-1 btn-secondary text-sm py-2 px-3 flex items-center justify-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              查看/结算
            </button>
          )}
          {room.status === 'reserved' && (
            <button
              onClick={() => onOpen(room)}
              className="flex-1 btn-secondary text-sm py-2 px-3 flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              客人到店开台
            </button>
          )}
          {room.status === 'cleaning' && (
            <button
              onClick={() => onCleanDone(room.id)}
              className="flex-1 btn-secondary text-sm py-2 px-3 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              清理完成
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { rooms, activeOrders, stats, bookings, createOrder, setRoomCleaningDone, renewOrder, setOrderAutoRenew } = useStore();
  const [openModal, setOpenModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [customerCount, setCustomerCount] = useState(2);
  const [customerName, setCustomerName] = useState('');
  const [mode, setMode] = useState<'open' | 'booking'>('open');
  const [bookedHours, setBookedHours] = useState<number>(2);
  const [enableBookedHours, setEnableBookedHours] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderOrder, setReminderOrder] = useState<Order | null>(null);
  const remindedOrdersRef = useRef<Set<string>>(new Set());

  const getActiveOrder = (roomId: string) => activeOrders.find((o) => o.roomId === roomId);

  useEffect(() => {
    const checkReminders = () => {
      for (const order of activeOrders) {
        if (!order.bookedHours) continue;
        const remaining = getRemainingMinutes(order.startTime, order.bookedHours);
        if (remaining === null) continue;

        if (remaining <= 15 && remaining > 0 && !remindedOrdersRef.current.has(order.id)) {
          remindedOrdersRef.current.add(order.id);
          setReminderOrder(order);
          setReminderModalOpen(true);
        }

        if (remaining <= 0 && order.autoRenew && !remindedOrdersRef.current.has(`renew_${order.id}`)) {
          remindedOrdersRef.current.add(`renew_${order.id}`);
          renewOrder(order.id, 1).catch(() => {});
        }
      }
    };

    checkReminders();
    const timer = setInterval(checkReminders, 30000);
    return () => clearInterval(timer);
  }, [activeOrders, renewOrder]);

  const handleReminderRenew = async (hours: number = 1) => {
    if (!reminderOrder) return;
    try {
      await renewOrder(reminderOrder.id, hours);
      remindedOrdersRef.current.delete(reminderOrder.id);
      setReminderModalOpen(false);
      setReminderOrder(null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleReminderDisableAutoRenew = async () => {
    if (!reminderOrder) return;
    try {
      await setOrderAutoRenew(reminderOrder.id, false);
      setReminderModalOpen(false);
      setReminderOrder(null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleReminderCheckout = () => {
    if (!reminderOrder) return;
    setReminderModalOpen(false);
    navigate(`/checkout/${reminderOrder.id}`);
  };

  const handleOpenRoom = (room: Room) => {
    if (room.status === 'occupied') {
      const order = getActiveOrder(room.id);
      if (order) navigate(`/checkout/${order.id}`);
      return;
    }
    if (room.status === 'reserved') {
      const booking = bookings.find(
        (b) => b.roomId === room.id && b.status === 'confirmed'
      );
      setSelectedRoom(room);
      setMode('open');
      setCustomerCount(Math.max(2, Math.floor(room.capacity / 2)));
      setCustomerName(booking?.customerName || '');
      setEnableBookedHours(false);
      setBookedHours(2);
      setAutoRenew(true);
      setOpenModal(true);
      return;
    }
    setSelectedRoom(room);
    setMode('open');
    setCustomerCount(Math.max(2, Math.floor(room.capacity / 2)));
    setCustomerName('');
    setEnableBookedHours(false);
    setBookedHours(2);
    setAutoRenew(true);
    setOpenModal(true);
  };

  const handleBookingRoom = (room: Room) => {
    navigate('/bookings');
  };

  const handleConfirm = async () => {
    if (!selectedRoom) return;
    try {
      const booking = bookings.find(
        (b) => b.roomId === selectedRoom.id && b.status === 'confirmed'
      );
      const order = await createOrder({
        roomId: selectedRoom.id,
        customerName: customerName || undefined,
        customerCount,
        source: booking ? 'booking' : 'walkin',
        bookingId: booking?.id,
        bookedHours: enableBookedHours ? bookedHours : undefined,
        autoRenew: enableBookedHours ? autoRenew : true,
      });
      setOpenModal(false);
      navigate(`/checkout/${order.id}`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="stat-card animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-gold/20 to-gold-500/5" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm text-ink-500 mb-1">今日营收</p>
              <p className="font-serif text-3xl font-bold gold-gradient-text">
                {formatCurrency(stats?.todayRevenue || 0)}
              </p>
              <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                已完成 {stats?.todayOrders || 0} 笔订单
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold to-gold-600 flex items-center justify-center shadow-gold">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="stat-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-coral/20 to-orange-500/5" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm text-ink-500 mb-1">使用中</p>
              <p className="font-serif text-3xl font-bold text-coral">{stats?.occupiedRooms || 0}</p>
              <p className="text-xs text-ink-400 mt-2">当前进行中的包间</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-coral to-orange-500 flex items-center justify-center shadow-lg shadow-coral/30">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-card animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400/20 to-green-500/5" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm text-ink-500 mb-1">空闲包间</p>
              <p className="font-serif text-3xl font-bold text-emerald-600">{stats?.idleRooms || 0}</p>
              <p className="text-xs text-ink-400 mt-2">可立即开台使用</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Sofa className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-card animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-gold/20 to-amber-500/5" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-sm text-ink-500 mb-1">今日预约</p>
              <p className="font-serif text-3xl font-bold text-gold-600">{stats?.reservedRooms || 0}</p>
              <p className="text-xs text-ink-400 mt-2">待开台包间</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center shadow-gold">
              <CalendarClock className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-serif text-xl font-bold text-primary flex items-center gap-2">
            <Sofa className="w-6 h-6 text-gold" />
            包间状态实时看板
          </h3>
          <p className="text-sm text-ink-400">共 {rooms.length} 个包间 · 每10秒自动刷新</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              activeOrder={getActiveOrder(room.id)}
              onOpen={handleOpenRoom}
              onBooking={handleBookingRoom}
              onCleanDone={setRoomCleaningDone}
            />
          ))}
        </div>
      </div>

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={mode === 'open' ? '确认开台' : '创建预约'}
        size="sm"
      >
        <div className="space-y-5">
          {selectedRoom && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cream-50 to-gold-50 border border-gold-200/50">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{ROOM_TYPE_ICONS[selectedRoom.type]}</span>
                <div>
                  <h4 className="font-serif text-lg font-bold text-primary">
                    {selectedRoom.roomNumber}
                  </h4>
                  <p className="text-sm text-ink-500">
                    {ROOM_TYPE_LABELS[selectedRoom.type]} · 容纳{selectedRoom.capacity}人 · {formatCurrency(selectedRoom.hourlyRate)}/小时
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">客人姓名</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="input-field"
                placeholder="选填"
              />
            </div>
            <div>
              <label className="label-text">客人数量</label>
              <input
                type="number"
                min={1}
                max={selectedRoom?.capacity || 20}
                value={customerCount}
                onChange={(e) => setCustomerCount(Number(e.target.value))}
                className="input-field"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="label-text mb-0 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold" />
                预定时长
              </label>
              <button
                onClick={() => setEnableBookedHours(!enableBookedHours)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  enableBookedHours ? 'bg-primary' : 'bg-ink-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    enableBookedHours ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
            {enableBookedHours && (
              <div className="space-y-3 p-4 rounded-xl bg-cream-50 border border-gold-200/50">
                <div>
                  <label className="label-text">选择时长（小时）</label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[1, 2, 3, 4].map((h) => (
                      <button
                        key={h}
                        onClick={() => setBookedHours(h)}
                        className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                          bookedHours === h
                            ? 'bg-primary text-gold shadow'
                            : 'bg-white text-ink-600 border border-cream-200 hover:border-gold-300'
                        }`}
                      >
                        {h}小时
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-600">自动续费（超时自动续1小时）</span>
                  <button
                    onClick={() => setAutoRenew(!autoRenew)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      autoRenew ? 'bg-emerald-500' : 'bg-ink-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        autoRenew ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-ink-400">
                  预计费用：{formatCurrency((selectedRoom?.hourlyRate || 0) * bookedHours)}
                </p>
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-cream-50 text-sm text-ink-500">
            <p>开台时间：{formatTime(new Date())}</p>
            <p className="mt-1">计费方式：按小时计费，不足1小时按1小时计算</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setOpenModal(false)} className="flex-1 btn-ghost">
              取消
            </button>
            <button onClick={handleConfirm} className="flex-1 btn-primary">
              确认开台
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        title="时长即将到期提醒"
        size="md"
      >
        {reminderOrder && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-serif text-lg font-bold text-primary mb-1">
                  您的使用时长即将到期
                </h4>
                <p className="text-sm text-ink-500">
                  {rooms.find((r) => r.id === reminderOrder.roomId)?.roomNumber} 包间
                  {reminderOrder.customerName && ` · ${reminderOrder.customerName}`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-cream-50 text-center">
                <p className="text-xs text-ink-500 mb-1">剩余时间</p>
                <p className="font-mono text-2xl font-bold text-amber-600">
                  {formatRemainingTime(
                    getRemainingMinutes(
                      reminderOrder.startTime,
                      reminderOrder.bookedHours
                    ) || 0
                  )}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-cream-50 text-center">
                <p className="text-xs text-ink-500 mb-1">自动续费状态</p>
                <p className={`text-lg font-bold ${
                  reminderOrder.autoRenew ? 'text-emerald-600' : 'text-ink-400'
                }`}>
                  {reminderOrder.autoRenew ? '已开启' : '已关闭'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-ink-700">选择续时时长：</p>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((h) => (
                  <button
                    key={h}
                    onClick={() => handleReminderRenew(h)}
                    className="py-3 rounded-xl bg-gradient-to-br from-primary to-primary-700 text-gold font-semibold shadow-gold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    续{h}小时
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {reminderOrder.autoRenew ? (
                <button
                  onClick={handleReminderDisableAutoRenew}
                  className="py-3 rounded-xl border-2 border-ink-200 text-ink-600 font-medium hover:border-red-300 hover:text-red-600 transition-all flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  关闭自动续费
                </button>
              ) : (
                <button
                  onClick={async () => {
                    if (!reminderOrder) return;
                    await setOrderAutoRenew(reminderOrder.id, true);
                  }}
                  className="py-3 rounded-xl border-2 border-emerald-300 text-emerald-600 font-medium hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  开启自动续费
                </button>
              )}
              <button
                onClick={handleReminderCheckout}
                className="py-3 rounded-xl bg-gradient-to-br from-coral to-orange-500 text-white font-medium shadow-lg shadow-coral/30 flex items-center justify-center gap-2"
              >
                立即结算
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
