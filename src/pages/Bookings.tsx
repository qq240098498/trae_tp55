import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle,
  Phone,
  User,
  Clock,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  ROOM_TYPE_LABELS,
  ROOM_TYPE_ICONS,
  type Booking,
  type BookingStatus,
} from '@shared/types';
import { formatCurrency, formatDate } from '@shared/utils';
import Modal from '@/components/Modal';

const statusStyles: Record<BookingStatus, string> = {
  pending: 'bg-sky-100 text-sky-700',
  confirmed: 'bg-gold-100 text-gold-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-ink-100 text-ink-500',
};

const statusLabels: Record<BookingStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  completed: '已开台',
  cancelled: '已取消',
};

export default function Bookings() {
  const navigate = useNavigate();
  const { bookings, rooms, createBooking, updateBooking, deleteBooking, createOrder } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'all'>('all');
  const [currentDate, setCurrentDate] = useState(new Date());

  const todayStr = formatDate(new Date());
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const daysInMonth = monthEnd.getDate();
  const firstDayWeekday = monthStart.getDay();

  const today = () => formatDate(new Date());

  const formInitial = {
    roomId: rooms[0]?.id || '',
    customerName: '',
    customerPhone: '',
    date: todayStr,
    startTime: '14:00',
    endTime: '18:00',
    deposit: 100,
    notes: '',
  };

  const [form, setForm] = useState(formInitial);

  const sortedBookings = useMemo(
    () =>
      [...bookings]
        .filter((b) => {
          const match =
            b.customerName.includes(search) ||
            b.customerPhone.includes(search) ||
            rooms.find((r) => r.id === b.roomId)?.roomNumber.includes(search);
          const matchStatus = filterStatus === 'all' || b.status === filterStatus;
          return match && matchStatus;
        })
        .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)),
    [bookings, rooms, search, filterStatus]
  );

  const getBookingsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return bookings.filter((b) => b.date === dateStr && b.status !== 'cancelled');
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...formInitial, roomId: rooms[0]?.id || '' });
    setModalOpen(true);
  };

  const openEdit = (booking: Booking) => {
    setEditing(booking);
    setForm({
      roomId: booking.roomId,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      deposit: booking.deposit,
      notes: booking.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.customerName.trim()) return alert('请输入客户姓名');
    if (!form.customerPhone.trim()) return alert('请输入联系电话');
    if (!form.roomId) return alert('请选择包间');
    try {
      if (editing) {
        await updateBooking(editing.id, form);
      } else {
        await createBooking(form);
      }
      setModalOpen(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCheckIn = async (booking: Booking) => {
    try {
      const order = await createOrder({
        roomId: booking.roomId,
        customerName: booking.customerName,
        customerCount: 4,
        source: 'booking',
        bookingId: booking.id,
      });
      navigate(`/checkout/${order.id}`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const renderDay = (day: number, weekday: number) => {
    if (day === 0) {
      return (
        <div key={`empty-${weekday}`} className="h-28 bg-cream-50/30 rounded-xl border border-dashed border-cream-200" />
      );
    }
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = formatDate(date);
    const dayBookings = getBookingsForDate(date);
    const isToday = dateStr === today();

    return (
      <div
        key={day}
        className={`h-28 rounded-xl border-2 transition-all p-2 overflow-hidden ${
          isToday
            ? 'bg-gradient-to-br from-gold-50 to-amber-50 border-gold-300 shadow-gold'
            : 'bg-white/60 border-cream-200 hover:border-gold-200 hover:shadow-card'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span
            className={`font-serif font-bold text-sm ${
              isToday ? 'text-primary' : 'text-ink-600'
            }`}
          >
            {day}
          </span>
          {dayBookings.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-coral-100 text-coral-700">
              {dayBookings.length}
            </span>
          )}
        </div>
        <div className="space-y-1">
          {dayBookings.slice(0, 2).map((b) => {
            const room = rooms.find((r) => r.id === b.roomId);
            return (
              <div
                key={b.id}
                className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary-50 text-primary truncate cursor-pointer hover:bg-primary hover:text-gold transition-colors"
                title={`${room?.roomNumber} ${b.customerName} ${b.startTime}-${b.endTime}`}
                onClick={() => openEdit(b)}
              >
                {b.startTime} {room?.roomNumber}
              </div>
            );
          })}
          {dayBookings.length > 2 && (
            <div className="text-[10px] text-ink-400 pl-1">+{dayBookings.length - 2} 更多</div>
          )}
        </div>
      </div>
    );
  };

  const calendarDays = [];
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(renderDay(0, i));
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(renderDay(d, (firstDayWeekday + d - 1) % 7));
  }

  return (
    <div className="space-y-6">
      <div className="card p-5 flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索客户姓名/电话/包间号..."
              className="input-field pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as BookingStatus | 'all')}
            className="select-field min-w-[140px]"
          >
            <option value="all">全部状态</option>
            {(Object.keys(statusLabels) as BookingStatus[]).map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4.5 h-4.5" />
          新增预约
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="card p-6 xl:col-span-3">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-600 flex items-center justify-center shadow-gold">
                <CalendarIcon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-serif text-xl font-bold text-primary">
                {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-cream text-ink-500 hover:text-primary transition-colors"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-cream text-ink-500 hover:text-primary transition-colors"
              >
                今天
              </button>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-cream text-ink-500 hover:text-primary transition-colors"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-ink-400 py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">{calendarDays}</div>
        </div>

        <div className="card p-6 xl:col-span-2">
          <h3 className="font-serif text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold" />
            预约列表
            <span className="ml-auto text-sm font-normal text-ink-400">
              共 {sortedBookings.length} 条
            </span>
          </h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {sortedBookings.map((booking, idx) => {
              const room = rooms.find((r) => r.id === booking.roomId);
              return (
                <div
                  key={booking.id}
                  className="p-4 rounded-2xl bg-gradient-to-br from-white to-cream-50 border border-cream-200 hover:shadow-card transition-all animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.03}s` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-50 to-cream flex items-center justify-center text-lg">
                        {room ? ROOM_TYPE_ICONS[room.type] : '🏠'}
                      </div>
                      <div>
                        <p className="font-serif font-bold text-primary">
                          {room?.roomNumber || '未知包间'}
                        </p>
                        <p className="text-xs text-ink-400">
                          {room ? ROOM_TYPE_LABELS[room.type] : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`badge ${statusStyles[booking.status]}`}>
                      {statusLabels[booking.status]}
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-ink-600">
                      <User className="w-3.5 h-3.5 text-gold" />
                      {booking.customerName}
                    </div>
                    <div className="flex items-center gap-2 text-ink-600">
                      <Phone className="w-3.5 h-3.5 text-gold" />
                      {booking.customerPhone}
                    </div>
                    <div className="flex items-center gap-2 text-ink-600">
                      <CalendarIcon className="w-3.5 h-3.5 text-gold" />
                      {booking.date} {booking.startTime} - {booking.endTime}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-cream-200">
                    <span className="font-serif font-bold text-gold-700">
                      定金 {formatCurrency(booking.deposit)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleCheckIn(booking)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          到店开台
                        </button>
                      )}
                      {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                        <>
                          <button
                            onClick={() => openEdit(booking)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-gold-100 hover:text-gold-700 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm('确定取消此预约？')) return;
                              await deleteBooking(booking.id);
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-coral-100 hover:text-coral transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {sortedBookings.length === 0 && (
              <div className="py-16 text-center text-ink-400">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-5xl opacity-40">📅</div>
                  <p>暂无预约记录</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? '编辑预约' : '新增预约'}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">选择包间</label>
              <select
                value={form.roomId}
                onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                className="select-field"
              >
                {rooms
                  .filter((r) => r.status === 'idle' || r.id === editing?.roomId)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {ROOM_TYPE_ICONS[r.type]} {r.roomNumber} - {ROOM_TYPE_LABELS[r.type]} ({formatCurrency(r.hourlyRate)}/时)
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="label-text">定金 (元)</label>
              <input
                type="number"
                min={0}
                value={form.deposit}
                onChange={(e) => setForm({ ...form, deposit: Number(e.target.value) })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">客户姓名</label>
              <input
                type="text"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className="input-field"
                placeholder="请输入姓名"
              />
            </div>
            <div>
              <label className="label-text">联系电话</label>
              <input
                type="tel"
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                className="input-field"
                placeholder="请输入手机号"
              />
            </div>
          </div>

          <div>
            <label className="label-text">预约日期</label>
            <input
              type="date"
              value={form.date}
              min={todayStr}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">开始时间</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-text">结束时间</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="label-text">备注</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input-field resize-none"
              rows={2}
              placeholder="特殊要求等..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 btn-ghost">
              取消
            </button>
            <button onClick={handleSubmit} className="flex-1 btn-primary">
              {editing ? '保存修改' : '创建预约'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
